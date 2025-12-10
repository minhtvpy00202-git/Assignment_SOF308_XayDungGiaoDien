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
            <small class="text-muted">{{ formattedDate }}</small>
          </div>
        </router-link>
      </div>

      <!-- Translation controls -->
      <div v-if="translationEnabled && (translatedPost || isTranslating)" class="mb-2">
        <div class="d-flex align-items-center gap-2">
          <div v-if="isTranslating" class="d-flex align-items-center text-muted">
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
              class="btn btn-sm btn-outline-secondary"
              style="font-size: 0.75rem; padding: 0.125rem 0.5rem;"
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
    </div>

    <!-- Post image (outside card-body for full width) -->
    <div v-if="displayPost.image" class="post-image-container">
      <img :src="displayPost.image" class="post-image" :alt="displayPost.title">
    </div>

    <div class="card-body pt-0">

      <!-- Interaction stats -->
      <div class="d-flex justify-content-between align-items-center mb-3 text-muted">
        <small>{{ likeCount }} {{ t('post.likes') }}</small>
        <div class="d-flex gap-3">
          <small>{{ shareCount }} {{ t('post.shares') }}</small>
          <small 
            class="comments-toggle" 
            @click="toggleComments"
            style="cursor: pointer; user-select: none;"
            :class="{ 'text-primary': showComments }"
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

    <!-- Inline comments section (only show when toggled) -->
    <div v-if="showComments" class="card-body pt-0">
      <CommentList
        :postId="post.sharedFromId || post.id"
        :comments="comments"
        :loading="commentsLoading"
      />

      <!-- Comment form (only for authenticated users) -->
      <CommentForm
        v-if="currentUser"
        :postId="post.sharedFromId || post.id"
        @comment-created="handleCommentCreated"
      />
    </div>
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
import { useComments } from '../composables/useComments'
import { apiService } from '../services/apiService'
import LikeButton from './LikeButton.vue'
import ShareButton from './ShareButton.vue'
import CommentForm from './CommentForm.vue'
import CommentList from './CommentList.vue'

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
const { translatePost, translationEnabled, isTranslating } = useContentTranslation()
const { getLikeCount } = useLikes()
const { getShareCount } = useShares()
const { fetchCommentsByPostId, comments } = useComments()

const likeCount = ref(0)
const shareCount = ref(0)
const commentCount = ref(0)
const sharingUser = ref<User | null>(null)
const originalPost = ref<Post | null>(null)
const originalAuthor = ref<User | null>(null)
const commentsLoading = ref(false)
const showComments = ref(false) // Comments hidden by default
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

// Load interaction counts
const loadCounts = async () => {
  try {
    // For shared posts, show counts from the original post
    const postIdForCounts = props.post.sharedFromId || props.post.id
    
    likeCount.value = await getLikeCount(postIdForCounts)
    shareCount.value = await getShareCount(postIdForCounts)
    
    // Fetch comments to get count (ascending order for inline display per Requirement 10.5)
    commentsLoading.value = true
    await fetchCommentsByPostId(postIdForCounts, 'asc')
    commentCount.value = comments.value.length
  } catch (error) {
    console.error('Failed to load counts:', error)
  } finally {
    commentsLoading.value = false
  }
}

// Toggle comments visibility
const toggleComments = () => {
  showComments.value = !showComments.value
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

// Translate post content
const translatePostContent = async () => {
  if (!translationEnabled.value || isTranslating.value) return
  
  const postToTranslate = originalPost.value || props.post
  
  try {
    const result = await translatePost(postToTranslate)
    if (result.isTranslated) {
      translatedPost.value = result
      showOriginal.value = false
    }
  } catch (error) {
    console.error('Error translating post:', error)
  }
}

// Watch for locale changes to re-translate
watch(locale, () => {
  if (translationEnabled.value && translatedPost.value) {
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
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

/* Post image styling - full width with fixed aspect ratio */
.post-image-container {
  width: 100%;
  height: 400px;
  overflow: hidden;
  background-color: #f8f9fa;
  position: relative;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
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
