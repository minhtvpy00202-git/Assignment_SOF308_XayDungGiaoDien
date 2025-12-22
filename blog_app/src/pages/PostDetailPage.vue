<template>
  <div class="container py-4">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">{{ t('common.loading') }}</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      {{ error }}
    </div>

    <!-- Post Content -->
    <div v-else-if="post" class="row">
      <div class="col-lg-8 mx-auto">
        <!-- Post Card -->
        <div class="card shadow-sm">
          <div class="card-body">
            <!-- Post Header -->
            <div class="d-flex align-items-center mb-3">
              <router-link 
                :to="`/profile/${author?.id}`" 
                class="d-flex align-items-center text-decoration-none"
              >
                <img
                  :src="author?.avatar || 'https://via.placeholder.com/40'"
                  :alt="author?.name || 'User'"
                  class="rounded-circle me-3"
                  width="40"
                  height="40"
                  style="object-fit: cover;"
                />
                <div>
                  <h6 class="mb-0 text-dark fw-semibold">{{ author?.name || t('common.unknownUser') }}</h6>
                  <small class="text-muted">{{ formatDate(post.createdAt) }}</small>
                </div>
              </router-link>
              
              <!-- Edit/Delete Actions (if owner) -->
              <div class="ms-auto" v-if="canEditPost">
                <div class="dropdown">
                  <button
                    class="btn btn-sm btn-outline-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i class="bi bi-three-dots"></i>
                  </button>
                  <ul class="dropdown-menu">
                    <li>
                      <router-link :to="`/posts/${post.id}/edit`" class="dropdown-item">
                        <i class="bi bi-pencil me-2"></i>{{ t('post.edit') }}
                      </router-link>
                    </li>
                    <li>
                      <button @click="deletePost" class="dropdown-item text-danger">
                        <i class="bi bi-trash me-2"></i>{{ t('post.delete') }}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Translation controls -->
            <div v-if="translationEnabled && (translatedPost || isTranslating)" class="mb-3">
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
                  >
                    {{ showOriginal ? t('translation.showTranslated') : t('translation.showOriginal') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Post Title -->
            <h1 class="h3 mb-3">{{ displayPost?.title }}</h1>

            <!-- Post Content -->
            <div class="post-content mb-4" v-html="formattedContent"></div>

            <!-- Post Images -->
            <div v-if="displayImages.length === 1" class="mb-4">
              <div class="post-detail-image-container">
                <img :src="displayImages[0]" class="img-fluid rounded" :alt="displayPost?.title" />
              </div>
            </div>
            <div v-else-if="displayImages.length > 1" class="post-detail-images-grid mb-4">
              <div v-for="(src, idx) in displayImages" :key="idx" class="post-detail-image-cell">
                <img :src="src" class="img-fluid rounded" :alt="displayPost?.title" />
              </div>
            </div>

            <!-- Post Actions -->
            <div class="d-flex align-items-center justify-content-between border-top pt-3">
              <div class="d-flex align-items-center gap-3">
                <!-- Like Button -->
                <LikeButton
                  :post-id="post.id"
                  :initial-likes="0"
                  :initial-liked="false"
                />

                <!-- Comment Count -->
                <button 
                  @click="scrollToComments"
                  class="btn btn-sm btn-outline-secondary d-flex align-items-center"
                >
                  <i class="bi bi-chat me-1"></i>
                  {{ comments.length }} {{ t('post.comments') }}
                </button>
              </div>

              <!-- Share Button -->
              <ShareButton :post-id="post.id" />
            </div>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="mt-4" ref="commentsSection">
          <h4 class="mb-3">{{ t('post.comments') }}</h4>
          
          <!-- Comment Form -->
          <CommentForm 
            v-if="isAuthenticated"
            :post-id="post.id"
            @comment-added="handleCommentAdded"
            class="mb-4"
          />

          <!-- Comments List -->
          <CommentList 
            :post-id="post.id"
            :comments="comments"
            :loading="commentsLoading"
            @comment-updated="handleCommentUpdated"
            @comment-deleted="handleCommentDeleted"
          />
        </div>
      </div>
    </div>

    <!-- Post Not Found -->
    <div v-else class="text-center py-5">
      <i class="bi bi-file-earmark-x empty-state-icon"></i>
      <h3>{{ t('post.notFound') }}</h3>
      <p class="text-muted">{{ t('post.notFoundDescription') }}</p>
      <router-link to="/" class="btn btn-primary">
        {{ t('common.backToHome') }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'
import { useContentTranslation } from '../composables/useContentTranslation'
import { useComments } from '../composables/useComments'
import { apiService } from '../services/apiService'
import LikeButton from '../components/LikeButton.vue'
import ShareButton from '../components/ShareButton.vue'
import CommentForm from '../components/CommentForm.vue'
import CommentList from '../components/CommentList.vue'
import type { Post, User, Comment } from '../types'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, currentUser } = useAuth()
const { t, locale } = useLocale()
const { translatePost, translationEnabled, isTranslating } = useContentTranslation()

// State
const post = ref<Post | null>(null)
const author = ref<User | null>(null)
const loading = ref(true)
const error = ref('')
const commentsSection = ref<HTMLElement>()
const translatedPost = ref<Post | null>(null)
const showOriginal = ref(false)

// Comments
const {
  comments,
  loading: commentsLoading,
  fetchCommentsByPostId,
  createComment
} = useComments()

// Computed
const canEditPost = computed(() => {
  return isAuthenticated.value && 
         currentUser.value && 
         post.value && 
         currentUser.value.id === post.value.userId
})

// Get display post (translated or original)
const displayPost = computed(() => {
  if (!translationEnabled.value || showOriginal.value) {
    return post.value
  }
  return translatedPost.value || post.value
})

const formattedContent = computed(() => {
  if (!displayPost.value?.content) return ''
  
  // Simple formatting: convert line breaks to <br> tags
  return displayPost.value.content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
})

// Normalized images array for display (support legacy `image`)
const displayImages = computed(() => {
  if (!displayPost.value) return []
  // prefer `images` array
  if (Array.isArray(displayPost.value.images) && displayPost.value.images.length > 0) {
    return displayPost.value.images
  }
  // fallback to legacy single `image` field
  if ((displayPost.value as any).image) return [(displayPost.value as any).image]
  return []
})

// Methods
const loadPost = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const postId = route.params.id as string
    if (!postId) {
      error.value = t('post.invalidId')
      return
    }

    // Load post
    const postData = await apiService.getPostById(postId)
    if (!postData) {
      error.value = t('post.notFound')
      return
    }
    
    post.value = postData

    // Load author
    if (postData.userId) {
      try {
        const authorData = await apiService.getUserById(postData.userId)
        author.value = authorData
      } catch (err) {
        console.error('Error loading author:', err)
        // Continue even if author loading fails
      }
    }

    // Load comments
    await fetchCommentsByPostId(postId)
    
  } catch (err) {
    console.error('Error loading post:', err)
    error.value = t('post.loadError')
  } finally {
    loading.value = false
  }
}

const deletePost = async () => {
  if (!post.value || !confirm(t('post.confirmDelete'))) return
  
  try {
    await apiService.deletePost(post.value.id)
    router.push('/')
  } catch (err) {
    console.error('Error deleting post:', err)
    error.value = t('post.deleteError')
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60)
    return diffInMinutes <= 1 ? t('time.justNow') : t('time.minutesAgo', { minutes: diffInMinutes })
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours)
    return hours === 1 ? t('time.hourAgo') : t('time.hoursAgo', { hours })
  } else if (diffInHours < 24 * 7) {
    const days = Math.floor(diffInHours / 24)
    return days === 1 ? t('time.dayAgo') : t('time.daysAgo', { days })
  } else {
    return date.toLocaleDateString()
  }
}

const scrollToComments = () => {
  nextTick(() => {
    commentsSection.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

// Comment handlers
const handleCommentAdded = async (commentData: any) => {
  try {
    await createComment(commentData)
  } catch (error) {
    console.error('Error adding comment:', error)
  }
}

const handleCommentUpdated = (_comment: Comment) => {
  // For now, just reload comments
  if (post.value) {
    fetchCommentsByPostId(post.value.id)
  }
}

const handleCommentDeleted = (_commentId: string) => {
  // For now, just reload comments
  if (post.value) {
    fetchCommentsByPostId(post.value.id)
  }
}

// Toggle between original and translated content
const toggleOriginal = () => {
  showOriginal.value = !showOriginal.value
}

// Translate post content
const translatePostContent = async () => {
  if (!translationEnabled.value || !post.value || isTranslating.value) return
  
  try {
    const result = await translatePost(post.value)
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
  if (enabled && !translatedPost.value && post.value) {
    translatePostContent()
  } else if (!enabled) {
    showOriginal.value = false
  }
})

// Watch for post changes
watch(post, () => {
  if (translationEnabled.value && post.value) {
    translatePostContent()
  }
})

// Lifecycle
onMounted(() => {
  loadPost()
})
</script>

<style scoped>
.post-content {
  line-height: 1.6;
  font-size: 1.1rem;
}

.post-content :deep(p) {
  margin-bottom: 1rem;
}

.post-content :deep(strong) {
  font-weight: 600;
}

.post-content :deep(em) {
  font-style: italic;
}

.empty-state-icon {
  font-size: 4rem;
  color: #dee2e6;
  margin-bottom: 1rem;
}

.post-detail-image-container img {
  width: 100%;
  max-height: 600px;
  object-fit: cover;
}

.post-detail-images-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, 1fr);
}

.post-detail-image-cell img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

@media (max-width: 768px) {
  .post-content {
    font-size: 1rem;
  }
}
</style>