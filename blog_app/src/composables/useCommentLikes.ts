import { ref, type Ref } from 'vue'
import type { CommentLike } from '../types'
import { apiService } from '../services/apiService'
import { useAuth } from './useAuth'

const commentLikesCache: Ref<Map<string, CommentLike[]>> = ref(new Map())

export function useCommentLikes() {
  const { currentUser } = useAuth()

  const fetchCommentLikesByCommentId = async (commentId: string): Promise<CommentLike[]> => {
    try {
      const likes = await apiService.getCommentLikesByCommentId(commentId)
      commentLikesCache.value.set(commentId, likes)
      return likes
    } catch (err) {
      console.error('Failed to fetch comment likes:', err)
      return []
    }
  }

  const getCommentLikeCount = async (commentId: string): Promise<number> => {
    const likes = await fetchCommentLikesByCommentId(commentId)
    return likes.length
  }

  const isCommentLikedByUser = async (commentId: string, userId?: string): Promise<boolean> => {
    if (!userId) return false
    const likes = await fetchCommentLikesByCommentId(commentId)
    return likes.some(like => like.userId === userId)
  }

  const toggleCommentLike = async (commentId: string): Promise<void> => {
    if (!currentUser.value) {
      throw new Error('User must be authenticated to like a comment')
    }

    try {
      const isLiked = await isCommentLikedByUser(commentId, currentUser.value.id)
      
      if (isLiked) {
        // Unlike the comment
        await apiService.deleteCommentLike(commentId, currentUser.value.id)
      } else {
        // Like the comment
        await apiService.createCommentLike({
          commentId,
          userId: currentUser.value.id
        })
      }

      // Refresh the cache for this comment
      await fetchCommentLikesByCommentId(commentId)
    } catch (err) {
      console.error('Failed to toggle comment like:', err)
      throw err
    }
  }

  return {
    commentLikesCache,
    fetchCommentLikesByCommentId,
    getCommentLikeCount,
    isCommentLikedByUser,
    toggleCommentLike
  }
}