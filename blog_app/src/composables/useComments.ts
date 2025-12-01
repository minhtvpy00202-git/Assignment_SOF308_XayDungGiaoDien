import { ref, readonly, type Ref } from 'vue'
import type { Comment, CreateCommentData } from '../types'
import { apiService } from '../services/apiService'
import { useAuth } from './useAuth'

const comments: Ref<Comment[]> = ref([])
const loading: Ref<boolean> = ref(false)

export function useComments() {
  const { currentUser } = useAuth()

  const fetchCommentsByPostId = async (postId: string, sortOrder: 'asc' | 'desc' = 'desc'): Promise<void> => {
    loading.value = true
    try {
      const fetchedComments = await apiService.getCommentsByPostId(postId)
      
      // Sort comments by timestamp
      // descending (most recent first) for Requirement 5.5
      // ascending (oldest first) for Requirement 10.5
      if (sortOrder === 'desc') {
        comments.value = fetchedComments.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      } else {
        comments.value = fetchedComments.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
      comments.value = []
    } finally {
      loading.value = false
    }
  }

  const createComment = async (commentData: CreateCommentData): Promise<void> => {
    // Validate required fields
    if (!commentData.content || !commentData.content.trim()) {
      throw new Error('Comment content is required')
    }

    if (!currentUser.value) {
      throw new Error('User must be authenticated to create a comment')
    }

    loading.value = true
    try {
      const newComment = await apiService.createComment({
        ...commentData,
        userId: currentUser.value.id
      })
      
      // Add the new comment to the comments array
      comments.value = [...comments.value, newComment]
    } catch (err) {
      console.error('Failed to create comment:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    comments: readonly(comments),
    loading: readonly(loading),
    fetchCommentsByPostId,
    createComment
  }
}
