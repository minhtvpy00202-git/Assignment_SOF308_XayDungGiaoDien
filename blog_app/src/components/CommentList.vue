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
        class="comment-item d-flex gap-2 mb-3"
      >
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
          <small class="text-muted ms-2">{{ formatTimestamp(comment.createdAt) }}</small>
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

interface Props {
  postId: string
  comments: readonly Comment[]
  loading: boolean
}

const props = defineProps<Props>()

const showAll = ref(false)
const commenterCache = ref<Map<string, { name: string; avatar: string }>>(new Map())

// Display only first 3 comments initially, or all if showAll is true
const displayedComments = computed(() => {
  if (showAll.value || props.comments.length <= 3) {
    return props.comments
  }
  return props.comments.slice(0, 3)
})

// Get commenter name from cache
const getCommenterName = (userId: string): string => {
  return commenterCache.value.get(userId)?.name || 'Unknown User'
}

// Get commenter avatar from cache
const getCommenterAvatar = (userId: string): string => {
  return commenterCache.value.get(userId)?.avatar || 'https://via.placeholder.com/32'
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

// Watch for changes in comments and load commenters
watch(() => props.comments, () => {
  loadCommenters()
}, { immediate: true })

onMounted(() => {
  loadCommenters()
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
</style>
