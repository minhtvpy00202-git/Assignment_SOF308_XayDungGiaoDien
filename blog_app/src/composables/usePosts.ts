import { ref, readonly, type Ref } from 'vue'
import type { Post, CreatePostData, UpdatePostData } from '../types'
import { apiService } from '../services/apiService'
import { useAuth } from './useAuth'

const posts: Ref<Post[]> = ref([])
const currentPost: Ref<Post | null> = ref(null)
const loading: Ref<boolean> = ref(false)
const error: Ref<string | null> = ref(null)

export function usePosts() {
  const { currentUser } = useAuth()

  const fetchPosts = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const fetchedPosts = await apiService.getPosts()
      // Sort by timestamp descending (most recent first)
      posts.value = fetchedPosts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch posts'
      posts.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchPostsByUserId = async (userId: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const fetchedPosts = await apiService.getPostsByUserId(userId)
      // Sort by timestamp descending (most recent first)
      posts.value = fetchedPosts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch posts'
      posts.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchPostById = async (id: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const post = await apiService.getPostById(id)
      currentPost.value = post
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch post'
      currentPost.value = null
    } finally {
      loading.value = false
    }
  }

  const createPost = async (postData: CreatePostData): Promise<void> => {
    // Validate required fields
    if (!postData.title || !postData.title.trim()) {
      throw new Error('Title is required')
    }
    if (!postData.content || !postData.content.trim()) {
      throw new Error('Content is required')
    }

    if (!currentUser.value) {
      throw new Error('User must be authenticated to create a post')
    }

    loading.value = true
    error.value = null
    try {
      const newPost = await apiService.createPost({
        ...postData,
        userId: currentUser.value.id
      })
      
      // Add the new post to the beginning of the posts array
      posts.value = [newPost, ...posts.value]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create post'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePost = async (id: string, postData: UpdatePostData): Promise<void> => {
    // Validate required fields
    if (postData.title !== undefined && !postData.title.trim()) {
      throw new Error('Title cannot be empty')
    }
    if (postData.content !== undefined && !postData.content.trim()) {
      throw new Error('Content cannot be empty')
    }

    if (!currentUser.value) {
      throw new Error('User must be authenticated to update a post')
    }

    loading.value = true
    error.value = null
    try {
      // First, fetch the post to verify ownership
      const post = await apiService.getPostById(id)
      
      if (post.userId !== currentUser.value.id) {
        throw new Error('You can only update your own posts')
      }

      const updatedPost = await apiService.updatePost(id, postData)
      
      // Update the post in the posts array
      const index = posts.value.findIndex(p => p.id === id)
      if (index !== -1) {
        posts.value[index] = updatedPost
      }
      
      // Update currentPost if it's the one being updated
      if (currentPost.value?.id === id) {
        currentPost.value = updatedPost
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update post'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deletePost = async (id: string): Promise<void> => {
    if (!currentUser.value) {
      throw new Error('User must be authenticated to delete a post')
    }

    loading.value = true
    error.value = null
    try {
      // First, fetch the post to verify ownership
      const post = await apiService.getPostById(id)
      
      if (post.userId !== currentUser.value.id) {
        throw new Error('You can only delete your own posts')
      }

      // Delete all comments associated with this post (cascade deletion)
      const comments = await apiService.getCommentsByPostId(id)
      await Promise.all(comments.map(comment => apiService.deleteComment(comment.id)))

      // Delete the post
      await apiService.deletePost(id)
      
      // Remove the post from the posts array
      posts.value = posts.value.filter(p => p.id !== id)
      
      // Clear currentPost if it's the one being deleted
      if (currentPost.value?.id === id) {
        currentPost.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete post'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    posts: readonly(posts),
    currentPost: readonly(currentPost),
    loading: readonly(loading),
    error: readonly(error),
    fetchPosts,
    fetchPostsByUserId,
    fetchPostById,
    createPost,
    updatePost,
    deletePost
  }
}
