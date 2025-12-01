import { ref, type Ref } from 'vue'
import type { Share } from '../types'
import { apiService } from '../services/apiService'
import { useAuth } from './useAuth'

const sharesCache: Ref<Map<string, Share[]>> = ref(new Map())

export function useShares() {
  const { currentUser } = useAuth()

  const fetchSharesByPostId = async (postId: string): Promise<Share[]> => {
    try {
      const shares = await apiService.getSharesByPostId(postId)
      sharesCache.value.set(postId, shares)
      return shares
    } catch (err) {
      console.error('Failed to fetch shares:', err)
      return []
    }
  }

  const getShareCount = async (postId: string): Promise<number> => {
    const shares = await fetchSharesByPostId(postId)
    return shares.length
  }

  const sharePost = async (postId: string): Promise<void> => {
    if (!currentUser.value) {
      throw new Error('User must be authenticated to share a post')
    }

    try {
      // Fetch the original post
      const originalPost = await apiService.getPostById(postId)

      // Create a new post that references the original post
      await apiService.createPost({
        userId: currentUser.value.id,
        title: originalPost.title,
        content: originalPost.content,
        image: originalPost.image,
        sharedFromId: postId
      })

      // Create a share record for counting
      await apiService.createShare({
        postId,
        userId: currentUser.value.id
      })

      // Refresh the shares cache for this post
      await fetchSharesByPostId(postId)
    } catch (err) {
      console.error('Failed to share post:', err)
      throw err
    }
  }

  return {
    sharePost,
    getShareCount,
    fetchSharesByPostId
  }
}
