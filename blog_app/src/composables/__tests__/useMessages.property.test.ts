import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { useMessages } from '../useMessages'
import { useAuth } from '../useAuth'
import { apiService } from '../../services/apiService'

describe('useMessages Property Tests', () => {
  beforeAll(async () => {
    // Wait for JSON server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  beforeEach(async () => {
    // Clear all data before each test - delete in proper order to avoid foreign key issues
    // First delete messages
    try {
      const messages = await apiService.getMessages()
      await Promise.all(
        messages.map(async (message) => {
          try {
            await apiService['axiosInstance'].delete(`/messages/${message.id}`)
          } catch (e) {
            // Ignore errors if message already deleted
          }
        })
      )
      // Wait a bit to ensure deletions are processed
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (e) {
      // Ignore errors if can't fetch messages
    }

    // Then delete users
    try {
      const users = await apiService.getUsers()
      await Promise.all(
        users.map(async (user) => {
          try {
            await apiService['axiosInstance'].delete(`/users/${user.id}`)
          } catch (e) {
            // Ignore errors if user already deleted
          }
        })
      )
      // Wait a bit to ensure deletions are processed
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (e) {
      // Ignore errors if can't fetch users
    }

    // Clear localStorage and logout
    localStorage.clear()
    const { logout } = useAuth()
    logout()
  })

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear()
  })

  // Feature: blog-management, Property 29: Message creation includes required metadata
  it('Property 29: Message creation includes required metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.string({ minLength: 1, maxLength: 500 }).filter((s: string) => s.trim().length > 0),
        async (senderData, receiverData, messageContent) => {
          // Make emails unique by adding timestamp
          const uniqueSenderData = {
            ...senderData,
            email: `${Date.now()}-sender-${senderData.email}`
          }
          const uniqueReceiverData = {
            ...receiverData,
            email: `${Date.now()}-receiver-${receiverData.email}`
          }
          
          // Create sender and receiver users
          const sender = await apiService.createUser(uniqueSenderData)
          const receiver = await apiService.createUser(uniqueReceiverData)

          // Login as sender
          const { login } = useAuth()
          await login(uniqueSenderData.email, uniqueSenderData.password)

          // Send a message
          const { sendMessage } = useMessages()
          await sendMessage(receiver.id, messageContent)

          // Fetch messages to verify the created message
          const messages = await apiService.getMessages()
          
          // Find the message we just created
          const createdMessage = messages.find(
            m => m.senderId === sender.id && m.receiverId === receiver.id && m.content === messageContent.trim()
          )
          
          expect(createdMessage).toBeDefined()
          expect(createdMessage).not.toBeNull()

          if (!createdMessage) {
            throw new Error('Message was not created')
          }

          // Verify message has unique identifier
          expect(createdMessage.id).toBeDefined()
          expect(createdMessage.id).not.toBe('')
          expect(typeof createdMessage.id).toBe('string')

          // Verify message has senderId
          expect(createdMessage.senderId).toBeDefined()
          expect(createdMessage.senderId).toBe(sender.id)

          // Verify message has receiverId
          expect(createdMessage.receiverId).toBeDefined()
          expect(createdMessage.receiverId).toBe(receiver.id)

          // Verify message has content
          expect(createdMessage.content).toBeDefined()
          expect(createdMessage.content).toBe(messageContent.trim())

          // Verify message has current timestamp
          expect(createdMessage.createdAt).toBeDefined()
          expect(typeof createdMessage.createdAt).toBe('string')
          const createdTime = new Date(createdMessage.createdAt).getTime()
          const now = Date.now()
          // Timestamp should be within last 5 seconds
          expect(now - createdTime).toBeLessThan(5000)
          expect(now - createdTime).toBeGreaterThanOrEqual(0)

          // Clean up
          await apiService['axiosInstance'].delete(`/messages/${createdMessage.id}`)
          await apiService['axiosInstance'].delete(`/users/${sender.id}`)
          await apiService['axiosInstance'].delete(`/users/${receiver.id}`)
        }
      ),
      { numRuns: 100, timeout: 30000 }
    )
  }, 40000)

  // Feature: blog-management, Property 30: Message display in conversation
  it('Property 30: Message display in conversation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.string({ minLength: 1, maxLength: 500 }).filter((s: string) => s.trim().length > 0),
        async (senderData, receiverData, messageContent) => {
          // Make emails unique by adding timestamp
          const uniqueSenderData = {
            ...senderData,
            email: `${Date.now()}-sender-${senderData.email}`
          }
          const uniqueReceiverData = {
            ...receiverData,
            email: `${Date.now()}-receiver-${receiverData.email}`
          }
          
          // Create sender and receiver users
          const sender = await apiService.createUser(uniqueSenderData)
          const receiver = await apiService.createUser(uniqueReceiverData)

          // Login as sender
          const { login } = useAuth()
          await login(uniqueSenderData.email, uniqueSenderData.password)

          // Get a fresh instance of useMessages
          const { sendMessage, fetchConversationWith, currentConversation } = useMessages()
          
          // Send a message
          await sendMessage(receiver.id, messageContent)

          // Fetch the conversation to verify the message appears
          await fetchConversationWith(receiver.id)

          // Verify the message appears in the conversation view
          const conversationMessages = currentConversation.value
          expect(conversationMessages.length).toBeGreaterThan(0)

          // Find the message we just sent
          const displayedMessage = conversationMessages.find(
            m => m.senderId === sender.id && m.receiverId === receiver.id && m.content === messageContent.trim()
          )

          expect(displayedMessage).toBeDefined()
          expect(displayedMessage).not.toBeNull()

          if (!displayedMessage) {
            throw new Error('Message does not appear in conversation view')
          }

          // Verify the message has correct sender information
          expect(displayedMessage.senderId).toBe(sender.id)
          expect(displayedMessage.receiverId).toBe(receiver.id)
          expect(displayedMessage.content).toBe(messageContent.trim())

          // Clean up
          const messages = await apiService.getMessages()
          const createdMessage = messages.find(
            m => m.senderId === sender.id && m.receiverId === receiver.id && m.content === messageContent.trim()
          )
          if (createdMessage) {
            await apiService['axiosInstance'].delete(`/messages/${createdMessage.id}`)
          }
          await apiService['axiosInstance'].delete(`/users/${sender.id}`)
          await apiService['axiosInstance'].delete(`/users/${receiver.id}`)
        }
      ),
      { numRuns: 100, timeout: 60000 }
    )
  }, 120000)

  // Feature: blog-management, Property 31: Messages sorted by timestamp ascending
  it('Property 31: Messages sorted by timestamp ascending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.array(
          fc.string({ minLength: 1, maxLength: 500 }).filter((s: string) => s.trim().length > 0),
          { minLength: 2, maxLength: 5 }
        ),
        async (senderData, receiverData, messageContents) => {
          // Make emails unique by adding timestamp
          const uniqueSenderData = {
            ...senderData,
            email: `${Date.now()}-sender-${senderData.email}`
          }
          const uniqueReceiverData = {
            ...receiverData,
            email: `${Date.now()}-receiver-${receiverData.email}`
          }
          
          // Create sender and receiver users
          const sender = await apiService.createUser(uniqueSenderData)
          const receiver = await apiService.createUser(uniqueReceiverData)

          // Login as sender
          const { login } = useAuth()
          await login(uniqueSenderData.email, uniqueSenderData.password)

          // Create multiple messages directly via API with small delays to ensure different timestamps
          const createdMessageIds: string[] = []
          for (const content of messageContents) {
            const message = await apiService.createMessage({
              senderId: sender.id,
              receiverId: receiver.id,
              content: content.trim()
            })
            createdMessageIds.push(message.id)
            // Small delay to ensure timestamps are different
            await new Promise(resolve => setTimeout(resolve, 50))
          }

          // Get a fresh instance of useMessages and fetch the conversation
          const { fetchConversationWith, currentConversation } = useMessages()
          await fetchConversationWith(receiver.id)

          // Verify we have the expected number of messages
          const conversationMessages = currentConversation.value
          expect(conversationMessages.length).toBe(messageContents.length)

          // Verify messages are sorted by timestamp ascending (oldest first)
          for (let i = 0; i < conversationMessages.length - 1; i++) {
            const currentMessage = conversationMessages[i]
            const nextMessage = conversationMessages[i + 1]
            
            expect(currentMessage).toBeDefined()
            expect(nextMessage).toBeDefined()
            
            if (currentMessage && nextMessage) {
              const currentMessageTime = new Date(currentMessage.createdAt).getTime()
              const nextMessageTime = new Date(nextMessage.createdAt).getTime()
              
              // Current message should be older than or equal to the next message
              expect(currentMessageTime).toBeLessThanOrEqual(nextMessageTime)
            }
          }

          // Verify the first message is the oldest (first sent)
          const firstMessage = conversationMessages[0]
          expect(firstMessage).toBeDefined()
          if (firstMessage) {
            expect(firstMessage.content).toBe(messageContents[0]!.trim())
          }
          
          // Verify the last message is the newest (last sent)
          const lastMessage = conversationMessages[conversationMessages.length - 1]
          expect(lastMessage).toBeDefined()
          if (lastMessage) {
            expect(lastMessage.content).toBe(messageContents[messageContents.length - 1]!.trim())
          }

          // Clean up
          await Promise.all(
            createdMessageIds.map(id => apiService['axiosInstance'].delete(`/messages/${id}`))
          )
          await apiService['axiosInstance'].delete(`/users/${sender.id}`)
          await apiService['axiosInstance'].delete(`/users/${receiver.id}`)
        }
      ),
      { numRuns: 20, timeout: 120000 }
    )
  }, 180000)

  // Feature: blog-management, Property 32: Conversations sorted by most recent message
  it('Property 32: Conversations sorted by most recent message', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
          }),
          { minLength: 2, maxLength: 4 }
        ),
        async (currentUserData, otherUsersData) => {
          // Make emails unique by adding timestamp
          const uniqueCurrentUserData = {
            ...currentUserData,
            email: `${Date.now()}-current-${currentUserData.email}`
          }
          
          // Create current user
          const currentUser = await apiService.createUser(uniqueCurrentUserData)

          // Create other users
          const otherUsers = []
          for (let i = 0; i < otherUsersData.length; i++) {
            const uniqueUserData = {
              ...otherUsersData[i]!,
              email: `${Date.now()}-user${i}-${otherUsersData[i]!.email}`
            }
            const user = await apiService.createUser(uniqueUserData)
            otherUsers.push(user)
            // Small delay to ensure unique timestamps
            await new Promise(resolve => setTimeout(resolve, 10))
          }

          // Login as current user
          const { login } = useAuth()
          await login(uniqueCurrentUserData.email, uniqueCurrentUserData.password)

          // Create messages with each user at different times
          // We'll send messages in a specific order and track which conversation should be most recent
          const messageIds: string[] = []
          const conversationOrder: string[] = []

          // Send messages to each user with delays to ensure different timestamps
          for (let i = 0; i < otherUsers.length; i++) {
            const otherUser = otherUsers[i]!
            const message = await apiService.createMessage({
              senderId: currentUser.id,
              receiverId: otherUser.id,
              content: `Message to user ${i}`
            })
            messageIds.push(message.id)
            conversationOrder.push(otherUser.id)
            // Delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 100))
          }

          // Now send one more message to the first user to make that conversation most recent
          const firstUser = otherUsers[0]!
          const latestMessage = await apiService.createMessage({
            senderId: currentUser.id,
            receiverId: firstUser.id,
            content: 'Latest message to first user'
          })
          messageIds.push(latestMessage.id)

          // Wait a bit to ensure all messages are persisted
          await new Promise(resolve => setTimeout(resolve, 200))

          // Fetch conversations
          const { fetchConversations, conversations } = useMessages()
          await fetchConversations()

          // Verify we have the expected number of conversations
          expect(conversations.value.length).toBe(otherUsers.length)

          // Verify conversations are sorted by most recent message (descending)
          for (let i = 0; i < conversations.value.length - 1; i++) {
            const currentConv = conversations.value[i]
            const nextConv = conversations.value[i + 1]
            
            expect(currentConv).toBeDefined()
            expect(nextConv).toBeDefined()
            
            if (currentConv && nextConv) {
              const currentTime = new Date(currentConv.lastMessageTime).getTime()
              const nextTime = new Date(nextConv.lastMessageTime).getTime()
              
              // Current conversation should have a more recent message than the next
              expect(currentTime).toBeGreaterThanOrEqual(nextTime)
            }
          }

          // Verify the first conversation is with the first user (most recent message)
          const firstConversation = conversations.value[0]
          expect(firstConversation).toBeDefined()
          if (firstConversation) {
            expect(firstConversation.userId).toBe(firstUser.id)
            expect(firstConversation.lastMessage).toBe('Latest message to first user')
          }

          // Clean up
          await Promise.all(
            messageIds.map(id => apiService['axiosInstance'].delete(`/messages/${id}`))
          )
          await apiService['axiosInstance'].delete(`/users/${currentUser.id}`)
          await Promise.all(
            otherUsers.map(user => apiService['axiosInstance'].delete(`/users/${user.id}`))
          )
        }
      ),
      { numRuns: 100, timeout: 120000 }
    )
  }, 180000)
})
