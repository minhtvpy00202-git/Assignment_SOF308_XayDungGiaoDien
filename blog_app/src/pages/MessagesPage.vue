<template>
  <div class="messages-page">
    <div class="container-fluid mt-4">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card">
            <!-- Header with user info -->
            <div class="card-header bg-primary text-white">
              <div class="d-flex align-items-center">
                <button
                  class="btn btn-link text-white p-0 me-3"
                  @click="goBack"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                  </svg>
                </button>
                <router-link 
                  v-if="otherUser"
                  :to="`/profile/${otherUser.id}`"
                  class="d-flex align-items-center text-decoration-none text-white"
                >
                  <img
                    :src="otherUser.avatar"
                    :alt="otherUser.name"
                    class="rounded-circle me-3"
                    width="40"
                    height="40"
                  />
                  <div>
                    <h5 class="mb-0">{{ otherUser.name }}</h5>
                  </div>
                </router-link>
                <div v-else>
                  <h5 class="mb-0">Loading...</h5>
                </div>
              </div>
            </div>

            <!-- Messages container -->
            <div class="card-body messages-container" ref="messagesContainer">
              <!-- Loading indicator -->
              <div v-if="loading && messages.length === 0" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading messages...</p>
              </div>

              <!-- Empty state -->
              <div v-else-if="messages.length === 0" class="text-center py-5">
                <p class="text-muted">No messages yet. Start the conversation!</p>
              </div>

              <!-- Messages list -->
              <div v-else>
                <MessageBubble
                  v-for="message in messages"
                  :key="message.id"
                  :message="message"
                  :sender-name="getSenderName(message)"
                  :is-sent="message.senderId === currentUser?.id"
                />
              </div>
            </div>

            <!-- Message input -->
            <MessageInput
              v-if="otherUser"
              @send="handleSendMessage"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessages } from '../composables/useMessages'
import { useAuth } from '../composables/useAuth'
import { apiService } from '../services/apiService'
import MessageBubble from '../components/MessageBubble.vue'
import MessageInput from '../components/MessageInput.vue'
import type { User } from '../types'

const route = useRoute()
const router = useRouter()
const { currentConversation, loading, fetchConversationWith, sendMessage } = useMessages()
const { currentUser } = useAuth()

const otherUser = ref<User | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
let refreshInterval: number | null = null
let previousMessageCount = 0

// Get userId from route params
const otherUserId = computed(() => route.params.userId as string)

// Messages from composable
const messages = computed(() => currentConversation.value)

// Play notification sound
const playNotificationSound = () => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Create oscillator for notification sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Configure sound (pleasant notification tone)
    oscillator.frequency.value = 800 // Hz
    oscillator.type = 'sine'
    
    // Fade in and out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    // Play sound
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    console.error('Failed to play notification sound:', error)
  }
}

// Get sender name for a message
const getSenderName = (message: typeof messages.value[0]) => {
  if (message.senderId === currentUser.value?.id) {
    return currentUser.value.name
  }
  return otherUser.value?.name || 'Unknown'
}

// Scroll to bottom of messages
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Handle sending a message
const handleSendMessage = async (content: string) => {
  try {
    await sendMessage(otherUserId.value, content)
    // Auto-scroll to bottom after sending
    await scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)
    alert('Failed to send message. Please try again.')
  }
}

// Go back to home page
const goBack = () => {
  router.push('/')
}

// Load conversation and user data
const loadConversation = async (shouldScroll = true) => {
  try {
    // Fetch the other user's information (only on first load)
    if (!otherUser.value) {
      otherUser.value = await apiService.getUserById(otherUserId.value)
    }
    
    // Store current message count before fetching
    const oldMessageCount = messages.value.length
    
    // Store current scroll position
    const container = messagesContainer.value
    const wasAtBottom = container 
      ? container.scrollHeight - container.scrollTop - container.clientHeight < 100
      : true
    
    // Fetch the conversation
    await fetchConversationWith(otherUserId.value)
    
    // Check if new messages arrived from other user
    const newMessageCount = messages.value.length
    if (newMessageCount > oldMessageCount && previousMessageCount > 0) {
      // Check if the new message is from the other user (not from current user)
      const latestMessage = messages.value[messages.value.length - 1]
      if (latestMessage && latestMessage.senderId !== currentUser.value?.id) {
        playNotificationSound()
      }
    }
    
    // Update previous message count
    previousMessageCount = newMessageCount
    
    // Only scroll if we were at bottom or it's the first load
    if (shouldScroll && wasAtBottom) {
      await scrollToBottom()
    }
  } catch (error) {
    console.error('Failed to load conversation:', error)
    if (!otherUser.value) {
      alert('Failed to load conversation. Please try again.')
      router.push('/')
    }
  }
}

// Start auto-refresh for new messages
const startAutoRefresh = () => {
  // Refresh every 3 seconds
  refreshInterval = window.setInterval(() => {
    loadConversation(true)
  }, 3000)
}

// Stop auto-refresh
const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Watch for changes in messages and auto-scroll
watch(
  () => messages.value.length,
  async () => {
    await scrollToBottom()
  }
)

onMounted(async () => {
  await loadConversation()
  // Set initial message count after first load
  previousMessageCount = messages.value.length
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.messages-page {
  min-height: calc(100vh - 56px);
  background-color: #f8f9fa;
}

.card {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.card-header {
  flex-shrink: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background-color: white;
  scroll-behavior: smooth;
}

.rounded-circle {
  object-fit: cover;
}

.btn-link {
  text-decoration: none;
}

.btn-link:hover {
  opacity: 0.8;
}

/* Custom scrollbar */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
