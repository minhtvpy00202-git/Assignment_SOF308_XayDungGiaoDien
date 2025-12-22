<template>
  <Teleport to="body">
    <!-- Modal backdrop -->
    <div 
      v-if="props.modelValue"
      class="modal-backdrop fade show"
      @click="closeModal"
    ></div>

    <!-- Modal dialog -->
    <div 
      v-if="props.modelValue"
      class="modal fade show d-block"
      tabindex="-1"
      @click.self="closeModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <!-- Modal header -->
          <div class="modal-header border-bottom">
            <h5 class="modal-title fw-semibold">{{ t('post.createPost') }}</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
              :disabled="isSubmitting"
            ></button>
          </div>

          <!-- Modal body -->
          <div class="modal-body p-4">
            <PostForm
              ref="postFormRef"
              :submit-button-text="t('post.submit')"
              @submit="handleSubmit"
              @cancel="closeModal"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import PostForm from './PostForm.vue'
import { useLocale } from '../composables/useLocale'
import type { CreatePostData, UpdatePostData } from '../types'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: CreatePostData | UpdatePostData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useLocale()

const postFormRef = ref<InstanceType<typeof PostForm> | null>(null)
const isSubmitting = ref(false)

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async (data: CreatePostData | UpdatePostData) => {
  isSubmitting.value = true
  try {
    emit('submit', data)
  } finally {
    isSubmitting.value = false
  }
}

// Expose methods
const setSubmitting = (value: boolean) => {
  isSubmitting.value = value
  if (postFormRef.value) {
    postFormRef.value.setSubmitting(value)
  }
}

const setError = (error: string) => {
  if (postFormRef.value) {
    postFormRef.value.setError(error)
  }
}

const triggerVideoInput = () => {
  if (postFormRef.value) {
    postFormRef.value.triggerVideoInput()
  }
}

const triggerEmotionSelector = () => {
  if (postFormRef.value) {
    postFormRef.value.triggerEmotionSelector()
  }
}

defineExpose({
  setSubmitting,
  setError,
  triggerVideoInput,
  triggerEmotionSelector
})

// Handle escape key
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeModal()
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      document.addEventListener('keydown', handleEscape)
    } else {
      document.removeEventListener('keydown', handleEscape)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 1;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  outline: 0;
}

.modal-dialog {
  position: relative;
  width: auto;
  margin: 1.75rem auto;
}

.modal-dialog-centered {
  display: flex;
  align-items: center;
  min-height: calc(100% - 2 * 1.75rem);
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.3rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
}

.modal-title {
  margin-bottom: 0;
  line-height: 1.5;
  color: #212529;
  font-size: 1.25rem;
}

.modal-body {
  position: relative;
  flex: 1 1 auto;
}

.btn-close {
  box-sizing: content-box;
  width: 1.5em;
  height: 1.5em;
  padding: 0.5em;
  color: #fff;
  background: #dc3545 url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23fff'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e") center / 0.8em auto no-repeat;
  border: 2px solid #dc3545;
  border-radius: 50%;
  opacity: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
}

.btn-close:hover {
  background-color: #c82333;
  border-color: #c82333;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}

.btn-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 576px) {
  .modal-dialog {
    margin: 0.5rem;
  }

  .modal-lg {
    max-width: 100%;
  }

  .modal-content {
    border-radius: 0.5rem;
  }
}
</style>
