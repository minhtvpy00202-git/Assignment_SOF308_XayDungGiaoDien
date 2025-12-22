<template>
  <div class="comment-list">
    <div v-if="loading" class="text-center py-3">
      <div class="spinner-border spinner-border-sm" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="displayedComments.length === 0" class="text-muted py-2">
      <small>No comments yet. Be the first to comment!</small>
    </div>

    <div v-else>
      <!-- Display comments -->
      <div
        v-for="comment in displayedComments"
        :key="comment.id"
        class="comment-item mb-3"
      >
        <div class="d-flex gap-2">
          <router-link :to="`/profile/${comment.userId}`" class="text-decoration-none">
            <img
              :src="getCommenterAvatar(comment.userId)"
              :alt="getCommenterName(comment.userId)"
              class="rounded-circle"
              width="32"
              height="32"
            />
          </router-link>
          <div class="flex-grow-1">
            <div class="comment-content bg-light p-2 rounded">
              <router-link :to="`/profile/${comment.userId}`" class="text-decoration-none">
                <strong class="d-block text-dark">{{ getCommenterName(comment.userId) }}</strong>
              </router-link>
              <p class="mb-0">{{ comment.content }}</p>
            </div>
            
            <!-- Comment actions -->
            <div class="comment-actions d-flex align-items-center gap-3 ms-2 mt-1">
              <small class="text-muted">{{ formatTimestamp(comment.createdAt) }}</small>
              
              <!-- Like button -->
              <button
                @click="handleLikeComment(comment.id)"
                class="btn-action"
                :class="{ 'liked': isCommentLiked(comment.id) }"
                :disabled="!currentUser"
              >
                <i :class="isCommentLiked(comment.id) ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
                <span v-if="getCommentLikesCount(comment.id) > 0">
                  {{ getCommentLikesCount(comment.id) }}
                </span>
              </button>
              
              <!-- Reply button -->
              <button
                @click="handleReplyComment(comment.id)"
                class="btn-action"
                :disabled="!currentUser"
              >
                <i class="bi bi-reply"></i>
                {{ t('comment.reply') }}
              </button>
            </div>

            <!-- Reply form (shown when replying to this comment) -->
            <div v-if="replyingTo === comment.id" class="reply-form mt-2">
              <div class="d-flex gap-2">
                <img
                  v-if="currentUser"
                  :src="currentUser.avatar"
                  :alt="currentUser.name"
                  class="rounded-circle"
                  width="24"
                  height="24"
                />
                <div class="flex-grow-1">
                  <input
                    v-model="replyContent"
                    type="text"
                    class="form-control form-control-sm"
                    :placeholder="t('comment.replyPlaceholder')"
                    @keyup.enter="submitReply(comment.id)"
                    @keyup.esc="cancelReply"
                  />
                  <div class="d-flex gap-2 mt-2">
                    <button
                      @click="submitReply(comment.id)"
                      class="btn btn-sm btn-primary"
                      :disabled="!replyContent.trim()"
                    >
                      {{ t('comment.send') }}
                    </button>
                    <button
                      @click="cancelReply"
                      class="btn btn-sm btn-outline-secondary"
                    >
                      {{ t('common.cancel') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Display replies (nested comments) -->
            <div v-if="getReplies(comment.id).length > 0" class="replies mt-2 ms-3">
              <div
                v-for="reply in getReplies(comment.id)"
                :key="reply.id"
                class="reply-item d-flex gap-2 mb-2"
              >
                <router-link :to="`/profile/${reply.userId}`" class="text-decoration-none">
                  <img
                    :src="getCommenterAvatar(reply.userId)"
                    :alt="getCommenterName(reply.userId)"
                    class="rounded-circle"
                    width="24"
                    height="24"
                  />
                </router-link>
                <div class="flex-grow-1">
                  <div class="comment-content bg-light p-2 rounded">
                    <router-link :to="`/profile/${reply.userId}`" class="text-decoration-none">
                      <strong class="d-block text-dark small">{{ getCommenterName(reply.userId) }}</strong>
                    </router-link>
                    <p class="mb-0 small">{{ reply.content }}</p>
                  </div>
                  
                  <!-- Reply actions -->
                  <div class="comment-actions d-flex align-items-center gap-3 ms-2 mt-1">
                    <small class="text-muted">{{ formatTimestamp(reply.createdAt) }}</small>
                    
                    <!-- Like button for reply -->
                    <button
                      @click="handleLikeComment(reply.id)"
                      class="btn-action"
                      :class="{ 'liked': isCommentLiked(reply.id) }"
                      :disabled="!currentUser"
                    >
                      <i :class="isCommentLiked(reply.id) ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
                      <span v-if="getCommentLikesCount(reply.id) > 0">
                        {{ getCommentLikesCount(reply.id) }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- View all button if there are more than 3 comments -->
      <div v-if="comments.length > 3 && !showAll" class="text-center">
        <button class="btn btn-sm btn-link" @click="showAll = true">
          View all {{ comments.length }} comments
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Comment } from '../types'
import { apiService } from '../services/apiService'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'
import { useCommentLikes } from '../composables/useCommentLikes'
import { useComments } from '../composables/useComments'

interface Props {
  postId: string
  comments: readonly Comment[]
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'comment-created': []
}>()

const { currentUser } = useAuth()
const { t } = useLocale()
const { 
  getCommentLikeCount, 
  isCommentLikedByUser, 
  toggleCommentLike 
} = useCommentLikes()
const { createComment } = useComments()

const showAll = ref(false)
const commenterCache = ref<Map<string, { name: string; avatar: string }>>(new Map())
const commentLikesCount = ref<Map<string, number>>(new Map())
const userCommentLikes = ref<Map<string, boolean>>(new Map())
const replyingTo = ref<string | null>(null)
const replyContent = ref('')

// Display only first 3 comments initially, or all if showAll is true
const displayedComments = computed(() => {
  // Filter out replies (comments with parentId) for top-level display
  const topLevelComments = props.comments.filter(comment => !comment.parentId)
  
  if (showAll.value || topLevelComments.length <= 3) {
    return topLevelComments
  }
  return topLevelComments.slice(0, 3)
})

// Get replies for a specific comment
const getReplies = (commentId: string): Comment[] => {
  return props.comments.filter(comment => comment.parentId === commentId)
}

// Get commenter name from cache
const getCommenterName = (userId: string): string => {
  return commenterCache.value.get(userId)?.name || 'Unknown User'
}

// Get commenter avatar from cache
const getCommenterAvatar = (userId: string): string => {
  return commenterCache.value.get(userId)?.avatar || 'https://via.placeholder.com/32'
}

// Get comment likes count
const getCommentLikesCount = (commentId: string): number => {
  return commentLikesCount.value.get(commentId) || 0
}

// Check if comment is liked by current user
const isCommentLiked = (commentId: string): boolean => {
  return userCommentLikes.value.get(commentId) || false
}

// Handle like comment
const handleLikeComment = async (commentId: string) => {
  if (!currentUser.value) return
  
  try {
    await toggleCommentLike(commentId)
    await loadCommentLikes(commentId)
  } catch (error) {
    console.error('Failed to like comment:', error)
  }
}

// Handle reply to comment
const handleReplyComment = (commentId: string) => {
  if (!currentUser.value) return
  
  replyingTo.value = commentId
  replyContent.value = ''
}

// Submit reply
const submitReply = async (parentId: string) => {
  if (!replyContent.value.trim() || !currentUser.value) return
  
  try {
    await createComment({
      postId: props.postId,
      content: replyContent.value.trim(),
      parentId
    })
    
    replyingTo.value = null
    replyContent.value = ''
    emit('comment-created')
  } catch (error) {
    console.error('Failed to create reply:', error)
  }
}

// Cancel reply
const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

// Format timestamp
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

// Load comment likes for a specific comment
const loadCommentLikes = async (commentId: string) => {
  try {
    const count = await getCommentLikeCount(commentId)
    commentLikesCount.value.set(commentId, count)
    
    if (currentUser.value) {
      const isLiked = await isCommentLikedByUser(commentId, currentUser.value.id)
      userCommentLikes.value.set(commentId, isLiked)
    }
  } catch (error) {
    console.error('Failed to load comment likes:', error)
  }
}

// Load commenter information for all comments
const loadCommenters = async () => {
  const userIds = new Set(props.comments.map(c => c.userId))
  
  for (const userId of userIds) {
    if (!commenterCache.value.has(userId)) {
      try {
        const user = await apiService.getUserById(userId)
        commenterCache.value.set(userId, {
          name: user.name,
          avatar: user.avatar
        })
      } catch (error) {
        console.error(`Failed to load user ${userId}:`, error)
      }
    }
  }
}

// Load likes for all comments
const loadAllCommentLikes = async () => {
  for (const comment of props.comments) {
    await loadCommentLikes(comment.id)
  }
}

// Watch for changes in comments and load commenters
watch(() => props.comments, () => {
  loadCommenters()
  loadAllCommentLikes()
}, { immediate: true })

onMounted(() => {
  loadCommenters()
  loadAllCommentLikes()
})
</script>

<style scoped>
.comment-list {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.comment-item {
  animation: fadeIn 0.3s ease-in;
}

.reply-item {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rounded-circle {
  object-fit: cover;
}

.gap-2 {
  gap: 0.5rem;
}

.comment-content {
  word-wrap: break-word;
}

.comment-actions {
  font-size: 0.75rem;
}

.btn-action {
  background: none;
  border: none;
  color: #65676b;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-action:hover:not(:disabled) {
  background-color: #f0f2f5;
  color: #1877f2;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action.liked {
  color: #e91e63;
}

.btn-action.liked:hover {
  color: #c2185b;
}

.replies {
  border-left: 2px solid #e9ecef;
  padding-left: 0.75rem;
}

.reply-form {
  background-color: #f8f9fa;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.reply-form .form-control {
  border: 1px solid #ced4da;
  border-radius: 20px;
  padding: 0.5rem 0.75rem;
}

.reply-form .form-control:focus {
  border-color: #1877f2;
  box-shadow: 0 0 0 0.2rem rgba(24, 119, 242, 0.25);
}
</style>
