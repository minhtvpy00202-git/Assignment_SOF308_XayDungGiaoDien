<template>
  <div v-if="isOpen" class="chat-popup">
    <div class="chat-popup-header">
      <div class="d-flex align-items-center">
        <img :src="otherUser?.avatar" :alt="otherUser?.name" class="rounded-circle me-2" width="32" height="32">
        <div>
          <h6 class="mb-0">{{ otherUser?.name }}</h6>
          <small class="text-muted">{{ userStatus }}</small>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button @click="minimize" class="btn btn-sm btn-link text-white p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
          </svg>
        </button>
        <button @click="close" class="btn btn-sm btn-link text-white p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="chat-popup-body" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="message.id" class="message-wrapper" :class="{ 'own-message': message.senderId === currentUser?.id }">
        <div class="message-container">
          <div class="message-bubble">
            {{ message.content }}
          </div>
          <!-- Status text for own messages (only show on last message) -->
          <div v-if="message.senderId === currentUser?.id && isLastOwnMessage(index)" class="message-status-text">
            {{ getStatusText(message.status) }}
          </div>
          <!-- Time for received messages (only show on last received message) -->
          <div v-if="message.senderId !== currentUser?.id && isLastReceivedMessage(index)" class="message-time-text">
            {{ formatMessageTime(message.createdAt) }}
          </div>
        </div>
      </div>
    </div>

    <div class="chat-popup-footer">
      <input 
        v-model="newMessage" 
        type="text" 
        class="form-control form-control-sm" 
        :placeholder="t('messages.typeMessage')"
        @keyup.enter="sendMessage"
      >
      <button @click="sendMessage" class="btn btn-primary btn-sm ms-2" :disabled="!newMessage.trim()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import type { Message, User } from '../types'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'
import { useMessages } from '../composables/useMessages'
import { useChatPopups } from '../composables/useChatPopups'
import { apiService } from '../services/apiService'
import { messageEventBus, MESSAGE_EVENTS } from '../utils/messageEvents'

interface Props {
  otherUser: User | null
  conversationId: string
  initialMessages: Message[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  minimize: []
}>()

const { currentUser } = useAuth()
const { t } = useLocale()
const { sendMessage: sendMsg } = useMessages()
const { updateChatPopupMessages } = useChatPopups()

const isOpen = ref(true)
const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const messages = ref<Message[]>(props.initialMessages)
const otherUserData = ref<User | null>(props.otherUser)
let refreshInterval: number | null = null
let userStatusInterval: number | null = null

// Computed property for user status
const userStatus = computed(() => {
  if (!props.otherUser) return t('messages.offline')
  
  // Check if user has isOnline property and lastSeen
  if (props.otherUser.isOnline) {
    return t('messages.active')
  }
  
  // If user has lastSeen, calculate time difference
  if (props.otherUser.lastSeen) {
    const lastSeenTime = new Date(props.otherUser.lastSeen)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lastSeenTime.getTime()) / (1000 * 60))
    
    if (diffMinutes < 5) return t('messages.active')
    if (diffMinutes < 60) return `${diffMinutes} phút trước`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ trước`
    return `${Math.floor(diffMinutes / 1440)} ngày trước`
  }
  
  // Fallback to old logic if no online status available
  if (!messages.value.length) return t('messages.offline')
  
  // Get the last message from the other user
  const otherUserMessages = messages.value.filter(msg => msg.senderId === props.otherUser?.id)
  if (!otherUserMessages.length) return t('messages.offline')
  
  const lastMessage = otherUserMessages[otherUserMessages.length - 1]
  if (!lastMessage) return t('messages.offline')
  
  const lastMessageTime = new Date(lastMessage.createdAt)
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - lastMessageTime.getTime()) / (1000 * 60))
  
  if (diffMinutes < 5) return t('messages.active')
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ trước`
  return `${Math.floor(diffMinutes / 1440)} ngày trước`
})

// Watch for new messages from parent
watch(() => props.initialMessages, (newMessages) => {
  messages.value = newMessages
  scrollToBottom()
}, { deep: true })

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Refresh messages from server
const refreshMessages = async () => {
  if (!currentUser.value || !props.otherUser) return

  try {
    const latestMessages = await apiService.getMessagesBetweenUsers(
      currentUser.value.id,
      props.otherUser.id
    )
    
    const sortedMessages = latestMessages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    // Only update if there are new messages or status changed
    const hasChanges = sortedMessages.length !== messages.value.length ||
      sortedMessages.some((msg, idx) => msg.status !== messages.value[idx]?.status)
    
    if (hasChanges) {
      messages.value = sortedMessages
      updateChatPopupMessages(props.otherUser.id, sortedMessages)
      scrollToBottom()
    }
    
    // Mark received messages as seen
    await markMessagesAsSeen()
  } catch (error) {
    console.error('Failed to refresh messages:', error)
  }
}

// Mark messages from other user as seen
const markMessagesAsSeen = async () => {
  if (!currentUser.value || !props.otherUser) return
  
  try {
    await apiService.markMessagesAsSeen(currentUser.value.id, props.otherUser.id)
  } catch (error) {
    console.error('Failed to mark messages as seen:', error)
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !currentUser.value || !props.otherUser) return

  try {
    const newMsg = await sendMsg(props.otherUser.id, newMessage.value.trim())
    
    // Add the new message immediately to the local state
    messages.value.push(newMsg)
    updateChatPopupMessages(props.otherUser.id, messages.value)
    
    newMessage.value = ''
    scrollToBottom()
    
    // Refresh to make sure we have the latest
    setTimeout(refreshMessages, 500)
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}

const minimize = () => {
  emit('minimize')
}

const close = () => {
  emit('close')
}

// Get status text for message
const getStatusText = (status?: string) => {
  switch (status) {
    case 'sent':
      return t('messages.sent')
    case 'delivered':
      return t('messages.delivered')
    case 'seen':
      return t('messages.seen')
    default:
      return t('messages.sent')
  }
}

// Check if this is the last own message
const isLastOwnMessage = (index: number) => {
  if (!currentUser.value) return false
  const ownMessages = messages.value.filter(m => m.senderId === currentUser.value?.id)
  if (ownMessages.length === 0) return false
  const lastOwnMessage = ownMessages[ownMessages.length - 1]
  const currentMessage = messages.value[index]
  return currentMessage && lastOwnMessage && currentMessage.id === lastOwnMessage.id
}

// Check if this is the last received message
const isLastReceivedMessage = (index: number) => {
  if (!props.otherUser) return false
  const receivedMessages = messages.value.filter(m => m.senderId === props.otherUser?.id)
  if (receivedMessages.length === 0) return false
  const lastReceivedMessage = receivedMessages[receivedMessages.length - 1]
  const currentMessage = messages.value[index]
  return currentMessage && lastReceivedMessage && currentMessage.id === lastReceivedMessage.id
}

// Format message time
const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Start auto-refresh for messages
const startAutoRefresh = () => {
  refreshInterval = window.setInterval(refreshMessages, 1000) // Every 1 second for faster sync
}

// Stop auto-refresh
const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Handle instant message updates
const handleMessageSent = (data: { message: any, receiverId: string }) => {
  // If message involves this conversation, refresh immediately
  if (data.receiverId === props.otherUser?.id || data.message.senderId === props.otherUser?.id) {
    setTimeout(refreshMessages, 50) // Very small delay
  }
}

onMounted(async () => {
  scrollToBottom()
  startAutoRefresh()
  // Listen for instant message events
  messageEventBus.on(MESSAGE_EVENTS.NEW_MESSAGE_SENT, handleMessageSent)
  
  // Mark messages as seen when chat opens
  await markMessagesAsSeen()
})

onUnmounted(() => {
  stopAutoRefresh()
  // Remove event listener
  messageEventBus.off(MESSAGE_EVENTS.NEW_MESSAGE_SENT, handleMessageSent)
})
</script>

<style scoped>
.chat-popup {
  position: fixed;
  bottom: 0;
  right: 80px;
  width: 328px;
  height: 455px;
  background: white;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.chat-popup-header {
  background: linear-gradient(135deg, #0084ff 0%, #0066cc 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-popup-header h6 {
  font-size: 14px;
  font-weight: 600;
}

.chat-popup-header small {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.chat-popup-header .btn-link {
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.chat-popup-header .btn-link:hover {
  opacity: 1;
}

.chat-popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f0f2f5;
}

.message-wrapper {
  display: flex;
  margin: 0;
  padding: 0;
}

.message-wrapper.own-message {
  justify-content: flex-end;
  margin: 0;
  padding: 0;
}

.message-container {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  margin: 0;
  padding: 0;
}

.own-message .message-container {
  align-items: flex-end;
  margin: 0;
  padding: 0;
}

.message-bubble {
  padding: 8px 12px;
  border-radius: 18px;
  background: #e4e6eb;
  color: #050505;
  font-size: 14px;
  word-wrap: break-word;
}

.own-message .message-bubble {
  background: #0084ff;
  color: white;
}

.message-status-text {
  font-size: 11px;
  color: #65676b;
  margin-top: 1px;
  padding-right: 4px;
}

.message-time-text {
  font-size: 11px;
  color: #65676b;
  margin-top: 1px;
  padding-left: 4px;
}

.chat-popup-footer {
  padding: 12px;
  border-top: 1px solid #e4e6eb;
  display: flex;
  align-items: center;
  background: white;
}

.chat-popup-footer input {
  border-radius: 20px;
  background: #f0f2f5;
  border: none;
  padding: 8px 12px;
}

.chat-popup-footer input:focus {
  background: #e4e6eb;
  box-shadow: none;
}

.chat-popup-footer button {
  border-radius: 50%;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rounded-circle {
  object-fit: cover;
}
</style>
