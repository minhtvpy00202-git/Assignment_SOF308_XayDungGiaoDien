import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import router from '../index'

describe('Router Navigation Guards - Property-Based Tests', () => {
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

  // Feature: blog-management, Property 42: Protected routes redirect unauthenticated users
  it('should redirect unauthenticated users from any protected route to login', async () => {
    // Get all protected routes (routes with requiresAuth: true)
    const routes = router.getRoutes()
    const protectedRoutes = routes.filter(route => route.meta.requiresAuth === true)

    // Create an arbitrary that generates protected route paths
    const protectedRouteArbitrary = fc.constantFrom(
      ...protectedRoutes.map(route => {
        // Handle routes with parameters by replacing them with test values
        let path = route.path
        if (path.includes(':userId')) {
          path = path.replace(':userId', 'test-user-123')
        }
        if (path.includes(':id')) {
          path = path.replace(':id', 'test-post-456')
        }
        return path
      })
    )

    await fc.assert(
      fc.asyncProperty(protectedRouteArbitrary, async (protectedPath) => {
        // Ensure user is not authenticated
        localStorage.removeItem('authToken')

        // Try to navigate to the protected route
        await router.push(protectedPath)
        await router.isReady()

        // Property: Should always be redirected to login
        expect(router.currentRoute.value.path).toBe('/login')
      }),
      { numRuns: 100 }
    )
  })

  // Feature: blog-management, Property 43: Guest-only routes redirect authenticated users
  it('should redirect authenticated users from any guest-only route to home', async () => {
    // Get all guest-only routes (routes with guestOnly: true)
    const routes = router.getRoutes()
    const guestOnlyRoutes = routes.filter(route => route.meta.guestOnly === true)

    // Create an arbitrary that generates guest-only route paths
    const guestOnlyRouteArbitrary = fc.constantFrom(
      ...guestOnlyRoutes.map(route => route.path)
    )

    // Generate arbitrary authentication tokens
    const authTokenArbitrary = fc.string({ minLength: 1, maxLength: 50 })

    await fc.assert(
      fc.asyncProperty(guestOnlyRouteArbitrary, authTokenArbitrary, async (guestOnlyPath, authToken) => {
        // Clear any previous state
        localStorage.clear()
        
        // Set authentication token to simulate authenticated user
        localStorage.setItem('authToken', authToken)

        // Try to navigate to the guest-only route
        await router.push(guestOnlyPath)
        await router.isReady()

        // Property: Should always be redirected to home page
        expect(router.currentRoute.value.path).toBe('/')
        
        // Clean up after this iteration
        localStorage.clear()
      }),
      { numRuns: 100 }
    )
  })
})
