<template>
  <div v-if="showBanner" class="translation-banner alert alert-info alert-dismissible fade show" role="alert">
    <div class="d-flex align-items-center">
      <i class="bi bi-info-circle me-2"></i>
      <div class="flex-grow-1">
        <strong>{{ t('translation.newFeature') }}</strong>
        {{ t('translation.bannerMessage') }}
      </div>
      <button 
        @click="enableTranslation"
        class="btn btn-sm btn-primary me-2"
      >
        {{ t('translation.tryNow') }}
      </button>
      <button 
        type="button" 
        class="btn-close" 
        @click="dismissBanner"
        :aria-label="t('common.close')"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLocale } from '../composables/useLocale'
import { useContentTranslation } from '../composables/useContentTranslation'

const { t } = useLocale()
const { translationEnabled, toggleTranslation } = useContentTranslation()

const showBanner = ref(false)

// Check if banner should be shown
const checkBannerVisibility = () => {
  try {
    const dismissed = localStorage.getItem('translation_banner_dismissed')
    const hasSeenFeature = localStorage.getItem('translation_feature_seen')
    
    // Show banner if user hasn't dismissed it and hasn't seen the feature
    showBanner.value = !dismissed && !hasSeenFeature && !translationEnabled.value
  } catch (error) {
    console.error('Error checking banner visibility:', error)
    showBanner.value = false
  }
}

// Enable translation and mark feature as seen
const enableTranslation = () => {
  if (!translationEnabled.value) {
    toggleTranslation()
  }
  
  try {
    localStorage.setItem('translation_feature_seen', 'true')
  } catch (error) {
    console.error('Error saving feature seen status:', error)
  }
  
  showBanner.value = false
}

// Dismiss banner
const dismissBanner = () => {
  try {
    localStorage.setItem('translation_banner_dismissed', 'true')
  } catch (error) {
    console.error('Error saving banner dismissed status:', error)
  }
  
  showBanner.value = false
}

onMounted(() => {
  // Show banner after a short delay
  setTimeout(() => {
    checkBannerVisibility()
  }, 2000)
})
</script>

<style scoped>
.translation-banner {
  position: fixed;
  top: 90px; /* Below the fixed navbar */
  left: 50%;
  transform: translateX(-50%);
  z-index: 1020;
  max-width: 600px;
  width: 90%;
  margin: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  animation: bannerSlide 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes bannerSlide {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@media (max-width: 768px) {
  .translation-banner {
    top: 100px;
    width: 95%;
    font-size: 0.9rem;
  }
  
  .translation-banner .btn-sm {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
  }
}
</style>