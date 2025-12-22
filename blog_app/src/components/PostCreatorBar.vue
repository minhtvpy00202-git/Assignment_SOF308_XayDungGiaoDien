<template>
  <div class="post-creator-bar">
    <div class="card shadow-sm border-0">
      <div class="card-body p-3">
        <div class="d-flex gap-3 align-items-center">
          <!-- User Avatar -->
          <img 
            v-if="currentUser?.avatar"
            :src="currentUser.avatar" 
            :alt="currentUser.name"
            class="avatar"
          />
          <div v-else class="avatar avatar-placeholder">
            {{ (currentUser?.name || '?').charAt(0).toUpperCase() }}
          </div>

          <!-- Input area -->
          <div class="flex-grow-1">
            <button
              class="creator-input"
              @click="$emit('click')"
              :placeholder="t('post.placeholder')"
            >
              {{ t('post.placeholder') || 'Mình ơi, bạn đang nghĩ gì thế?' }}
            </button>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="d-flex gap-2 mt-3 pt-3 border-top">
          <!-- Video button -->
          <button
            type="button"
            class="action-button"
            @click="handleVideoClick"
            :disabled="props.isDisabled"
          >
            <i class="bi bi-camera-video"></i>
            <span class="d-none d-sm-inline ms-2">{{ t('post.video') || 'Video' }}</span>
          </button>

          <!-- Photo button -->
          <button
            type="button"
            class="action-button"
            @click="handleImageClick"
            :disabled="props.isDisabled"
          >
            <i class="bi bi-image"></i>
            <span class="d-none d-sm-inline ms-2">{{ t('post.image') || 'Hình ảnh' }}</span>
          </button>

          <!-- Emotion button -->
          <button
            type="button"
            class="action-button"
            @click="handleEmotionClick"
            :disabled="props.isDisabled"
          >
            <i class="bi bi-emoji-smile"></i>
            <span class="d-none d-sm-inline ms-2">{{ t('post.emotion') || 'Cảm xúc' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from '../composables/useLocale'
import { useAuth } from '../composables/useAuth'

interface Props {
  isDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDisabled: false
})

const { t } = useLocale()
const { currentUser } = useAuth()

const emit = defineEmits<{
  click: []
  upload: []
  videoClick: []
  emotionClick: []
}>()

// Handle video click
const handleVideoClick = () => {
  emit('videoClick')
}

// Handle emotion click  
const handleEmotionClick = () => {
  emit('emotionClick')
}

// Handle image click
const handleImageClick = () => {
  emit('upload')
}
</script>

<style scoped>
.post-creator-bar {
  margin-bottom: 1.5rem;
}

.card {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.creator-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #f0f2f5;
  border: none;
  border-radius: 24px;
  font-size: 0.95rem;
  color: #65676b;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: inherit;
}

.creator-input:hover {
  background-color: #e4e6eb;
}

.creator-input:focus {
  outline: none;
  background-color: #e4e6eb;
}

.creator-input::placeholder {
  color: #b0bcc4;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background-color: transparent;
  border: none;
  border-radius: 6px;
  color: #65676b;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 0.5rem;
}

.action-button:hover:not(:disabled) {
  background-color: #f0f2f5;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.action-button:active {
  background-color: #e4e6eb;
}

.action-button i {
  font-size: 1.1rem;
}

/* Color coding for buttons */
.action-button:nth-child(1):not(:disabled) i {
  color: #e7163a;
}

.action-button:nth-child(2):not(:disabled) i {
  color: #31a24c;
}

.action-button:nth-child(3):not(:disabled) i {
  color: #ffc400;
}

@media (max-width: 576px) {
  .card-body {
    padding: 0.75rem !important;
  }

  .d-flex.gap-3 {
    gap: 0.75rem !important;
  }

  .avatar {
    width: 36px;
    height: 36px;
  }

  .action-button {
    padding: 0.4rem 0.5rem;
    font-size: 0.8rem;
  }

  .action-button i {
    font-size: 1rem;
  }
}
</style>
