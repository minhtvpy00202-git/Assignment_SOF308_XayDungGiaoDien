<template>
  <div v-if="sentimentInfo" class="sentiment-badge" :style="badgeStyle">
    <span class="sentiment-icon">{{ sentimentInfo.icon }}</span>
    <span class="sentiment-label">{{ sentimentInfo.label }}</span>
    <span v-if="showConfidence && confidence" class="sentiment-confidence">
      ({{ Math.round(confidence * 100) }}%)
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../composables/useLocale'

interface Props {
  sentiment?: string
  confidence?: number
  showConfidence?: boolean
  size?: 'small' | 'normal' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  showConfidence: false,
  size: 'normal'
})

const { t } = useLocale()

const sentimentInfo = computed(() => {
  if (!props.sentiment) return null
  
  const displays: Record<string, { icon: string; color: string; bgColor: string }> = {
    positive: { icon: '😊', color: '#22c55e', bgColor: '#dcfce7' },
    negative: { icon: '😡', color: '#ef4444', bgColor: '#fee2e2' },
    neutral: { icon: '😐', color: '#6b7280', bgColor: '#f3f4f6' }
  }
  
  const display = displays[props.sentiment]
  if (!display) return null
  
  return {
    ...display,
    label: t(`sentiment.${props.sentiment}`)
  }
})

const badgeStyle = computed(() => {
  if (!sentimentInfo.value) return {}
  
  const sizes = {
    small: { fontSize: '11px', padding: '2px 6px' },
    normal: { fontSize: '12px', padding: '4px 8px' },
    large: { fontSize: '14px', padding: '6px 12px' }
  }
  
  return {
    color: sentimentInfo.value.color,
    backgroundColor: sentimentInfo.value.bgColor,
    border: `1px solid ${sentimentInfo.value.color}`,
    ...sizes[props.size]
  }
})
</script>

<style scoped>
.sentiment-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 12px;
  padding: 4px 8px;
  white-space: nowrap;
}

.sentiment-icon {
  font-size: 1.1em;
}

.sentiment-confidence {
  opacity: 0.8;
  font-size: 0.9em;
}
</style>