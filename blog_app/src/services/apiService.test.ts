import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import fc from 'fast-check'
import { apiService } from './apiService'
import type { CreateUserData } from '../types'

describe('API Service Property Tests', () => {
  beforeAll(async () => {
    // Wait a bit for JSON server to be ready if running separately
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  beforeEach(async () => {
    // Clear users before each test
    const users = await apiService.getUsers()
    for (const user of users) {
      // We need to manually delete via axios since apiService doesn't have deleteUser
      await apiService['axiosInstance'].delete(`/users/${user.id}`)
    }
  })

  // Feature: blog-management, Property 1: Valid registration creates unique user
  it('Property 1: Valid registration creates unique user', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        async (userData: CreateUserData) => {
          // Create user
          const createdUser = await apiService.createUser(userData)

          // Verify user has unique identifier
          expect(createdUser.id).toBeDefined()
          expect(createdUser.id).not.toBe('')
          expect(typeof createdUser.id).toBe('string')

          // Verify user data matches input
          expect(createdUser.name).toBe(userData.name)
          expect(createdUser.email).toBe(userData.email)
          expect(createdUser.password).toBe(userData.password)

          // Verify default fields are set
          expect(createdUser.avatar).toBeDefined()
          expect(createdUser.intro).toBeDefined()

          // Verify user is persisted in the system
          const fetchedUser = await apiService.getUserById(createdUser.id)
          expect(fetchedUser.id).toBe(createdUser.id)
          expect(fetchedUser.name).toBe(userData.name)
          expect(fetchedUser.email).toBe(userData.email)

          // Verify uniqueness: create another user and check IDs are different
          const secondUser = await apiService.createUser({
            name: 'Different User',
            email: 'different@example.com',
            password: 'password123'
          })
          expect(secondUser.id).not.toBe(createdUser.id)

          // Clean up
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
          await apiService['axiosInstance'].delete(`/users/${secondUser.id}`)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: blog-management, Property 2: Empty field validation prevents submission
  it('Property 2: Empty field validation prevents submission', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Empty string
          fc.constant(''),
          // Whitespace-only strings
          fc.string().filter((s: string) => s.trim().length === 0 && s.length > 0),
          // Strings with only spaces
          fc.integer({ min: 1, max: 20 }).map(n => ' '.repeat(n)),
          // Strings with tabs and newlines
          fc.oneof(fc.constant('\t'), fc.constant('\n'), fc.constant('\r'), fc.constant('   \t\n  '))
        ),
        async (emptyValue: string) => {
          // Test with empty name
          const userDataWithEmptyName = {
            name: emptyValue,
            email: 'test@example.com',
            password: 'password123'
          }

          // Validation should prevent submission
          const { validateFormData } = await import('../utils/validation')
          const nameErrors = validateFormData(userDataWithEmptyName, ['name', 'email', 'password'])
          expect(Object.keys(nameErrors).length).toBeGreaterThan(0)
          expect(nameErrors.name).toBeDefined()

          // Test with empty email
          const userDataWithEmptyEmail = {
            name: 'John Doe',
            email: emptyValue,
            password: 'password123'
          }

          const emailErrors = validateFormData(userDataWithEmptyEmail, ['name', 'email', 'password'])
          expect(Object.keys(emailErrors).length).toBeGreaterThan(0)
          expect(emailErrors.email).toBeDefined()

          // Test with empty password
          const userDataWithEmptyPassword = {
            name: 'John Doe',
            email: 'test@example.com',
            password: emptyValue
          }

          const passwordErrors = validateFormData(userDataWithEmptyPassword, ['name', 'email', 'password'])
          expect(Object.keys(passwordErrors).length).toBeGreaterThan(0)
          expect(passwordErrors.password).toBeDefined()

          // Test post data with empty title
          const postDataWithEmptyTitle = {
            title: emptyValue,
            content: 'Some content'
          }

          const titleErrors = validateFormData(postDataWithEmptyTitle, ['title', 'content'])
          expect(Object.keys(titleErrors).length).toBeGreaterThan(0)
          expect(titleErrors.title).toBeDefined()

          // Test post data with empty content
          const postDataWithEmptyContent = {
            title: 'Some title',
            content: emptyValue
          }

          const contentErrors = validateFormData(postDataWithEmptyContent, ['title', 'content'])
          expect(Object.keys(contentErrors).length).toBeGreaterThan(0)
          expect(contentErrors.content).toBeDefined()

          // Test comment data with empty content
          const commentDataWithEmptyContent = {
            content: emptyValue,
            postId: '123'
          }

          const commentErrors = validateFormData(commentDataWithEmptyContent, ['content'])
          expect(Object.keys(commentErrors).length).toBeGreaterThan(0)
          expect(commentErrors.content).toBeDefined()

          // Test message data with empty content
          const messageDataWithEmptyContent = {
            content: emptyValue,
            senderId: '123',
            receiverId: '456'
          }

          const messageErrors = validateFormData(messageDataWithEmptyContent, ['content'])
          expect(Object.keys(messageErrors).length).toBeGreaterThan(0)
          expect(messageErrors.content).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: blog-management, Property 3: New users have default fields
  it('Property 3: New users have default fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        async (userData: CreateUserData) => {
          // Create user without providing avatar or intro
          const createdUser = await apiService.createUser(userData)

          // Verify default avatar field is set
          expect(createdUser.avatar).toBeDefined()
          expect(createdUser.avatar).not.toBe('')
          expect(typeof createdUser.avatar).toBe('string')

          // Verify default intro field is set
          expect(createdUser.intro).toBeDefined()
          expect(typeof createdUser.intro).toBe('string')

          // Verify the user is persisted with default fields
          const fetchedUser = await apiService.getUserById(createdUser.id)
          expect(fetchedUser.avatar).toBeDefined()
          expect(fetchedUser.avatar).not.toBe('')
          expect(fetchedUser.intro).toBeDefined()

          // Clean up
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: blog-management, Property 4: Valid login creates authentication token
  it('Property 4: Valid login creates authentication token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        async (userData: CreateUserData) => {
          // Create a user first
          const createdUser = await apiService.createUser(userData)

          // Clear localStorage before login
          localStorage.clear()

          // Import useAuth and perform login
          const { useAuth } = await import('../composables/useAuth')
          const { login, currentUser, isAuthenticated } = useAuth()

          // Perform login with valid credentials
          await login(userData.email, userData.password)

          // Verify authentication token is created and stored in localStorage
          const authToken = localStorage.getItem('authToken')
          expect(authToken).toBeDefined()
          expect(authToken).not.toBe('')
          expect(authToken).toBe(createdUser.id)

          // Verify user data is stored in localStorage
          const authUserJson = localStorage.getItem('authUser')
          expect(authUserJson).toBeDefined()
          expect(authUserJson).not.toBe('')

          const authUser = JSON.parse(authUserJson!)
          expect(authUser.id).toBe(createdUser.id)
          expect(authUser.email).toBe(userData.email)
          expect(authUser.name).toBe(userData.name)

          // Verify reactive state is updated
          expect(currentUser.value).not.toBeNull()
          expect(currentUser.value?.id).toBe(createdUser.id)
          expect(currentUser.value?.email).toBe(userData.email)
          expect(isAuthenticated.value).toBe(true)

          // Clean up
          localStorage.clear()
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100 }
    )
  })
})
