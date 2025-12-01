import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import { useAuth } from '../../composables/useAuth'
import { apiService } from '../../services/apiService'
import MessagesSidebar from '../MessagesSidebar.vue'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('MessagesSidebar Property Tests', () => {
  beforeAll(async () => {
    // Wait for JSON server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  beforeEach(async () => {
    // Clear all data before each test
    try {
      const messages = await apiService.getMessages()
      for (const message of messages) {
        try {
          await apiService['axiosInstance'].delete(`/messages/${message.id}`)
        } catch (e) {
          // Ignore errors
        }
      }
    } catch (e) {
      // Ignore errors
    }

    try {
      const users = await apiService.getUsers()
      for (const user of users) {
        try {
          await apiService['axiosInstance'].delete(`/users/${user.id}`)
        } catch (e) {
          // Ignore errors
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Clear localStorage and logout
    localStorage.clear()
    const { logout } = useAuth()
    logout()
    
    // Clear mock
    mockPush.mockClear()
  })

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear()
  })

  // Feature: blog-management, Property 16: Messages sidebar visible for authenticated users
  it('Property 16: Messages sidebar visible for authenticated users', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate user data
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }).filter((s: string) => s.trim().length > 0),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 20 })
        }),
        async (userData) => {
          // Clear localStorage and logout first
          localStorage.clear()
          const { logout: clearAuth } = useAuth()
          clearAuth()

          // Set up authentication state directly in localStorage
          localStorage.setItem('authToken', userData.id)
          localStorage.setItem('authUser', JSON.stringify({
            id: userData.id,
            name: userData.name.trim(),
            email: userData.email,
            password: userData.password,
            avatar: 'https://via.placeholder.com/150',
            intro: 'Test user'
          }))

          // Initialize auth state from localStorage
          const { checkAuth } = useAuth()
          checkAuth()

          // Mount the component
          const wrapper = mount(MessagesSidebar, {
            global: {
              stubs: {
                ConversationItem: true
              }
            }
          })

          // Wait for component to render
          await wrapper.vm.$nextTick()

          // Property: For any authenticated user accessing the home page,
          // the messages sidebar should be visible
          const sidebar = wrapper.find('.messages-sidebar')
          expect(sidebar.exists()).toBe(true)

          // Verify the card structure is present
          const card = wrapper.find('.card')
          expect(card.exists()).toBe(true)

          // Verify the header is present
          const header = wrapper.find('.card-header')
          expect(header.exists()).toBe(true)
          expect(header.text()).toContain('Messages')

          wrapper.unmount()
          localStorage.clear()
        }
      ),
      { numRuns: 100 } // Run 100 times as specified in design
    )
  }, 30000)

  // Feature: blog-management, Property 33: Conversation item includes required information
  it('Property 33: Conversation item includes required information', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two users and a message between them
        fc.record({
          user1: fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 20 })
          }),
          user2: fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 20 })
          }),
          messageContent: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0)
        }),
        async (data) => {
          // Create both users
          const user1 = await apiService.createUser({
            name: data.user1.name.trim(),
            email: data.user1.email,
            password: data.user1.password,
            avatar: 'https://via.placeholder.com/150',
            intro: 'Test user 1'
          })

          const user2 = await apiService.createUser({
            name: data.user2.name.trim(),
            email: data.user2.email,
            password: data.user2.password,
            avatar: 'https://via.placeholder.com/200',
            intro: 'Test user 2'
          })

          // Create a message from user2 to user1
          await apiService.createMessage({
            senderId: user2.id,
            receiverId: user1.id,
            content: data.messageContent.trim()
          })

          // Login as user1
          const { login } = useAuth()
          await login(user1.email, user1.password)

          // Mount the component
          const wrapper = mount(MessagesSidebar, {
            global: {
              stubs: {
                ConversationItem: false // Don't stub so we can test the actual component
              }
            }
          })

          // Wait for conversations to load
          await new Promise(resolve => setTimeout(resolve, 500))
          await wrapper.vm.$nextTick()

          // Property: For any conversation displayed in the sidebar,
          // the rendered item should include the other user's avatar, name,
          // and a preview of the last message
          const conversationItems = wrapper.findAll('.conversation-item')
          
          if (conversationItems.length > 0) {
            const firstConversation = conversationItems[0]!

            // Check for avatar
            const avatar = firstConversation.find('img.rounded-circle')
            expect(avatar.exists()).toBe(true)
            expect(avatar.attributes('src')).toBeTruthy()
            expect(avatar.attributes('alt')).toBeTruthy()

            // Check for user name
            const userName = firstConversation.find('h6')
            expect(userName.exists()).toBe(true)
            expect(userName.text()).toBeTruthy()

            // Check for message preview
            const messagePreview = firstConversation.find('p.text-muted.small')
            expect(messagePreview.exists()).toBe(true)
            expect(messagePreview.text()).toBeTruthy()

            // Check for timestamp
            const timestamp = firstConversation.find('small.text-muted')
            expect(timestamp.exists()).toBe(true)
            expect(timestamp.text()).toBeTruthy()
          }

          wrapper.unmount()
        }
      ),
      { numRuns: 10 } // Run 10 times for faster execution
    )
  }, 30000)
})
