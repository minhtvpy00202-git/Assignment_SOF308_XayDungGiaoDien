import { ref, readonly, type Ref } from 'vue'
import type { Message, CreateMessageData, Conversation } from '../types'
import { apiService } from '../services/apiService'
import { useAuth } from './useAuth'
import { useNotifications } from './useNotifications'
import { messageEventBus, MESSAGE_EVENTS } from '../utils/messageEvents'

const conversations: Ref<Conversation[]> = ref([])
const currentConversation: Ref<Message[]> = ref([])
const loading: Ref<boolean> = ref(false)

export function useMessages() {
  const { currentUser } = useAuth()
  const { createNotification } = useNotifications()

  const fetchConversations = async (): Promise<void> => {
    if (!currentUser.value) {
      conversations.value = []
      return
    }

    loading.value = true
    try {
      const allMessages = await apiService.getMessages()

      // Filter messages where current user is sender or receiver
      const userMessages = allMessages.filter(
        m => m.senderId === currentUser.value!.id || m.receiverId === currentUser.value!.id
      )

      // Group by conversation partner
      const conversationsMap = new Map<string, Message[]>()

      userMessages.forEach(message => {
        const partnerId =
          message.senderId === currentUser.value!.id ? message.receiverId : message.senderId

        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, [])
        }
        conversationsMap.get(partnerId)!.push(message)
      })

      // Convert to conversation objects with last message
      const conversationsList: Conversation[] = []

      for (const [userId, messages] of conversationsMap.entries()) {
        // Sort messages by timestamp descending to get the most recent
        const sortedMessages = messages.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        const lastMessage = sortedMessages[0]

        // Skip if no messages found (shouldn't happen, but safety check)
        if (!lastMessage) {
          continue
        }

        // Fetch user information for the conversation partner
        try {
          const user = await apiService.getUserById(userId)
          conversationsList.push({
            userId,
            userName: user.name,
            userAvatar: user.avatar,
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.createdAt,
            unreadCount: 0 // TODO: implement read tracking
          })
        } catch (error) {
          // Skip conversations where user cannot be found
          console.error(`Failed to fetch user ${userId}:`, error)
        }
      }

      // Sort conversations by most recent message
      conversationsList.sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      )

      conversations.value = conversationsList
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      conversations.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchConversationWith = async (userId: string): Promise<void> => {
    if (!currentUser.value) {
      currentConversation.value = []
      return
    }

    loading.value = true
    try {
      const messages = await apiService.getMessagesBetweenUsers(currentUser.value.id, userId)

      // Sort messages by timestamp ascending (oldest first)
      const sortedMessages = messages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

      currentConversation.value = sortedMessages
    } catch (error) {
      console.error('Failed to fetch conversation:', error)
      currentConversation.value = []
    } finally {
      loading.value = false
    }
  }

  const sendMessage = async (receiverId: string, content: string): Promise<Message> => {
    // Validate empty message
    if (!content || !content.trim()) {
      throw new Error('Message content cannot be empty')
    }

    if (!currentUser.value) {
      throw new Error('User must be authenticated to send a message')
    }

    loading.value = true
    try {
      const messageData: CreateMessageData = {
        senderId: currentUser.value.id,
        receiverId,
        content: content.trim()
      }

      const newMessage = await apiService.createMessage(messageData)

      // Add the new message to the current conversation if it's the active one
      if (currentConversation.value.length > 0) {
        const firstMessage = currentConversation.value[0]
        if (firstMessage) {
          const isActiveConversation =
            (firstMessage.senderId === receiverId || firstMessage.receiverId === receiverId) &&
            (firstMessage.senderId === currentUser.value.id ||
              firstMessage.receiverId === currentUser.value.id)

          if (isActiveConversation) {
            currentConversation.value.push(newMessage)
          }
        }
      } else {
        // If this is the first message in a new conversation
        currentConversation.value = [newMessage]
      }

      // Refresh conversations to update the list
      await fetchConversations()
      
      // Create notification for message receiver
      try {
        await createNotification({
          userId: receiverId,
          fromUserId: currentUser.value.id,
          type: 'message',
          message: content.trim().substring(0, 50) + (content.length > 50 ? '...' : '')
        })
      } catch (err) {
        console.error('Failed to create message notification:', err)
      }
      
      // Emit event for instant notification
      messageEventBus.emit(MESSAGE_EVENTS.NEW_MESSAGE_SENT, {
        message: newMessage,
        receiverId
      })
      
      return newMessage
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    conversations: readonly(conversations),
    currentConversation: readonly(currentConversation),
    loading: readonly(loading),
    fetchConversations,
    fetchConversationWith,
    sendMessage
  }
}
