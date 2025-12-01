import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { usePosts } from '../usePosts'
import { useAuth } from '../useAuth'
import { apiService } from '../../services/apiService'
import type { CreatePostData } from '../../types'

describe('usePosts Property Tests', () => {
  beforeAll(async () => {
    // Wait for JSON server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  beforeEach(async () => {
    // Clear all data before each test
    try {
      const posts = await apiService.getPosts()
      for (const post of posts) {
        try {
          await apiService.deletePost(post.id)
        } catch (e) {
          // Ignore errors if post already deleted
        }
      }
    } catch (e) {
      // Ignore errors if can't fetch posts
    }

    try {
      const comments = await apiService.getComments()
      for (const comment of comments) {
        try {
          await apiService.deleteComment(comment.id)
        } catch (e) {
          // Ignore errors if comment already deleted
        }
      }
    } catch (e) {
      // Ignore errors if can't fetch comments
    }

    try {
      const users = await apiService.getUsers()
      for (const user of users) {
        try {
          await apiService['axiosInstance'].delete(`/users/${user.id}`)
        } catch (e) {
          // Ignore errors if user already deleted
        }
      }
    } catch (e) {
      // Ignore errors if can't fetch users
    }

    // Clear localStorage and logout
    localStorage.clear()
    const { logout } = useAuth()
    logout()
    
    // Clear the posts state in usePosts composable
    const { fetchPosts } = usePosts()
    // Fetch posts to reset the state (will be empty after cleanup)
    try {
      await fetchPosts()
    } catch (e) {
      // Ignore errors if can't fetch posts
    }
  })

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear()
  })

  // Feature: blog-management, Property 5: Post creation includes required metadata
  it('Property 5: Post creation includes required metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0),
          image: fc.option(fc.webUrl(), { nil: undefined })
        }),
        async (userData, postData: CreatePostData) => {
          // Make email unique by adding timestamp
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${userData.email}`
          }
          
          // Create and login a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create a post
          const { createPost, posts, fetchPosts } = usePosts()
          await createPost(postData)

          // Fetch posts to get the latest state
          await fetchPosts()
          
          // Find the post we just created (should be the most recent one)
          const createdPost = posts.value.find(p => p.userId === createdUser.id && p.title === postData.title)
          expect(createdPost).toBeDefined()
          expect(createdPost).not.toBeNull()

          if (!createdPost) {
            throw new Error('Post was not created')
          }

          // Verify post has unique identifier
          expect(createdPost.id).toBeDefined()
          expect(createdPost.id).not.toBe('')
          expect(typeof createdPost.id).toBe('string')

          // Verify post has current timestamp
          expect(createdPost.createdAt).toBeDefined()
          expect(typeof createdPost.createdAt).toBe('string')
          const createdTime = new Date(createdPost.createdAt).getTime()
          const now = Date.now()
          // Timestamp should be within last 5 seconds
          expect(now - createdTime).toBeLessThan(5000)
          expect(now - createdTime).toBeGreaterThanOrEqual(0)

          // Verify post is associated with authenticated user's ID
          expect(createdPost.userId).toBe(createdUser.id)

          // Verify post data matches input
          expect(createdPost.title).toBe(postData.title)
          expect(createdPost.content).toBe(postData.content)

          // Clean up
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 15000 }
    )
  }, 20000)

  // Feature: blog-management, Property 6: Image URL storage
  it('Property 6: Image URL storage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0),
          image: fc.webUrl()
        }),
        async (userData, postData: CreatePostData) => {
          // Make email unique by adding timestamp
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${userData.email}`
          }
          
          // Create and login a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create a post with an image URL
          const { createPost, posts, fetchPosts } = usePosts()
          await createPost(postData)

          // Fetch posts to get the latest state
          await fetchPosts()
          
          // Find the post we just created (should be the most recent one)
          const createdPost = posts.value.find(p => p.userId === createdUser.id && p.title === postData.title)
          expect(createdPost).toBeDefined()
          expect(createdPost).not.toBeNull()

          if (!createdPost) {
            throw new Error('Post was not created')
          }

          // Verify the image URL is stored exactly as provided
          expect(createdPost.image).toBe(postData.image)
          expect(createdPost.image).not.toBe('')

          // Verify the post is persisted with the image URL
          const fetchedPost = await apiService.getPostById(createdPost.id)
          expect(fetchedPost.image).toBe(postData.image)

          // Clean up
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 15000 }
    )
  }, 20000)

  // Feature: blog-management, Property 8: Post updates persist correctly
  it('Property 8: Post updates persist correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0),
          image: fc.option(fc.webUrl(), { nil: undefined })
        }),
        fc.record({
          title: fc.option(fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0), { nil: undefined }),
          content: fc.option(fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0), { nil: undefined }),
          image: fc.option(fc.webUrl(), { nil: undefined })
        }).filter(updateData => 
          // Ensure at least one field is being updated
          updateData.title !== undefined || updateData.content !== undefined || updateData.image !== undefined
        ),
        async (userData, initialPostData: CreatePostData, updateData) => {
          // Make email unique by adding timestamp
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${userData.email}`
          }
          
          // Create and login a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create a post
          const { createPost, updatePost, fetchPosts, posts } = usePosts()
          await createPost(initialPostData)

          // Fetch posts to get the created post
          await fetchPosts()
          const createdPost = posts.value.find(p => p.userId === createdUser.id && p.title === initialPostData.title)
          
          if (!createdPost) {
            throw new Error('Post was not created')
          }

          // Update the post with new data
          await updatePost(createdPost.id, updateData)

          // Fetch the post again to verify persistence
          const updatedPost = await apiService.getPostById(createdPost.id)

          // Verify that the updates were persisted correctly
          if (updateData.title !== undefined) {
            expect(updatedPost.title).toBe(updateData.title)
          } else {
            expect(updatedPost.title).toBe(initialPostData.title)
          }

          if (updateData.content !== undefined) {
            expect(updatedPost.content).toBe(updateData.content)
          } else {
            expect(updatedPost.content).toBe(initialPostData.content)
          }

          if (updateData.image !== undefined) {
            expect(updatedPost.image).toBe(updateData.image)
          } else {
            expect(updatedPost.image).toBe(initialPostData.image || '')
          }

          // Verify that unchanged fields remain the same
          expect(updatedPost.id).toBe(createdPost.id)
          expect(updatedPost.userId).toBe(createdPost.userId)
          expect(updatedPost.createdAt).toBe(createdPost.createdAt)

          // Clean up
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 15000 }
    )
  }, 20000)

  // Feature: blog-management, Property 9: Post deletion cascades to comments
  it('Property 9: Post deletion cascades to comments', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0),
          image: fc.option(fc.webUrl(), { nil: undefined })
        }),
        fc.array(
          fc.string({ minLength: 1, maxLength: 500 }).filter((s: string) => s.trim().length > 0),
          { minLength: 1, maxLength: 5 }
        ),
        async (userData, postData: CreatePostData, commentContents) => {
          // Make email unique by adding timestamp
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${userData.email}`
          }
          
          // Create and login a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create a post
          const { createPost, deletePost, fetchPosts, posts } = usePosts()
          await createPost(postData)

          // Fetch posts to get the created post
          await fetchPosts()
          const createdPost = posts.value.find(p => p.userId === createdUser.id && p.title === postData.title)
          
          if (!createdPost) {
            throw new Error('Post was not created')
          }

          // Create multiple comments on the post
          const createdCommentIds: string[] = []
          for (const commentContent of commentContents) {
            const comment = await apiService.createComment({
              postId: createdPost.id,
              content: commentContent,
              userId: createdUser.id
            })
            createdCommentIds.push(comment.id)
          }

          // Verify comments were created
          const commentsBeforeDeletion = await apiService.getCommentsByPostId(createdPost.id)
          expect(commentsBeforeDeletion.length).toBe(commentContents.length)
          
          // Verify all created comments exist
          for (const commentId of createdCommentIds) {
            const commentExists = commentsBeforeDeletion.some(c => c.id === commentId)
            expect(commentExists).toBe(true)
          }

          // Delete the post
          await deletePost(createdPost.id)

          // Verify the post is deleted
          try {
            await apiService.getPostById(createdPost.id)
            throw new Error('Post should have been deleted')
          } catch (err) {
            // Expected: post should not be found
            expect(err).toBeDefined()
          }

          // Verify all comments associated with the post are also deleted (cascade)
          const commentsAfterDeletion = await apiService.getCommentsByPostId(createdPost.id)
          expect(commentsAfterDeletion.length).toBe(0)

          // Verify each individual comment is deleted
          for (const commentId of createdCommentIds) {
            try {
              await apiService['axiosInstance'].get(`/comments/${commentId}`)
              throw new Error(`Comment ${commentId} should have been deleted`)
            } catch (err: any) {
              // Expected: comment should not be found (404 error)
              expect(err.response?.status).toBe(404)
            }
          }

          // Clean up user
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 15000 }
    )
  }, 20000)

  // Feature: blog-management, Property 14: News feed posts sorted by timestamp descending
  it('Property 14: News feed posts sorted by timestamp descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
            content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0),
            image: fc.option(fc.webUrl(), { nil: undefined })
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (userData, postsData) => {
          // Make email unique by adding timestamp
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${userData.email}`
          }
          
          // Create and login a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create multiple posts with small delays to ensure different timestamps
          const { fetchPosts, posts } = usePosts()
          const createdPostIds: string[] = []
          
          for (const postData of postsData) {
            const createdPost = await apiService.createPost({
              ...postData,
              userId: createdUser.id
            })
            createdPostIds.push(createdPost.id)
            // Small delay to ensure timestamps are different
            await new Promise(resolve => setTimeout(resolve, 10))
          }

          // Fetch all posts (simulating news feed loading)
          await fetchPosts()
          
          // Filter to only the posts we created for this test
          const ourPosts = posts.value.filter(p => createdPostIds.includes(p.id))
          
          // Verify we have the expected number of posts
          expect(ourPosts.length).toBe(postsData.length)

          // Property: Posts in the news feed should be sorted by timestamp in descending order (most recent first)
          // According to Requirement 7.1: "WHEN any user accesses the home page THEN the Blog System 
          // SHALL display all posts in the center column ordered by creation timestamp in descending order"
          
          // Verify posts are sorted by timestamp in descending order
          for (let i = 0; i < ourPosts.length - 1; i++) {
            const currentPost = ourPosts[i]
            const nextPost = ourPosts[i + 1]
            
            if (!currentPost || !nextPost) {
              throw new Error('Post is undefined')
            }
            
            const currentTimestamp = new Date(currentPost.createdAt).getTime()
            const nextTimestamp = new Date(nextPost.createdAt).getTime()
            
            // Current post should have a timestamp >= next post (descending order, most recent first)
            expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp)
          }

          // Clean up
          for (const postId of createdPostIds) {
            try {
              await apiService.deletePost(postId)
            } catch (e) {
              // Ignore errors if post already deleted
            }
          }
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 15000 }
    )
  }, 20000)
})
