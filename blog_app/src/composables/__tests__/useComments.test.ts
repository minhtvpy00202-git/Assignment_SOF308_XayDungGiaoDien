import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useComments } from '../useComments'
import { useAuth } from '../useAuth'
import { apiService } from '../../services/apiService'
import type { Comment } from '../../types'

// Mock the dependencies
vi.mock('../useAuth')
vi.mock('../../services/apiService')

describe('useComments', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password',
    avatar: 'https://example.com/avatar.jpg',
    intro: 'Test intro'
  }

  const mockComments: Comment[] = [
    {
      id: 'comment-1',
      postId: 'post-1',
      userId: 'user-1',
      content: 'First comment',
      parentId: null,
      createdAt: '2024-01-01T10:00:00.000Z'
    },
    {
      id: 'comment-2',
      postId: 'post-1',
      userId: 'user-2',
      content: 'Second comment',
      parentId: null,
      createdAt: '2024-01-01T11:00:00.000Z'
    },
    {
      id: 'comment-3',
      postId: 'post-1',
      userId: 'user-3',
      content: 'Third comment',
      parentId: null,
      createdAt: '2024-01-01T12:00:00.000Z'
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

  describe('fetchCommentsByPostId', () => {
    it('should fetch and sort comments in descending order by default', async () => {
      vi.mocked(apiService.getCommentsByPostId).mockResolvedValue([...mockComments])

      const { fetchCommentsByPostId, comments } = useComments()
      await fetchCommentsByPostId('post-1')

      expect(apiService.getCommentsByPostId).toHaveBeenCalledWith('post-1')
      expect(comments.value).toHaveLength(3)
      // Most recent first (descending)
      expect(comments.value[0]?.id).toBe('comment-3')
      expect(comments.value[1]?.id).toBe('comment-2')
      expect(comments.value[2]?.id).toBe('comment-1')
    })

    it('should fetch and sort comments in ascending order when specified', async () => {
      vi.mocked(apiService.getCommentsByPostId).mockResolvedValue([...mockComments])

      const { fetchCommentsByPostId, comments } = useComments()
      await fetchCommentsByPostId('post-1', 'asc')

      expect(apiService.getCommentsByPostId).toHaveBeenCalledWith('post-1')
      expect(comments.value).toHaveLength(3)
      // Oldest first (ascending)
      expect(comments.value[0]?.id).toBe('comment-1')
      expect(comments.value[1]?.id).toBe('comment-2')
      expect(comments.value[2]?.id).toBe('comment-3')
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(apiService.getCommentsByPostId).mockRejectedValue(new Error('Network error'))

      const { fetchCommentsByPostId, comments } = useComments()
      await fetchCommentsByPostId('post-1')

      expect(comments.value).toEqual([])
    })
  })

  describe('createComment', () => {
    it('should create a comment with valid data', async () => {
      const newComment: Comment = {
        id: 'comment-4',
        postId: 'post-1',
        userId: 'user-1',
        content: 'New comment',
        parentId: null,
        createdAt: '2024-01-01T13:00:00.000Z'
      }

      vi.mocked(apiService.createComment).mockResolvedValue(newComment)

      const { createComment, comments } = useComments()
      await createComment({
        postId: 'post-1',
        content: 'New comment'
      })

      expect(apiService.createComment).toHaveBeenCalledWith({
        postId: 'post-1',
        content: 'New comment',
        userId: 'user-1'
      })
      expect(comments.value).toContainEqual(newComment)
    })

    it('should throw error when content is empty', async () => {
      const { createComment } = useComments()

      await expect(
        createComment({
          postId: 'post-1',
          content: ''
        })
      ).rejects.toThrow('Comment content is required')
    })

    it('should throw error when content is only whitespace', async () => {
      const { createComment } = useComments()

      await expect(
        createComment({
          postId: 'post-1',
          content: '   '
        })
      ).rejects.toThrow('Comment content is required')
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

      const { createComment } = useComments()

      await expect(
        createComment({
          postId: 'post-1',
          content: 'New comment'
        })
      ).rejects.toThrow('User must be authenticated to create a comment')
    })
  })
})
