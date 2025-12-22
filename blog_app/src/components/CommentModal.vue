<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="handleClose">
        <div class="modal-dialog modal-dialog-scrollable modal-lg">
          <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-chat-dots me-2"></i>
                {{ t('post.comments') }} ({{ commentCount }})
              </h5>
              <button
                type="button"
                class="btn-close"
                @click="handleClose"
                aria-label="Close"
              ></button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
              <!-- Post Preview -->
              <div class="post-preview mb-4 p-3 bg-light rounded">
                <div class="d-flex align-items-center mb-2">
                  <img
                    :src="author.avatar"
                    :alt="author.name"
                    class="rounded-circle me-2"
                    width="32"
                    height="32"
                  />
                  <div>
                    <h6 class="mb-0">{{ author.name }}</h6>
                    <small class="text-muted">{{ formattedDate }}</small>
                  </div>
                </div>
                <h6 class="mb-1">{{ post.title }}</h6>
                <p class="mb-0 text-muted small">{{ truncatedContent }}</p>
              </div>

              <!-- Comments List -->
              <CommentList
                :postId="post.id"
                :comments="comments"
                :loading="commentsLoading"
              />
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <!-- Comment Form -->
              <CommentForm
                v-if="currentUser"
                :postId="post.id"
                @comment-created="handleCommentCreated"
                class="w-100"
              />
              <div v-else class="text-muted small">
                {{ t('post.loginToComment') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Post, User } from '../types'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'
import { useComments } from '../composables/useComments'
import CommentList from './CommentList.vue'
import CommentForm from './CommentForm.vue'

interface Props {
  show: boolean
  post: Post
  author: User
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'comment-created': []
}>()

const { currentUser } = useAuth()
const { t } = useLocale()
const { fetchCommentsByPostId, comments } = useComments()

const commentsLoading = ref(false)

const commentCount = computed(() => comments.value.length)

const formattedDate = computed(() => {
  const date = new Date(props.post.createdAt)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

const truncatedContent = computed(() => {
  const maxLength = 150
  if (props.post.content.length <= maxLength) {
    return props.post.content
  }
  return props.post.content.substring(0, maxLength) + '...'
})

const handleClose = () => {
  emit('close')
}

const handleCommentCreated = async () => {
  await loadComments()
  emit('comment-created')
}

const loadComments = async () => {
  if (!props.post?.id) return
  
  commentsLoading.value = true
  try {
    await fetchCommentsByPostId(props.post.id, 'asc')
  } catch (error) {
    console.error('Failed to load comments:', error)
  } finally {
    commentsLoading.value = false
  }
}

// Load comments when modal is shown
watch(() => props.show, (newShow) => {
  if (newShow) {
    loadComments()
  }
}, { immediate: true })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.modal-dialog {
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1c1e21;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
  border-radius: 0 0 16px 16px;
}

.post-preview {
  border: 1px solid #e9ecef;
}

.rounded-circle {
  object-fit: cover;
}

.btn-close {
  background: #dc3545;
  border: 2px solid #dc3545;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 1;
  transition: all 0.2s ease;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
}

.btn-close::before {
  content: "×";
  font-size: 1.5rem;
  line-height: 1;
}

.btn-close:hover {
  background-color: #c82333;
  border-color: #c82333;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .modal-dialog {
    max-width: 100%;
    margin: 0;
  }

  .modal-content {
    border-radius: 0;
    max-height: 100vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
}
</style>
