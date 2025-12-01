import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import router from '../index'

describe('Router Navigation Guards', () => {
  beforeEach(async () => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset router to initial state
    await router.push('/')
    await router.isReady()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users from home to login', async () => {
      // Ensure user is not authenticated
      localStorage.removeItem('authToken')

      // Try to navigate to home (protected route)
      await router.push('/')
      await router.isReady()

      // Should be redirected to login
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should redirect unauthenticated users from profile to login', async () => {
      localStorage.removeItem('authToken')

      await router.push('/profile')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should redirect unauthenticated users from create post to login', async () => {
      localStorage.removeItem('authToken')

      await router.push('/posts/create')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should redirect unauthenticated users from edit post to login', async () => {
      localStorage.removeItem('authToken')

      await router.push('/posts/123/edit')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should redirect unauthenticated users from messages to login', async () => {
      localStorage.removeItem('authToken')

      await router.push('/messages/456')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should allow authenticated users to access protected routes', async () => {
      // Set authentication token
      localStorage.setItem('authToken', 'user123')

      await router.push('/profile')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/profile')
    })
  })

  describe('Guest-Only Routes', () => {
    it('should redirect authenticated users from login to home', async () => {
      // Set authentication token
      localStorage.setItem('authToken', 'user123')

      await router.push('/login')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('should redirect authenticated users from register to home', async () => {
      localStorage.setItem('authToken', 'user123')

      await router.push('/register')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('should allow unauthenticated users to access login', async () => {
      localStorage.removeItem('authToken')

      await router.push('/login')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should allow unauthenticated users to access register', async () => {
      localStorage.removeItem('authToken')

      await router.push('/register')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/register')
    })
  })

  describe('Public Routes', () => {
    it('should allow unauthenticated users to access user profile pages', async () => {
      localStorage.removeItem('authToken')

      await router.push('/profile/user123')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/profile/user123')
    })

    it('should allow authenticated users to access user profile pages', async () => {
      localStorage.setItem('authToken', 'user456')

      await router.push('/profile/user123')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/profile/user123')
    })
  })
})
