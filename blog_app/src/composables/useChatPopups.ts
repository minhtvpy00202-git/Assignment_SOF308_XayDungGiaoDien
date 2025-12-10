import { ref } from 'vue'
import type { User, Message } from '../types'

interface ChatPopup {
  id: string
  otherUser: User
  conversationId: string
  messages: Message[]
  isMinimized: boolean
}

const chatPopups = ref<ChatPopup[]>([])

export function useChatPopups() {
  const openChatPopup = (otherUser: User, conversationId: string, messages: Message[]) => {
    // Check if popup already exists
    const existingIndex = chatPopups.value.findIndex(p => p.id === otherUser.id)
    
    if (existingIndex !== -1) {
      // If exists and minimized, restore it
      const existingPopup = chatPopups.value[existingIndex]
      if (existingPopup) {
        existingPopup.isMinimized = false
        existingPopup.messages = messages
      }
    } else {
      // Create new popup (max 3 popups)
      if (chatPopups.value.length >= 3) {
        chatPopups.value.shift() // Remove oldest
      }
      
      chatPopups.value.push({
        id: otherUser.id,
        otherUser,
        conversationId,
        messages,
        isMinimized: false
      })
    }
  }

  const closeChatPopup = (userId: string) => {
    const index = chatPopups.value.findIndex(p => p.id === userId)
    if (index !== -1) {
      chatPopups.value.splice(index, 1)
    }
  }

  const minimizeChatPopup = (userId: string) => {
    const popup = chatPopups.value.find(p => p.id === userId)
    if (popup) {
      popup.isMinimized = true
    }
  }

  const updateChatPopupMessages = (userId: string, messages: Message[]) => {
    const popup = chatPopups.value.find(p => p.id === userId)
    if (popup) {
      popup.messages = messages
    }
  }

  return {
    chatPopups,
    openChatPopup,
    closeChatPopup,
    minimizeChatPopup,
    updateChatPopupMessages
  }
}
