<template>
  <div class="card mb-3">
    <!-- Shared post indicator -->
    <div v-if="post.sharedFromId && sharingUser" class="card-header bg-light">
      <div class="d-flex align-items-center">
        <router-link :to="`/profile/${sharingUser.id}`" class="d-flex align-items-center text-decoration-none">
          <img :src="sharingUser.avatar" :alt="sharingUser.name" class="rounded-circle me-2" width="24" height="24">
          <small class="text-muted">{{ sharingUser.name }} {{ t('post.sharedPost') }}</small>
        </router-link>
      </div>
    </div>

    <div class="card-body">
      <!-- Author info -->
      <div class="d-flex align-items-center mb-3">
        <router-link :to="`/profile/${displayAuthor.id}`" class="d-flex align-items-center text-decoration-none">
          <img :src="displayAuthor.avatar" :alt="displayAuthor.name" class="rounded-circle me-2" width="40" height="40">
          <div>
            <h6 class="mb-0 text-dark">{{ displayAuthor.name }}</h6>
            <small class="text-muted">
              {{ formattedDate }}
              <i :class="['bi', privacyIcon, 'ms-1']" :title="privacyTooltip"></i>
            </small>
          </div>
        </router-link>
      </div>

      <!-- Translation controls -->
      <div v-if="translationEnabled && (translatedPost || localTranslating)" class="mb-2">
        <div class="d-flex align-items-center gap-2">
          <div v-if="localTranslating" class="d-flex align-items-center text-muted">
            <div class="spinner-border spinner-border-sm me-2" role="status">
              <span class="visually-hidden">{{ t('common.loading') }}</span>
            </div>
            <small>{{ t('translation.translating') }}</small>
          </div>
          <div v-else-if="translatedPost" class="d-flex align-items-center gap-2">
            <small class="text-muted">
              <i class="bi bi-translate me-1"></i>
              {{ showOriginal ? t('translation.showingOriginal') : t('translation.translated') }}
            </small>
            <button 
              @click="toggleOriginal"
              class="btn btn-sm translation-toggle-btn"
            >
              {{ showOriginal ? t('translation.showTranslated') : t('translation.showOriginal') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Post content -->
      <h5 class="card-title">{{ displayPost.title }}</h5>
      <p class="card-text">
        <span v-if="!isContentExpanded && displayPost.content.length > 100">
          {{ displayPost.content.substring(0, 100) }}...
          <a href="#" @click.prevent="isContentExpanded = true" class="text-primary fw-semibold">{{ t('post.readMore') }}</a>
        </span>
        <span v-else>{{ displayPost.content }}</span>
      </p>

      <!-- Sentiment Analysis -->
      <div v-if="post.sentiment" class="mb-2">
        <SentimentBadge 
          :sentiment="post.sentiment" 
          :confidence="post.sentiment_score"
          :show-confidence="true"
          size="small"
        />
      </div>
      
      <!-- Always show analyze button for testing -->
      <div v-if="!post.sentiment" class="mb-2">
        <button 
          @click="handleAnalyzeSentiment"
          :disabled="isAnalyzingSentiment"
          class="btn btn-sm btn-outline-info"
        >
          <span v-if="isAnalyzingSentiment" class="spinner-border spinner-border-sm me-1" role="status"></span>
          {{ isAnalyzingSentiment ? `🔍 ${t('sentiment.analyzing')}` : `🎭 ${t('sentiment.analyze')}` }}
        </button>
      </div>
    </div>

    <!-- Post images (outside card-body for full width) -->
    <div v-if="displayImages.length === 1" class="post-image-container">
      <img :src="displayImages[0]" class="post-image" :alt="displayPost.title">
    </div>

    <div v-else-if="displayImages.length > 1" :class="['post-images-grid', displayImages.length === 2 ? 'two' : displayImages.length === 3 ? 'three' : displayImages.length === 4 ? 'four' : '']">
      <div v-for="(src, idx) in displayImages" :key="idx" class="post-image-cell">
        <img :src="src" class="post-image-multi" :alt="displayPost.title" />
      </div>
    </div>

    <div class="card-body pt-0">

      <!-- Interaction stats -->
      <div class="d-flex justify-content-between align-items-center mb-3 text-muted">
        <small>{{ likeCount }} {{ t('post.likes') }}</small>
        <div class="d-flex gap-3">
          <small>{{ shareCount }} {{ t('post.shares') }}</small>
          <small 
            class="comments-toggle" 
            @click="openCommentsModal"
            style="cursor: pointer; user-select: none;"
          >
            {{ commentCount }} {{ t('post.comments') }}
          </small>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="d-flex justify-content-between align-items-center gap-2 mb-3">
        <div class="d-flex gap-2">
          <LikeButton :postId="post.sharedFromId || post.id" @like-toggled="handleLikeToggled" />
          <ShareButton :postId="post.sharedFromId || post.id" @share-created="handleShareCreated" />
        </div>
        
        <!-- Edit/Delete buttons for post owner -->
        <div v-if="isOwner" class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" @click="handleEdit">
            {{ t('post.edit') }}
          </button>
          <button class="btn btn-sm btn-outline-danger" @click="handleDelete">
            {{ t('post.delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Comment Modal -->
    <CommentModal
      :show="showCommentsModal"
      :post="originalPost || post"
      :author="displayAuthor"
      @close="showCommentsModal = false"
      @comment-created="handleCommentCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Post, User } from '../types'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'
import { useContentTranslation } from '../composables/useContentTranslation'
import { useLikes } from '../composables/useLikes'
import { useShares } from '../composables/useShares'
// @ts-ignore
import { useSentimentAnalysis } from '../composables/useSentimentAnalysis'
import { apiService } from '../services/apiService'
import LikeButton from './LikeButton.vue'
import ShareButton from './ShareButton.vue'
import CommentModal from './CommentModal.vue'
// @ts-ignore
import SentimentBadge from './SentimentBadge.vue'

interface Props {
  post: Post
  author: User
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [postId: string]
  delete: [postId: string]
}>()

const { currentUser } = useAuth()
const { t, locale } = useLocale()
const { translatePost, translationEnabled } = useContentTranslation()
const { getLikeCount } = useLikes()
const { getShareCount } = useShares()
const { isAnalyzing: isAnalyzingSentiment, analyzePostSentiment, error } = useSentimentAnalysis()

const likeCount = ref(0)
const shareCount = ref(0)
const commentCount = ref(0)
const sharingUser = ref<User | null>(null)
const originalPost = ref<Post | null>(null)
const originalAuthor = ref<User | null>(null)
const showCommentsModal = ref(false) // Modal for comments
const isContentExpanded = ref(false) // Content expansion state
const translatedPost = ref<Post | null>(null)
const showOriginal = ref(false)

// Check if current user is the post owner (or sharing user for shared posts)
const isOwner = computed(() => {
  return currentUser.value?.id === props.post.userId
})

// Get the display author (original author for shared posts, otherwise the post author)
const displayAuthor = computed(() => {
  return originalAuthor.value || props.author
})

// Get the display post (translated, original, or shared post)
const displayPost = computed(() => {
  const basePost = originalPost.value || props.post
  
  if (!translationEnabled.value || showOriginal.value) {
    return basePost
  }
  
  return translatedPost.value || basePost
})

// Normalize images for display (support legacy single `image` field)
const displayImages = computed(() => {
  const p: any = displayPost.value || {}
  if (Array.isArray(p.images) && p.images.length) return p.images
  if (p.image) return [p.image]
  return []
})

// Format the creation date
const formattedDate = computed(() => {
  const date = new Date(props.post.createdAt)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Get privacy icon based on post privacy setting
const privacyIcon = computed(() => {
  const privacy = props.post.privacy || 'public'
  switch (privacy) {
    case 'public':
      return 'bi-globe'
    case 'friends':
      return 'bi-people-fill'
    case 'private':
      return 'bi-lock-fill'
    default:
      return 'bi-globe'
  }
})

// Get privacy tooltip text
const privacyTooltip = computed(() => {
  const privacy = props.post.privacy || 'public'
  switch (privacy) {
    case 'public':
      return t('privacy.public')
    case 'friends':
      return t('privacy.friends')
    case 'private':
      return t('privacy.private')
    default:
      return t('privacy.public')
  }
})

// Check if current user can analyze sentiment (post owner or any logged in user)
const canAnalyzeSentiment = computed(() => {
  const result = currentUser.value && (
    currentUser.value.id === props.post.userId || 
    true // Allow any logged in user to analyze sentiment
  )
  console.log('canAnalyzeSentiment:', result, 'currentUser:', currentUser.value, 'post.sentiment:', props.post.sentiment)
  return result
})

// Handle sentiment analysis
const handleAnalyzeSentiment = async () => {
  if (!canAnalyzeSentiment.value) return
  
  const success = await analyzePostSentiment(props.post)
  if (success) {
    // Không cần reload - post đã được cập nhật reactive
    console.log('✅ Sentiment analysis completed successfully!')
  } else {
    console.error('❌ Sentiment analysis failed:', error.value)
  }
}

// Load interaction counts
const loadCounts = async () => {
  try {
    // For shared posts, show counts from the original post
    const postIdForCounts = props.post.sharedFromId || props.post.id
    
    likeCount.value = await getLikeCount(postIdForCounts)
    shareCount.value = await getShareCount(postIdForCounts)
    
    // Get comment count without loading all comments
    const allComments = await apiService.getCommentsByPostId(postIdForCounts)
    commentCount.value = allComments.length
  } catch (error) {
    console.error('Failed to load counts:', error)
  }
}

// Open comments modal
const openCommentsModal = () => {
  showCommentsModal.value = true
}

// Handle comment created event
const handleCommentCreated = async () => {
  await loadCounts()
}

// Load sharing user and original post if this is a shared post
const loadSharingUser = async () => {
  if (props.post.sharedFromId) {
    try {
      // Load the sharing user (the person who shared the post)
      sharingUser.value = await apiService.getUserById(props.post.userId)
      
      // Load the original post
      originalPost.value = await apiService.getPostById(props.post.sharedFromId)
      
      // Load the original author
      if (originalPost.value) {
        originalAuthor.value = await apiService.getUserById(originalPost.value.userId)
      }
    } catch (error) {
      console.error('Failed to load sharing user or original post:', error)
    }
  }
}

const handleLikeToggled = async () => {
  await loadCounts()
}

const handleShareCreated = async () => {
  await loadCounts()
}

const handleEdit = () => {
  emit('edit', props.post.id)
}

const handleDelete = () => {
  emit('delete', props.post.id)
}

// Toggle between original and translated content
const toggleOriginal = () => {
  showOriginal.value = !showOriginal.value
}

// Local translating state for this post
const localTranslating = ref(false)

// Translate post content
const translatePostContent = async () => {
  if (!translationEnabled.value || localTranslating.value) return
  
  const postToTranslate = originalPost.value || props.post
  
  try {
    localTranslating.value = true
    const result = await translatePost(postToTranslate)
    if (result.isTranslated) {
      translatedPost.value = result
      showOriginal.value = false
    }
  } catch (error) {
    console.error('Error translating post:', error)
  } finally {
    localTranslating.value = false
  }
}

// Watch for locale changes to re-translate
watch(locale, () => {
  if (translationEnabled.value) {
    // Reset and re-translate when locale changes
    translatedPost.value = null
    showOriginal.value = false
    translatePostContent()
  }
})

// Watch for translation enabled changes
watch(translationEnabled, (enabled) => {
  if (enabled && !translatedPost.value) {
    translatePostContent()
  } else if (!enabled) {
    showOriginal.value = false
  }
})

onMounted(() => {
  loadCounts()
  loadSharingUser()
  
  // Auto-translate if translation is enabled
  if (translationEnabled.value) {
    translatePostContent()
  }
})
</script>

<style scoped>
.card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #1877F2, #42A5F5, #1877F2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.card:hover::before {
  opacity: 1;
}



.rounded-circle {
  object-fit: cover;
}

.gap-2 {
  gap: 0.5rem;
}

.comments-toggle {
  transition: color 0.2s ease;
}

.comments-toggle:hover {
  color: #0d6efd !important;
  text-decoration: underline;
}

/* Translation toggle button */
.translation-toggle-btn {
  background: #165b33 !important;
  color: white !important;
  border: 1px solid #165b33 !important;
  font-size: 0.75rem !important;
  padding: 0 0.5rem !important;
  border-radius: 6px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: none !important;
  text-transform: lowercase !important;
  line-height: 1.5 !important;
  margin: 0 !important;
  vertical-align: middle !important;
}

.translation-toggle-btn:hover {
  background: white !important;
  color: #165b33 !important;
  border-color: #165b33 !important;
}

/* Enhanced 3D Post Image */
.post-image-container {
  width: 100%;
  height: 400px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  position: relative;
  border-radius: 16px;
  margin: 0 1rem 1rem 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.post-image-container:hover .post-image {
  transform: scale(1.05);
}

/* Grid layout for multiple images */
.post-images-grid {
  display: grid;
  gap: 4px;
  margin: 0 1rem 1rem 1rem;
}

.post-images-grid.two {
  grid-template-columns: repeat(2, 1fr);
}

.post-images-grid.three {
  grid-template-columns: repeat(3, 1fr);
}

.post-images-grid.four {
  grid-template-columns: repeat(2, 1fr);
}

.post-image-cell {
  overflow: hidden;
  border-radius: 8px;
  position: relative;
  height: 200px;
}

.post-image-multi {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.post-image-cell:hover .post-image-multi {
  transform: scale(1.05);
}

/* Responsive image height */
@media (max-width: 768px) {
  .post-image-container {
    height: 300px;
  }
}

@media (max-width: 576px) {
  .post-image-container {
    height: 250px;
  }
}
</style>
