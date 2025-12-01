import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import AppNavbar from '../AppNavbar.vue'
import { useAuth } from '../../composables/useAuth'
import { createRouter, createMemoryHistory } from 'vue-router'

// Create a simple router for testing
const createTestRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
      { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
      { path: '/register', name: 'Register', component: { template: '<div>Register</div>' } },
      { path: '/posts/create', name: 'CreatePost', component: { template: '<div>Create Post</div>' } },
      { path: '/profile', name: 'MyProfile', component: { template: '<div>Profile</div>' } }
    ]
  })
}

describe('AppNavbar Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  // Feature: blog-management, Property 41: Authenticated navigation includes additional links
  it('Property 41: Authenticated navigation includes additional links', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        async (userData) => {
          // Test 1: Guest navigation (unauthenticated)
          localStorage.clear()
          
          // Ensure auth state is cleared
          const { logout: clearAuth1 } = useAuth()
          clearAuth1()
          
          const router1 = createTestRouter()
          await router1.push('/')
          await router1.isReady()
          
          const guestWrapper = mount(AppNavbar, {
            global: {
              plugins: [router1]
            }
          })

          // Wait for component to render
          await guestWrapper.vm.$nextTick()

          // Guest should see: Home, Login, Register
          const guestLinks = guestWrapper.findAll('.nav-link')
          const guestLinkTexts = guestLinks.map((link: any) => link.text().trim())
          
          expect(guestLinkTexts).toContain('Home')
          expect(guestLinkTexts).toContain('Login')
          expect(guestLinkTexts).toContain('Register')
          
          // Guest should NOT see: Create Post, Profile, Logout
          expect(guestLinkTexts).not.toContain('Create Post')
          expect(guestLinkTexts).not.toContain('Profile')
          expect(guestLinkTexts).not.toContain('Logout')

          // Count of guest links should be 3
          const guestNavLinksCount = guestLinks.length
          expect(guestNavLinksCount).toBe(3)

          guestWrapper.unmount()

          // Test 2: Authenticated navigation
          // Clear and set up authentication
          localStorage.clear()
          localStorage.setItem('authToken', 'user123')
          localStorage.setItem('authUser', JSON.stringify({
            id: 'user123',
            name: userData.name,
            email: userData.email,
            password: userData.password,
            avatar: 'https://via.placeholder.com/150',
            intro: 'Hello!'
          }))

          // Initialize auth state from localStorage
          const { checkAuth } = useAuth()
          checkAuth()

          // Create a new router instance for authenticated test
          const router2 = createTestRouter()
          await router2.push('/')
          await router2.isReady()

          const authWrapper = mount(AppNavbar, {
            global: {
              plugins: [router2]
            }
          })

          // Wait for component to render
          await authWrapper.vm.$nextTick()

          // Authenticated user should see: Home, Create Post, Profile, Logout
          const authLinks = authWrapper.findAll('.nav-link')
          const authLinkTexts = authLinks.map((link: any) => link.text().trim())
          
          expect(authLinkTexts).toContain('Home')
          expect(authLinkTexts).toContain('Create Post')
          expect(authLinkTexts).toContain('Profile')
          expect(authLinkTexts).toContain('Logout')
          
          // Authenticated user should NOT see: Login, Register
          expect(authLinkTexts).not.toContain('Login')
          expect(authLinkTexts).not.toContain('Register')

          // Count of authenticated links should be 4
          const authNavLinksCount = authLinks.length
          expect(authNavLinksCount).toBe(4)

          // Verify that authenticated navigation has MORE links than guest navigation
          expect(authNavLinksCount).toBeGreaterThan(guestNavLinksCount)

          // Verify the additional links are the expected ones
          const additionalLinks = authLinkTexts.filter((text: string) => !guestLinkTexts.includes(text))
          expect(additionalLinks).toContain('Create Post')
          expect(additionalLinks).toContain('Profile')
          expect(additionalLinks).toContain('Logout')
          expect(additionalLinks.length).toBe(3) // 3 additional links

          authWrapper.unmount()
          localStorage.clear()
        }
      ),
      { numRuns: 100 }
    )
  })
})
