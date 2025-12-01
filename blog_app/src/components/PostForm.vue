<template>
  <div class="post-form">
    <form @submit.prevent="handleSubmit">
      <div class="mb-4">
        <label for="title" class="form-label fw-semibold">
          <i class="bi bi-type me-2"></i>Title
        </label>
        <input
          id="title"
          v-model="formData.title"
          type="text"
          class="form-control form-control-lg"
          :class="{ 'is-invalid': errors.title }"
          placeholder="Enter an engaging title..."
        />
        <div v-if="errors.title" class="invalid-feedback">
          {{ errors.title }}
        </div>
      </div>

      <div class="mb-4">
        <label for="content" class="form-label fw-semibold">
          <i class="bi bi-text-paragraph me-2"></i>Content
        </label>
        <textarea
          id="content"
          v-model="formData.content"
          class="form-control"
          :class="{ 'is-invalid': errors.content }"
          rows="8"
          placeholder="Share your thoughts..."
        ></textarea>
        <div v-if="errors.content" class="invalid-feedback">
          {{ errors.content }}
        </div>
      </div>

      <div class="mb-4">
        <label for="image" class="form-label fw-semibold">
          <i class="bi bi-image me-2"></i>Image URL <span class="text-muted fw-normal">(optional)</span>
        </label>
        <input
          id="image"
          v-model="formData.image"
          type="text"
          class="form-control"
          placeholder="https://example.com/image.jpg"
        />
        <small class="form-text text-muted">Add an image to make your post more engaging</small>
      </div>

      <div v-if="generalError" class="alert alert-danger" role="alert">
        {{ generalError }}
      </div>

      <div class="d-flex gap-2 pt-3">
        <button
          type="submit"
          class="btn btn-primary btn-lg px-4"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-check-circle me-2"></i>
          {{ submitButtonText }}
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary btn-lg px-4"
          @click="handleCancel"
          :disabled="isSubmitting"
        >
          <i class="bi bi-x-circle me-2"></i>Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { Post, CreatePostData, UpdatePostData } from '../types'

interface Props {
  initialData?: Post
  submitButtonText?: string
}

interface Emits {
  (e: 'submit', data: CreatePostData | UpdatePostData): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  submitButtonText: 'Submit'
})

const emit = defineEmits<Emits>()

const formData = reactive({
  title: '',
  content: '',
  image: ''
})

const errors = reactive({
  title: '',
  content: ''
})

const generalError = ref('')
const isSubmitting = ref(false)

// Initialize form with initial data if provided
if (props.initialData) {
  formData.title = props.initialData.title
  formData.content = props.initialData.content
  formData.image = props.initialData.image || ''
}

// Watch for changes to initialData (for edit mode)
watch(() => props.initialData, (newData) => {
  if (newData) {
    formData.title = newData.title
    formData.content = newData.content
    formData.image = newData.image || ''
  }
}, { immediate: true })

const validateForm = (): boolean => {
  let isValid = true
  
  // Reset errors
  errors.title = ''
  errors.content = ''
  generalError.value = ''

  // Validate title
  if (!formData.title || !formData.title.trim()) {
    errors.title = 'Title is required'
    isValid = false
  }

  // Validate content
  if (!formData.content || !formData.content.trim()) {
    errors.content = 'Content is required'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  const submitData: CreatePostData | UpdatePostData = {
    title: formData.title.trim(),
    content: formData.content.trim(),
    image: formData.image.trim() || undefined
  }

  emit('submit', submitData)
}

const handleCancel = () => {
  emit('cancel')
}

// Expose method to set submitting state (for parent component)
const setSubmitting = (value: boolean) => {
  isSubmitting.value = value
}

const setError = (error: string) => {
  generalError.value = error
  isSubmitting.value = false
}

defineExpose({
  setSubmitting,
  setError
})
</script>

<style scoped>
.form-label {
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.form-control {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control-lg {
  font-size: 1.25rem;
  font-weight: 500;
}

textarea.form-control {
  resize: vertical;
  min-height: 200px;
}

.btn {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-outline-secondary {
  border-width: 2px;
}

.btn-outline-secondary:hover:not(:disabled) {
  transform: translateY(-2px);
}

.alert {
  border-radius: 8px;
  border: none;
}

@media (max-width: 576px) {
  .btn-lg {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }
}
</style>
