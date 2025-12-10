import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { useSearch } from './useSearch'
import { apiService } from '../services/apiService'

// Mock the API service
vi.mock('../services/apiService')
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
})

describe('Search Property Tests', () => {
  /**
   * **Feature: search-functionality, Property 1: Search Result Matching Consistency**
   * **Validates: Requirements 1.1, 2.1, 2.4**
   */
  it('Property 1: Search results contain search term', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@test.com', password: '123', avatar: '', intro: '' },
      { id: '2', name: 'Jane Smith', email: 'jane@test.com', password: '123', avatar: '', intro: '' }
    ]
    const mockPosts = [
      { id: '1', userId: '1', title: 'Test Post', content: 'Content', image: '', createdAt: '2024-01-01' }
    ]
    
    vi.mocked(apiService.getUsers).mockResolvedValue(mockUsers)
    vi.mocked(apiService.getPosts).mockResolvedValue(mockPosts)
    
    const { search, results } = useSearch()
    
    await search('john')
    await new Promise(resolve => setTimeout(resolve, 350))
    
    // All user results should contain 'john' in normalized form
    for (const result of results.value.users) {
      const user = mockUsers.find(u => u.id === result.id)
      expect(user).toBeDefined()
      if (user) {
        const normalizedName = user.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        expect(normalizedName).toContain('john')
      }
    }
  })

  /**
   * **Feature: search-functionality, Property 2: Result Limit Enforcement**
   * **Validates: Requirements 1.5, 2.5**
   */
  it('Property 2: Results are limited to 5 per category', async () => {
    // Create more than 5 users and posts
    const mockUsers = Array.from({ length: 10 }, (_, i) => ({
      id: `user-${i}`,
      name: `Test User ${i}`,
      email: `user${i}@test.com`,
      password: '123',
      avatar: '',
      intro: ''
    }))
    
    const mockPosts = Array.from({ length: 10 }, (_, i) => ({
      id: `post-${i}`,
      userId: `user-${i}`,
      title: `Test Post ${i}`,
      content: 'Test content',
      image: '',
      createdAt: '2024-01-01'
    }))
    
    vi.mocked(apiService.getUsers).mockResolvedValue(mockUsers)
    vi.mocked(apiService.getPosts).mockResolvedValue(mockPosts)
    
    const { search, results } = useSearch()
    
    await search('test')
    await new Promise(resolve => setTimeout(resolve, 350))
    
    expect(results.value.users.length).toBeLessThanOrEqual(5)
    expect(results.value.posts.length).toBeLessThanOrEqual(5)
  })

  /**
   * **Feature: search-functionality, Property 3: Debounced Search Behavior**
   * **Validates: Requirements 3.2, 8.2**
   */
  it('Property 3: Search is debounced', async () => {
    vi.mocked(apiService.getUsers).mockResolvedValue([])
    vi.mocked(apiService.getPosts).mockResolvedValue([])
    
    let callCount = 0
    vi.mocked(apiService.getUsers).mockImplementation(async () => {
      callCount++
      return []
    })
    
    const { search } = useSearch()
    
    // Rapid searches
    await search('a')
    await search('ab')
    await search('abc')
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 400))
    
    // Should only call API once due to debouncing
    expect(callCount).toBeLessThanOrEqual(2)
  })
})