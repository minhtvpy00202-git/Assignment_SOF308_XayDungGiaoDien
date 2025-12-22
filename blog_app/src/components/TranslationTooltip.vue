<template>
  <div v-if="showTooltip" class="translation-tooltip">
    <div class="tooltip-content">
      <div class="d-flex align-items-start">
        <i class="bi bi-lightbulb text-warning me-2 mt-1"></i>
        <div class="flex-grow-1">
          <strong>{{ t('translation.tipTitle') }}</strong>
          <p class="mb-2 small">{{ t('translation.tipMessage') }}</p>
          <div class="d-flex gap-2">
            <button @click="openLanguageMenu" class="btn btn-sm btn-outline-primary">
              {{ t('translation.changeLanguage') }}
            </button>
            <button @click="dismissTooltip" class="btn btn-sm btn-outline-secondary">
              {{ t('common.dismiss') }}
            </button>
          </div>
        </div>
        <button @click="dismissTooltip" class="btn-close btn-sm" :aria-label="t('common.close')"></button>
      </div>
    </div>
    <div class="tooltip-arrow"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLocale } from '../composables/useLocale'

const { t } = useLocale()
const showTooltip = ref(false)

// Check if tooltip should be shown
const checkTooltipVisibility = () => {
  try {
    const dismissed = localStorage.getItem('translation_tooltip_dismissed')
    const hasUsedTranslation = localStorage.getItem('translation_feature_seen')
    
    // Show tooltip if user hasn't dismissed it and hasn't used translation yet
    showTooltip.value = !dismissed && !hasUsedTranslation
  } catch (error) {
    console.error('Error checking tooltip visibility:', error)
    showTooltip.value = false
  }
}

// Open language dropdown menu
const openLanguageMenu = () => {
  // Find and click the language dropdown
  const languageDropdown = document.getElementById('languageDropdown')
  if (languageDropdown) {
    languageDropdown.click()
  }
  dismissTooltip()
}

// Dismiss tooltip
const dismissTooltip = () => {
  try {
    localStorage.setItem('translation_tooltip_dismissed', 'true')
  } catch (error) {
    console.error('Error saving tooltip dismissed status:', error)
  }
  
  showTooltip.value = false
}

onMounted(() => {
  // Show tooltip after a delay
  setTimeout(() => {
    checkTooltipVisibility()
  }, 5000)
})
</script>

<style scoped>
.translation-tooltip {
  position: fixed;
  top: 60px;
  right: 20px;
  z-index: 1025;
  max-width: 320px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideInRight 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tooltip-content {
  padding: 1rem;
}

.tooltip-arrow {
  position: absolute;
  top: 15px;
  right: -8px;
  width: 0;
  height: 0;
  border-left: 8px solid white;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
}

.tooltip-arrow::before {
  content: '';
  position: absolute;
  top: -9px;
  left: -9px;
  width: 0;
  height: 0;
  border-left: 9px solid #dee2e6;
  border-top: 9px solid transparent;
  border-bottom: 9px solid transparent;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@media (max-width: 768px) {
  .translation-tooltip {
    right: 10px;
    left: 10px;
    max-width: none;
    top: 100px;
  }
  
  .tooltip-arrow {
    display: none;
  }
}
</style>