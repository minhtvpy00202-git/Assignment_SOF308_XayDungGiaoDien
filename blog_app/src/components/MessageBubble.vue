<template>
  <div :class="['message-bubble d-flex', isSent ? 'sent justify-content-end' : 'received justify-content-start']">
    <div class="message-wrapper">
      <div :class="['message-content p-2 rounded-3', isSent ? 'bg-primary text-white' : 'bg-light text-dark']">
        <div class="message-text">{{ message.content }}</div>
        <!-- Message status indicator for sent messages -->
        <div v-if="isSent" class="message-status text-end mt-1">
          <small class="status-text opacity-75" style="font-size: 0.65rem;">{{ statusText }}</small>
        </div>
      </div>
      <!-- Time display for received messages only (if showTime is true) -->
      <div v-if="!isSent && showTime" class="message-time-below">
        <small class="text-muted" style="font-size: 0.7rem;">{{ formattedTime }}</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '../types'
import { useLocale } from '../composables/useLocale'

interface Props {
  message: Message
  senderName: string
  isSent: boolean
  showTime?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTime: true
})
const { t } = useLocale()

// Format the timestamp
const formattedTime = computed(() => {
  const date = new Date(props.message.createdAt)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Get message status
const messageStatus = computed(() => {
  return props.message.status || 'sent'
})

// Get status text
const statusText = computed(() => {
  switch (messageStatus.value) {
    case 'sent':
      return t('messages.sent')
    case 'delivered':
      return t('messages.delivered')
    case 'seen':
      return t('messages.seen')
    default:
      return t('messages.sent')
  }
})
</script>

<style scoped>
.message-bubble {
  animation: fadeIn 0.3s ease-in;
  margin: 0;
  padding: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  margin: 0;
  padding: 0;
}

.message-content {
  word-wrap: break-word;
  word-break: break-word;
}

.message-bubble.sent .message-content {
  border-bottom-right-radius: 0.25rem !important;
}

.message-bubble.received .message-content {
  border-bottom-left-radius: 0.25rem !important;
}

.message-text {
  line-height: 1.4;
}

.message-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.status-text {
  color: rgba(255, 255, 255, 0.7);
}

.message-time-below {
  margin-top: 0.125rem;
  margin-left: 0.5rem;
}
</style>
