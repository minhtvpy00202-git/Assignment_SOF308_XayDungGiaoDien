import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import router from '../index'

describe('Vue Router Configuration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear()
  })

  it('should have all required routes configured', () => {
    const routes = router.getRoutes()
    const routeNames = routes.map(r => r.name)

    expect(routeNames).toContain('Home')
    expect(routeNames).toContain('Login')
    expect(routeNames).toContain('Register')
    expect(routeNames).toContain('UserProfile')
    expect(routeNames).toContain('MyProfile')
    expect(routeNames).toContain('CreatePost')
    expect(routeNames).toContain('EditPost')
    expect(routeNames).toContain('Messages')
  })

  it('should configure protected routes with requiresAuth meta', () => {
    const routes = router.getRoutes()
    
    const homeRoute = routes.find(r => r.name === 'Home')
    const myProfileRoute = routes.find(r => r.name === 'MyProfile')
    const createPostRoute = routes.find(r => r.name === 'CreatePost')
    const editPostRoute = routes.find(r => r.name === 'EditPost')
    const messagesRoute = routes.find(r => r.name === 'Messages')

    expect(homeRoute?.meta.requiresAuth).toBe(true)
    expect(myProfileRoute?.meta.requiresAuth).toBe(true)
    expect(createPostRoute?.meta.requiresAuth).toBe(true)
    expect(editPostRoute?.meta.requiresAuth).toBe(true)
    expect(messagesRoute?.meta.requiresAuth).toBe(true)
  })

  it('should configure guest-only routes with guestOnly meta', () => {
    const routes = router.getRoutes()
    
    const loginRoute = routes.find(r => r.name === 'Login')
    const registerRoute = routes.find(r => r.name === 'Register')

    expect(loginRoute?.meta.guestOnly).toBe(true)
    expect(registerRoute?.meta.guestOnly).toBe(true)
  })

  it('should configure UserProfile route without authentication requirement', () => {
    const routes = router.getRoutes()
    const userProfileRoute = routes.find(r => r.name === 'UserProfile')

    expect(userProfileRoute?.meta.requiresAuth).toBe(false)
  })

  it('should have correct route paths', () => {
    const routes = router.getRoutes()

    expect(routes.find(r => r.name === 'Home')?.path).toBe('/')
    expect(routes.find(r => r.name === 'Login')?.path).toBe('/login')
    expect(routes.find(r => r.name === 'Register')?.path).toBe('/register')
    expect(routes.find(r => r.name === 'UserProfile')?.path).toBe('/profile/:userId')
    expect(routes.find(r => r.name === 'MyProfile')?.path).toBe('/profile')
    expect(routes.find(r => r.name === 'CreatePost')?.path).toBe('/posts/create')
    expect(routes.find(r => r.name === 'EditPost')?.path).toBe('/posts/:id/edit')
    expect(routes.find(r => r.name === 'Messages')?.path).toBe('/messages/:userId')
  })
})
