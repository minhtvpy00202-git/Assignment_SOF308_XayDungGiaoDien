<template>
  <!-- This component has no UI, it just listens for new messages -->
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useChatPopups } from '../composables/useChatPopups'
import { apiService } from '../services/apiService'
import { messageEventBus, MESSAGE_EVENTS } from '../utils/messageEvents'

const { currentUser } = useAuth()
const { openChatPopup } = useChatPopups()
const route = useRoute()

let checkInterval: number | null = null
const lastCheckedMessageIds = ref<Set<string>>(new Set())

// Play notification sound
const playNotificationSound = () => {
  try {
    const audio = new Audio(new URL('../assets/sound/message_tone.mp3', import.meta.url).href)
    audio.volume = 0.5
    audio.play().catch(error => {
      console.error('Failed to play notification sound:', error)
    })
  } catch (error) {
    console.error('Failed to play notification sound:', error)
  }
}

// Check for new messages
const checkForNewMessages = async () => {
  if (!currentUser.value) return

  try {
    const allMessages = await apiService.getMessages()
    
    // Filter messages where current user is the receiver
    const receivedMessages = allMessages.filter(
      m => m.receiverId === currentUser.value!.id
    )

    // Find new messages (not in lastCheckedMessageIds)
    const newMessages = receivedMessages.filter(
      m => !lastCheckedMessageIds.value.has(m.id)
    )

    // Process each new message
    for (const message of newMessages) {
      // Skip if we're currently on the messages page with this sender
      const isOnMessagesPage = route.name === 'messages' && route.params.userId === message.senderId
      
      if (!isOnMessagesPage) {
        // Play sound
        playNotificationSound()
        
        // Get sender info
        try {
          const sender = await apiService.getUserById(message.senderId)
          
          // Get all messages with this sender
          const conversationMessages = await apiService.getMessagesBetweenUsers(
            currentUser.value!.id,
            message.senderId
          )
          
          // Sort messages by timestamp
          const sortedMessages = conversationMessages.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          
          // Open or update chat popup
          openChatPopup(sender, message.senderId, sortedMessages)
        } catch (error) {
          console.error('Failed to load sender info:', error)
        }
      }
      
      // Mark as checked
      lastCheckedMessageIds.value.add(message.id)
    }
  } catch (error) {
    console.error('Failed to check for new messages:', error)
  }
}

// Handle instant message notification when someone sends a message
const handleMessageSent = (data: { message: any, receiverId: string }) => {
  // If the message is for current user, check immediately
  if (data.receiverId === currentUser.value?.id) {
    setTimeout(checkForNewMessages, 100) // Small delay to ensure message is saved
  }
}

// Initialize
const initialize = async () => {
  if (!currentUser.value) return

  try {
    // Load all existing messages to initialize the checked set
    const allMessages = await apiService.getMessages()
    const receivedMessages = allMessages.filter(
      m => m.receiverId === currentUser.value!.id
    )
    
    receivedMessages.forEach(m => {
      lastCheckedMessageIds.value.add(m.id)
    })
    
    // Listen for instant message events
    messageEventBus.on(MESSAGE_EVENTS.NEW_MESSAGE_SENT, handleMessageSent)
    
    // Start checking for new messages every 2 seconds as backup
    checkInterval = window.setInterval(checkForNewMessages, 2000)
  } catch (error) {
    console.error('Failed to initialize message listener:', error)
  }
}

onMounted(() => {
  if (currentUser.value) {
    initialize()
  }
})

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
  // Remove event listener
  messageEventBus.off(MESSAGE_EVENTS.NEW_MESSAGE_SENT, handleMessageSent)
})
</script>
