<template>
  <div class="post-form">
    <form @submit.prevent="handleSubmit">
      <!-- Title Input -->
      <div class="mb-4">
        <input
          id="title"
          v-model="formData.title"
          type="text"
          class="form-control form-control-lg border-0 post-title-input"
          :class="{ 'is-invalid': errors.title }"
          :placeholder="t('post.title')"
        />
        <div v-if="errors.title" class="invalid-feedback d-block mt-2">
          {{ errors.title }}
        </div>
      </div>

      <!-- Content Input -->
      <div class="mb-3">
        <textarea
          id="content"
          v-model="formData.content"
          class="form-control border-0 post-content-input"
          :class="{ 'is-invalid': errors.content }"
          rows="6"
          :placeholder="t('post.content')"
        ></textarea>
        <div v-if="errors.content" class="invalid-feedback d-block mt-2">
          {{ errors.content }}
        </div>
      </div>

      <!-- Video Preview -->
      <div v-if="videoPreview" class="video-preview-container mb-3">
        <div class="position-relative">
          <video :src="videoPreview" controls class="video-preview rounded">
            Your browser does not support the video tag.
          </video>
          <button
            type="button"
            class="btn btn-sm btn-danger remove-video-btn"
            @click="removeVideo"
            :disabled="isSubmitting"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <!-- Image Previews (multiple) -->
      <div v-if="imagePreviews.length" class="image-preview-grid mb-3">
        <div v-for="(src, idx) in imagePreviews" :key="idx" class="image-thumb position-relative">
          <img :src="src" alt="Preview" class="img-fluid rounded preview-thumb" />
          <button
            type="button"
            class="btn btn-sm btn-danger remove-image-btn"
            @click="removeImage(idx)"
            :disabled="isSubmitting"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <!-- Emotion Selector -->
      <div v-if="showEmotionSelector" class="emotion-selector mb-3">
        <div class="card border-0 bg-light">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">{{ t('post.selectEmotion') || 'Chọn cảm xúc' }}</h6>
              <button
                type="button"
                class="btn-close btn-close-sm"
                @click="showEmotionSelector = false"
              ></button>
            </div>
            <div class="emotion-grid">
              <button
                v-for="emotion in emotions"
                :key="emotion.value"
                type="button"
                class="emotion-btn"
                :class="{ active: formData.emotion === emotion.value }"
                @click="selectEmotion(emotion.value)"
              >
                <span class="emotion-icon">{{ emotion.icon }}</span>
                <span class="emotion-label">{{ emotion.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Emotion Display -->
      <div v-if="formData.emotion && !showEmotionSelector" class="selected-emotion mb-3">
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted">{{ t('post.feeling') || 'Đang cảm thấy' }}:</span>
          <span class="emotion-display">
            {{ getEmotionIcon(formData.emotion) }} {{ getEmotionLabel(formData.emotion) }}
          </span>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="removeEmotion"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="generalError" class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
        {{ generalError }}
        <button type="button" class="btn-close" @click="generalError = ''"></button>
      </div>

      <!-- Action Buttons -->
      <div class="post-actions border-top pt-3">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div class="d-flex gap-2 align-items-center">
            <!-- Upload Image Button -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              class="d-none"
              @change="handleImageUpload"
            />
            <input
              ref="videoInput"
              type="file"
              accept="video/*"
              class="d-none"
              @change="handleVideoUpload"
            />
            <button
              type="button"
              class="btn btn-sm btn-outline-primary action-btn"
              @click="triggerFileInput"
              :disabled="isSubmitting"
              title="Upload image"
            >
              <i class="bi bi-image text-success"></i>
              <span class="d-none d-sm-inline ms-1">{{ t('post.image') }}</span>
            </button>

            <!-- Upload Video Button -->
            <button
              type="button"
              class="btn btn-sm btn-outline-primary action-btn"
              @click="triggerVideoInput"
              :disabled="isSubmitting"
              title="Upload video"
            >
              <i class="bi bi-camera-video text-danger"></i>
              <span class="d-none d-sm-inline ms-1">{{ t('post.video') || 'Video' }}</span>
            </button>

            <!-- Emotion Button -->
            <button
              type="button"
              class="btn btn-sm btn-outline-primary action-btn"
              @click="toggleEmotionSelector"
              :disabled="isSubmitting"
              title="Add emotion"
            >
              <i class="bi bi-emoji-smile text-warning"></i>
              <span class="d-none d-sm-inline ms-1">{{ t('post.emotion') || 'Cảm xúc' }}</span>
            </button>

            <!-- Privacy Selector -->
            <div class="dropdown">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary action-btn dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                :disabled="isSubmitting"
              >
                <i :class="privacyIcon" class="me-1"></i>
                <span class="d-none d-sm-inline">{{ privacyLabel }}</span>
              </button>
              <ul class="dropdown-menu privacy-dropdown">
                <li>
                  <button 
                    type="button" 
                    class="dropdown-item" 
                    :class="{ active: formData.privacy === 'public' }"
                    @click="formData.privacy = 'public'"
                  >
                    <i class="bi bi-globe me-2"></i>
                    <div>
                      <div class="fw-semibold">{{ t('post.privacyPublic') }}</div>
                      <small class="text-muted">{{ t('post.privacyPublicDesc') }}</small>
                    </div>
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    class="dropdown-item" 
                    :class="{ active: formData.privacy === 'friends' }"
                    @click="formData.privacy = 'friends'"
                  >
                    <i class="bi bi-people me-2"></i>
                    <div>
                      <div class="fw-semibold">{{ t('post.privacyFriends') }}</div>
                      <small class="text-muted">{{ t('post.privacyFriendsDesc') }}</small>
                    </div>
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    class="dropdown-item" 
                    :class="{ active: formData.privacy === 'private' }"
                    @click="formData.privacy = 'private'"
                  >
                    <i class="bi bi-lock me-2"></i>
                    <div>
                      <div class="fw-semibold">{{ t('post.privacyPrivate') }}</div>
                      <small class="text-muted">{{ t('post.privacyPrivateDesc') }}</small>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <!-- Submit and Cancel Buttons -->
          <div class="d-flex gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary px-3"
              @click="handleCancel"
              :disabled="isSubmitting"
            >
              {{ t('post.cancel') }}
            </button>
            <button
              type="submit"
              class="btn btn-sm btn-primary px-4"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              <i v-else class="bi bi-check-circle me-2"></i>
              {{ submitButtonText }}
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { Post, CreatePostData, UpdatePostData } from '../types'
import { useLocale } from '../composables/useLocale'

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
const { t } = useLocale()

const fileInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const imagePreviews = ref<string[]>([])
const videoPreview = ref<string>('')
const showEmotionSelector = ref(false)

// Emotion options
const emotions = [
  { value: 'happy', icon: '😊', label: 'Vui vẻ' },
  { value: 'sad', icon: '😢', label: 'Buồn' },
  { value: 'angry', icon: '😠', label: 'Tức giận' },
  { value: 'excited', icon: '🤩', label: 'Phấn khích' },
  { value: 'love', icon: '😍', label: 'Yêu thích' },
  { value: 'surprised', icon: '😲', label: 'Ngạc nhiên' },
  { value: 'tired', icon: '😴', label: 'Mệt mỏi' },
  { value: 'grateful', icon: '🙏', label: 'Biết ơn' }
]

// Trigger file input click (use ref to avoid $refs typing issues)
const triggerFileInput = () => {
  fileInput.value?.click()
}

import type { PostPrivacy } from '../types'

const formData = reactive({
  title: '',
  content: '',
  images: [] as string[],
  video: '',
  emotion: '',
  privacy: 'public' as PostPrivacy
})

// Computed for privacy display
const privacyIcon = computed(() => {
  switch (formData.privacy) {
    case 'public': return 'bi bi-globe text-primary'
    case 'friends': return 'bi bi-people text-success'
    case 'private': return 'bi bi-lock text-warning'
    default: return 'bi bi-globe text-primary'
  }
})

const privacyLabel = computed(() => {
  switch (formData.privacy) {
    case 'public': return t('post.privacyPublic')
    case 'friends': return t('post.privacyFriends')
    case 'private': return t('post.privacyPrivate')
    default: return t('post.privacyPublic')
  }
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
  // Support legacy `image` and new `images` — copy readonly arrays to mutable
  const srcImgs: string[] = Array.isArray((props.initialData as any).images) && (props.initialData as any).images.length
    ? (props.initialData as any).images.slice()
    : ((props.initialData as any).image ? [(props.initialData as any).image] : [])
  formData.images = srcImgs
  imagePreviews.value = srcImgs.slice()
  formData.video = (props.initialData as any).video || ''
  formData.emotion = (props.initialData as any).emotion || ''
  videoPreview.value = formData.video
}

// Watch for changes to initialData (for edit mode)
watch(() => props.initialData, (newData) => {
  if (newData) {
    formData.title = newData.title
    formData.content = newData.content
    formData.privacy = newData.privacy || 'public'
    const srcImgs: string[] = Array.isArray((newData as any).images) && (newData as any).images.length
      ? (newData as any).images.slice()
      : ((newData as any).image ? [(newData as any).image] : [])
    formData.images = srcImgs
    imagePreviews.value = srcImgs.slice()
    formData.video = (newData as any).video || ''
    formData.emotion = (newData as any).emotion || ''
    videoPreview.value = formData.video
  }
}, { immediate: true })

// Handle image upload
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (!files.length) return

  const maxSize = 5 * 1024 * 1024
  const readers: Promise<void>[] = []

  for (const file of files) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      generalError.value = t('validation.invalidImageType') || 'Please select a valid image file'
      continue
    }

    // Validate file size
    if (file.size > maxSize) {
      generalError.value = t('validation.imageTooLarge') || 'Image size must be less than 5MB'
      continue
    }

    readers.push(new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        imagePreviews.value.push(dataUrl)
        formData.images.push(dataUrl)
        generalError.value = ''
        resolve()
      }
      reader.onerror = () => {
        console.error('Failed to read file', file)
        resolve()
      }
      reader.readAsDataURL(file)
    }))
  }

  // After all readers
  Promise.all(readers).then(() => {
    if (fileInput.value) fileInput.value.value = ''
  })
}

// Remove image by index
const removeImage = (index: number) => {
  imagePreviews.value.splice(index, 1)
  formData.images.splice(index, 1)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Handle video upload
const handleVideoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const maxSize = 50 * 1024 * 1024 // 50MB
  
  // Validate file type
  if (!file.type.startsWith('video/')) {
    generalError.value = t('validation.invalidVideoType') || 'Please select a valid video file'
    return
  }

  // Validate file size
  if (file.size > maxSize) {
    generalError.value = t('validation.videoTooLarge') || 'Video size must be less than 50MB'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    videoPreview.value = dataUrl
    formData.video = dataUrl
    generalError.value = ''
  }
  reader.onerror = () => {
    console.error('Failed to read video file', file)
    generalError.value = 'Failed to read video file'
  }
  reader.readAsDataURL(file)
}

// Remove video
const removeVideo = () => {
  videoPreview.value = ''
  formData.video = ''
  if (videoInput.value) {
    videoInput.value.value = ''
  }
}

// Emotion functions
const selectEmotion = (emotion: string) => {
  formData.emotion = emotion
  showEmotionSelector.value = false
}

const removeEmotion = () => {
  formData.emotion = ''
}

const toggleEmotionSelector = () => {
  showEmotionSelector.value = !showEmotionSelector.value
}

const getEmotionIcon = (emotion: string) => {
  const found = emotions.find(e => e.value === emotion)
  return found ? found.icon : ''
}

const getEmotionLabel = (emotion: string) => {
  const found = emotions.find(e => e.value === emotion)
  return found ? found.label : ''
}

const validateForm = (): boolean => {
  let isValid = true
  
  // Reset errors
  errors.title = ''
  errors.content = ''
  generalError.value = ''

  // Validate title
  if (!formData.title || !formData.title.trim()) {
    errors.title = t('validation.required')
    isValid = false
  }

  // Validate content
  if (!formData.content || !formData.content.trim()) {
    errors.content = t('validation.required')
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
    images: formData.images.length ? formData.images.slice() : undefined,
    video: formData.video || undefined,
    emotion: formData.emotion || undefined,
    privacy: formData.privacy
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

const triggerVideoInput = () => {
  videoInput.value?.click()
}

const triggerEmotionSelector = () => {
  showEmotionSelector.value = true
}

defineExpose({
  setSubmitting,
  setError,
  triggerVideoInput,
  triggerEmotionSelector
})
</script>

<style scoped>
.post-title-input {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1c1e21;
  background-color: transparent;
  border-radius: 0;
}

.post-title-input:focus {
  border-color: transparent !important;
  box-shadow: none;
  outline: none;
}

.post-title-input::placeholder {
  color: #b0bcc4;
  font-weight: 400;
  font-size: 1.1rem;
}

.post-content-input {
  font-size: 1rem;
  color: #1c1e21;
  background-color: transparent;
  border-radius: 0;
  resize: vertical;
  min-height: 100px;
}

.post-content-input:focus {
  border-color: transparent !important;
  box-shadow: none;
  outline: none;
}

.post-content-input::placeholder {
  color: #b0bcc4;
}

.image-preview-container {
  position: relative;
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 0.5rem;
}

.preview-thumb {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.remove-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  transition: all 0.2s ease;
}

.remove-image-btn:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.remove-image-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.video-preview-container {
  position: relative;
}

.video-preview {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
}

.remove-video-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  transition: all 0.2s ease;
}

.remove-video-btn:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.remove-video-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.emotion-selector .btn-close-sm {
  width: 0.8em;
  height: 0.8em;
  padding: 0.1em;
  font-size: 0.8rem;
}

.emotion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;
}

.emotion-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.emotion-btn:hover {
  border-color: #007bff;
  background-color: #f8f9ff;
}

.emotion-btn.active {
  border-color: #007bff;
  background-color: #e7f3ff;
}

.emotion-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.emotion-label {
  font-size: 0.75rem;
  color: #6c757d;
  text-align: center;
}

.selected-emotion {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.emotion-display {
  font-weight: 500;
  color: #495057;
}

.post-actions {
  background-color: #f0f2f5;
  border-radius: 0 0 8px 8px;
  margin: 0 -1rem -1rem -1rem;
  padding: 1rem;
}

.action-btn {
  border: 1px solid #ccc !important;
  color: #333 !important;
  background: #f8f9fa !important;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background-color: #e4e6eb !important;
  border-color: #bcc0c4 !important;
  color: #333 !important;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline-primary {
  border-color: #0a66c2;
  color: #0a66c2;
}

.btn-outline-primary:hover:not(:disabled) {
  background-color: #e7f3ff;
  border-color: #0a66c2;
}

.btn-outline-secondary {
  border-color: #ccc;
  color: #65676b;
}

.btn-outline-secondary:hover:not(:disabled) {
  background-color: #e4e6eb;
  border-color: #bcc0c4;
}

.btn-primary {
  background-color: #0a66c2;
  border-color: #0a66c2;
  border-radius: 6px;
  font-weight: 600;
  padding: 0.5rem 1.5rem;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0856a8;
  border-color: #0856a8;
}

.btn-primary:disabled {
  background-color: #e4e6eb;
  border-color: #e4e6eb;
  color: #bcc0c4;
}

.is-invalid {
  border-color: #dc3545 !important;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
}

.alert {
  border-radius: 8px;
  border: none;
  margin-bottom: 1rem;
}

.alert-danger {
  background-color: #ffebee;
  color: #c62828;
}

/* Privacy Dropdown */
.privacy-dropdown {
  min-width: 280px;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.privacy-dropdown .dropdown-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.privacy-dropdown .dropdown-item:hover {
  background-color: #f0f2f5;
}

.privacy-dropdown .dropdown-item.active {
  background: linear-gradient(135deg, rgba(22, 91, 51, 0.1), rgba(196, 30, 58, 0.1));
  color: #165b33;
}

.privacy-dropdown .dropdown-item i {
  font-size: 1.25rem;
  margin-top: 2px;
}

.privacy-dropdown .dropdown-item small {
  font-size: 0.75rem;
  line-height: 1.3;
}

@media (max-width: 576px) {
  .post-title-input {
    font-size: 1.25rem;
  }

  .action-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .d-none.d-sm-inline {
    display: inline !important;
  }
  
  .privacy-dropdown {
    min-width: 240px;
  }
}
</style>
