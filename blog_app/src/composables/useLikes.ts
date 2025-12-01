import { ref, type Ref } from 'vue'
import type { Like } from '../types'
import { apiService } from '../services/apiService'
import { useAuth } from './useAuth'

const likesCache: Ref<Map<string, Like[]>> = ref(new Map())

export function useLikes() {
  const { currentUser } = useAuth()

  const fetchLikesByPostId = async (postId: string): Promise<Like[]> => {
    try {
      const likes = await apiService.getLikesByPostId(postId)
      likesCache.value.set(postId, likes)
      return likes
    } catch (err) {
      console.error('Failed to fetch likes:', err)
      return []
    }
  }

  const getLikeCount = async (postId: string): Promise<number> => {
    const likes = await fetchLikesByPostId(postId)
    return likes.length
  }

  const isLikedByUser = async (postId: string, userId: string): Promise<boolean> => {
    const likes = await fetchLikesByPostId(postId)
    return likes.some(like => like.userId === userId)
  }

  const toggleLike = async (postId: string): Promise<void> => {
    if (!currentUser.value) {
      throw new Error('User must be authenticated to like a post')
    }

    try {
      // Fetch current likes for this post
      const likes = await fetchLikesByPostId(postId)
      
      // Check if user has already liked this post
      const existingLike = likes.find(like => like.userId === currentUser.value!.id)

      if (existingLike) {
        // Unlike: remove the like
        await apiService.deleteLike(existingLike.id)
      } else {
        // Like: create a new like
        await apiService.createLike({
          postId,
          userId: currentUser.value.id
        })
      }

      // Refresh the likes cache for this post
      await fetchLikesByPostId(postId)
    } catch (err) {
      console.error('Failed to toggle like:', err)
      throw err
    }
  }

  return {
    toggleLike,
    getLikeCount,
    isLikedByUser,
    fetchLikesByPostId
  }
}
