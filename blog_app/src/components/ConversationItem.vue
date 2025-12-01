<template>
  <div class="conversation-item list-group-item list-group-item-action" @click="handleClick">
    <div class="d-flex align-items-center">
      <!-- User avatar -->
      <img 
        :src="conversation.userAvatar" 
        :alt="conversation.userName" 
        class="rounded-circle me-3" 
        width="48" 
        height="48"
      >
      
      <!-- Conversation details -->
      <div class="flex-grow-1 overflow-hidden">
        <div class="d-flex justify-content-between align-items-start">
          <h6 class="mb-1">{{ conversation.userName }}</h6>
          <small class="text-muted">{{ formattedTime }}</small>
        </div>
        <p class="mb-0 text-muted small text-truncate">{{ conversation.lastMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Conversation } from '../types'

interface Props {
  conversation: Conversation
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [userId: string]
}>()

// Format the timestamp
const formattedTime = computed(() => {
  const date = new Date(props.conversation.lastMessageTime)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = diffInMs / (1000 * 60 * 60)
  
  // If less than 24 hours, show time
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // If less than 7 days, show day name
  if (diffInHours < 24 * 7) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short'
    })
  }
  
  // Otherwise show date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
})

const handleClick = () => {
  emit('click', props.conversation.userId)
}
</script>

<style scoped>
.conversation-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background-color: #f8f9fa;
}

.rounded-circle {
  object-fit: cover;
}

.text-truncate {
  max-width: 100%;
}
</style>
