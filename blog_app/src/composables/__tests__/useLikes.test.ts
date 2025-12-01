import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLikes } from '../useLikes'
import { useAuth } from '../useAuth'
import { apiService } from '../../services/apiService'
import type { Like } from '../../types'

// Mock the dependencies
vi.mock('../useAuth')
vi.mock('../../services/apiService')

describe('useLikes', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password',
    avatar: 'https://example.com/avatar.jpg',
    intro: 'Test intro'
  }

  const mockLikes: Like[] = [
    {
      id: 'like-1',
      postId: 'post-1',
      userId: 'user-1',
      createdAt: '2024-01-01T10:00:00.000Z'
    },
    {
      id: 'like-2',
      postId: 'post-1',
      userId: 'user-2',
      createdAt: '2024-01-01T11:00:00.000Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      currentUser: { value: mockUser } as any,
      isAuthenticated: { value: true } as any,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn()
    })
  })

  describe('fetchLikesByPostId', () => {
    it('should fetch likes for a post', async () => {
      vi.mocked(apiService.getLikesByPostId).mockResolvedValue([...mockLikes])

      const { fetchLikesByPostId } = useLikes()
      const likes = await fetchLikesByPostId('post-1')

      expect(apiService.getLikesByPostId).toHaveBeenCalledWith('post-1')
      expect(likes).toHaveLength(2)
      expect(likes).toEqual(mockLikes)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(apiService.getLikesByPostId).mockRejectedValue(new Error('Network error'))

      const { fetchLikesByPostId } = useLikes()
      const likes = await fetchLikesByPostId('post-1')

      expect(likes).toEqual([])
    })
  })

  describe('getLikeCount', () => {
    it('should return the correct like count', async () => {
      vi.mocked(apiService.getLikesByPostId).mockResolvedValue([...mockLikes])

      const { getLikeCount } = useLikes()
      const count = await getLikeCount('post-1')

      expect(count).toBe(2)
    })

    it('should return 0 when no likes exist', async () => {
      vi.mocked(apiService.getLikesByPostId).mockResolvedValue([])

      const { getLikeCount } = useLikes()
      const count = await getLikeCount('post-1')

      expect(count).toBe(0)
    })
  })

  describe('isLikedByUser', () => {
    it('should return true when user has liked the post', async () => {
      vi.mocked(apiService.getLikesByPostId).mockResolvedValue([...mockLikes])

      const { isLikedByUser } = useLikes()
      const isLiked = await isLikedByUser('post-1', 'user-1')

      expect(isLiked).toBe(true)
    })

    it('should return false when user has not liked the post', async () => {
      vi.mocked(apiService.getLikesByPostId).mockResolvedValue([...mockLikes])

      const { isLikedByUser } = useLikes()
      const isLiked = await isLikedByUser('post-1', 'user-3')

      expect(isLiked).toBe(false)
    })
  })

  describe('toggleLike', () => {
    it('should create a like when user has not liked the post', async () => {
      const likesWithoutUser = mockLikes.filter(like => like.userId !== 'user-1')
      vi.mocked(apiService.getLikesByPostId).mockResolvedValue(likesWithoutUser)
      vi.mocked(apiService.createLike).mockResolvedValue({
        id: 'like-3',
        postId: 'post-1',
        userId: 'user-1',
        createdAt: '2024-01-01T12:00:00.000Z'
      })

      const { toggleLike } = useLikes()
      await toggleLike('post-1')

      expect(apiService.createLike).toHaveBeenCalledWith({
        postId: 'post-1',
        userId: 'user-1'
      })
      expect(apiService.deleteLike).not.toHaveBeenCalled()
    })

    it('should delete a like when user has already liked the post', async () => {
      vi.mocked(apiService.getLikesByPostId).mockResolvedValue([...mockLikes])
      vi.mocked(apiService.deleteLike).mockResolvedValue()

      const { toggleLike } = useLikes()
      await toggleLike('post-1')

      expect(apiService.deleteLike).toHaveBeenCalledWith('like-1')
      expect(apiService.createLike).not.toHaveBeenCalled()
    })

    it('should throw error when user is not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({
        currentUser: { value: null } as any,
        isAuthenticated: { value: false } as any,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn()
      })

      const { toggleLike } = useLikes()

      await expect(toggleLike('post-1')).rejects.toThrow(
        'User must be authenticated to like a post'
      )
    })
  })
})
