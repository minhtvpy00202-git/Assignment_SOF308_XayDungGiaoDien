<template>
  <div :class="['message-bubble d-flex mb-3', isSent ? 'sent justify-content-end' : 'received justify-content-start']">
    <div :class="['message-content p-3 rounded-3', isSent ? 'bg-primary text-white' : 'bg-light text-dark']">
      <div class="message-header d-flex justify-content-between align-items-center mb-1">
        <span class="sender-name fw-semibold small">{{ senderName }}</span>
        <span class="message-time ms-2 opacity-75" style="font-size: 0.7rem;">{{ formattedTime }}</span>
      </div>
      <div class="message-text">{{ message.content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '../types'

interface Props {
  message: Message
  senderName: string
  isSent: boolean
}

const props = defineProps<Props>()

// Format the timestamp
const formattedTime = computed(() => {
  const date = new Date(props.message.createdAt)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
})
</script>

<style scoped>
.message-bubble {
  animation: fadeIn 0.3s ease-in;
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

.message-content {
  max-width: 70%;
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
</style>
