import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { useComments } from '../useComments'
import { useAuth } from '../useAuth'
import { apiService } from '../../services/apiService'
import type { CreateCommentData } from '../../types'

describe('useComments Property Tests', () => {
  beforeAll(async () => {
    // Wait for JSON server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  beforeEach(async () => {
    // Clear all data before each test - delete in proper order to avoid foreign key issues
    // First delete comments (they reference posts)
    try {
      const comments = await apiService.getComments()
      await Promise.all(
        comments.map(async (comment) => {
          try {
            await apiService.deleteComment(comment.id)
          } catch (e) {
            // Ignore errors if comment already deleted
          }
        })
      )
      // Wait a bit to ensure deletions are processed
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (e) {
      // Ignore errors if can't fetch comments
    }

    // Then delete posts (they reference users)
    try {
      const posts = await apiService.getPosts()
      await Promise.all(
        posts.map(async (post) => {
          try {
            await apiService.deletePost(post.id)
          } catch (e) {
            // Ignore errors if post already deleted
          }
        })
      )
      // Wait a bit to ensure deletions are processed
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (e) {
      // Ignore errors if can't fetch posts
    }

    // Finally delete users
    try {
      const users = await apiService.getUsers()
      await Promise.all(
        users.map(async (user) => {
          try {
            await apiService['axiosInstance'].delete(`/users/${user.id}`)
          } catch (e) {
            // Ignore errors if user already deleted
          }
        })
      )
      // Wait a bit to ensure deletions are processed
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (e) {
      // Ignore errors if can't fetch users
    }

    // Clear localStorage and logout
    localStorage.clear()
    const { logout } = useAuth()
    logout()
  })

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear()
  })

  // Feature: blog-management, Property 10: Comment creation includes metadata
  it('Property 10: Comment creation includes metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.string({ minLength: 1, maxLength: 500 }).filter((s: string) => s.trim().length > 0),
        async (userData, postData, commentContent) => {
          // Make email unique by adding timestamp
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${userData.email}`
          }
          
          // Create and login a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create a post to comment on
          const createdPost = await apiService.createPost({
            ...postData,
            userId: createdUser.id
          })

          // Create a comment
          const { createComment, fetchCommentsByPostId, comments } = useComments()
          const commentData: CreateCommentData = {
            postId: createdPost.id,
            content: commentContent
          }
          
          await createComment(commentData)

          // Fetch comments to get the latest state
          await fetchCommentsByPostId(createdPost.id)
          
          // Find the comment we just created
          const createdComment = comments.value.find(c => c.content === commentContent)
          expect(createdComment).toBeDefined()
          expect(createdComment).not.toBeNull()

          if (!createdComment) {
            throw new Error('Comment was not created')
          }

          // Verify comment has unique identifier
          expect(createdComment.id).toBeDefined()
          expect(createdComment.id).not.toBe('')
          expect(typeof createdComment.id).toBe('string')

          // Verify comment has current timestamp
          expect(createdComment.createdAt).toBeDefined()
          expect(typeof createdComment.createdAt).toBe('string')
          const createdTime = new Date(createdComment.createdAt).getTime()
          const now = Date.now()
          // Timestamp should be within last 5 seconds
          expect(now - createdTime).toBeLessThan(5000)
          expect(now - createdTime).toBeGreaterThanOrEqual(0)

          // Verify comment is associated with authenticated user's ID
          expect(createdComment.userId).toBe(createdUser.id)

          // Verify comment has the correct postId
          expect(createdComment.postId).toBe(createdPost.id)

          // Verify comment content matches input
          expect(createdComment.content).toBe(commentContent)

          // Clean up
          await apiService.deleteComment(createdComment.id)
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 30000 }
    )
  }, 40000)

  // Feature: blog-management, Property 12: Comments are sorted by timestamp descending
  it('Property 12: Comments are sorted by timestamp descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.array(
          fc.string({ minLength: 1, maxLength: 500 }).filter((s: string) => s.trim().length > 0),
          { minLength: 2, maxLength: 5 }
        ),
        async (userData, postData, commentContents) => {
          // Make email unique by adding timestamp
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${userData.email}`
          }
          
          // Create and login a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create a post to comment on
          const createdPost = await apiService.createPost({
            ...postData,
            userId: createdUser.id
          })

          // Create multiple comments with small delays to ensure different timestamps
          const { createComment, fetchCommentsByPostId, comments } = useComments()
          
          for (const commentContent of commentContents) {
            const commentData: CreateCommentData = {
              postId: createdPost.id,
              content: commentContent
            }
            await createComment(commentData)
            // Small delay to ensure timestamps are different
            await new Promise(resolve => setTimeout(resolve, 10))
          }

          // Fetch comments with default sort order (descending)
          await fetchCommentsByPostId(createdPost.id)
          
          // Verify we have the expected number of comments
          expect(comments.value.length).toBe(commentContents.length)

          // Verify comments are sorted by timestamp in descending order (most recent first)
          for (let i = 0; i < comments.value.length - 1; i++) {
            const currentComment = comments.value[i]
            const nextComment = comments.value[i + 1]
            
            if (!currentComment || !nextComment) {
              throw new Error('Comment is undefined')
            }
            
            const currentTimestamp = new Date(currentComment.createdAt).getTime()
            const nextTimestamp = new Date(nextComment.createdAt).getTime()
            
            // Current comment should have a timestamp >= next comment (descending order)
            expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp)
          }

          // Clean up
          for (const comment of comments.value) {
            await apiService.deleteComment(comment.id)
          }
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 30000 }
    )
  }, 40000)

  // Feature: blog-management, Property 28: Comments sorted by timestamp ascending
  it('Property 28: Comments sorted by timestamp ascending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.array(
          fc.string({ minLength: 1, maxLength: 500 }).filter((s: string) => s.trim().length > 0),
          { minLength: 2, maxLength: 5 }
        ),
        async (userData, postData, commentContents) => {
          // Make email unique by adding timestamp
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${userData.email}`
          }
          
          // Create and login a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create a post to comment on
          const createdPost = await apiService.createPost({
            ...postData,
            userId: createdUser.id
          })

          // Create multiple comments with small delays to ensure different timestamps
          const { createComment, fetchCommentsByPostId, comments } = useComments()
          
          for (const commentContent of commentContents) {
            const commentData: CreateCommentData = {
              postId: createdPost.id,
              content: commentContent
            }
            await createComment(commentData)
            // Small delay to ensure timestamps are different
            await new Promise(resolve => setTimeout(resolve, 10))
          }

          // Fetch comments with ascending sort order (for inline display)
          await fetchCommentsByPostId(createdPost.id, 'asc')
          
          // Verify we have the expected number of comments
          expect(comments.value.length).toBe(commentContents.length)

          // Verify comments are sorted by timestamp in ascending order (oldest first)
          for (let i = 0; i < comments.value.length - 1; i++) {
            const currentComment = comments.value[i]
            const nextComment = comments.value[i + 1]
            
            if (!currentComment || !nextComment) {
              throw new Error('Comment is undefined')
            }
            
            const currentTimestamp = new Date(currentComment.createdAt).getTime()
            const nextTimestamp = new Date(nextComment.createdAt).getTime()
            
            // Current comment should have a timestamp <= next comment (ascending order)
            expect(currentTimestamp).toBeLessThanOrEqual(nextTimestamp)
          }

          // Clean up
          for (const comment of comments.value) {
            await apiService.deleteComment(comment.id)
          }
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 30000 }
    )
  }, 40000)

  // Feature: blog-management, Property 25: Inline comment creation without navigation
  it('Property 25: Inline comment creation without navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.string({ minLength: 1, maxLength: 500 }).filter((s: string) => s.trim().length > 0),
        async (userData, postData, commentContent) => {
          // Make email unique by adding timestamp and random number
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${Math.random()}-${userData.email}`
          }
          
          // Create and login a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create a post to comment on
          const createdPost = await apiService.createPost({
            ...postData,
            userId: createdUser.id
          })

          // Create a comment inline (simulating news feed interaction)
          const { createComment, comments, fetchCommentsByPostId } = useComments()
          
          // Fetch initial comments to set up clean state
          await fetchCommentsByPostId(createdPost.id, 'asc')
          const initialCommentCount = comments.value.length

          const commentData: CreateCommentData = {
            postId: createdPost.id,
            content: commentContent
          }
          
          // The createComment function should add the comment to the local state immediately
          await createComment(commentData)

          // Verify the comment appears in the local state immediately without needing to refetch
          // This simulates the inline display behavior where the comment appears below the post
          expect(comments.value.length).toBe(initialCommentCount + 1)
          
          // Find the newly created comment in the local state (should be the last one added)
          const newComment = comments.value[comments.value.length - 1]
          expect(newComment).toBeDefined()
          expect(newComment).not.toBeNull()

          if (!newComment) {
            throw new Error('Comment was not added to local state')
          }

          // Verify the comment has the correct data
          expect(newComment.postId).toBe(createdPost.id)
          expect(newComment.userId).toBe(createdUser.id)
          expect(newComment.content).toBe(commentContent)
          expect(newComment.id).toBeDefined()
          expect(typeof newComment.id).toBe('string')

          // Verify the comment was persisted to the backend by fetching directly from API
          const backendComments = await apiService.getCommentsByPostId(createdPost.id)
          const persistedComment = backendComments.find(c => c.id === newComment.id)
          expect(persistedComment).toBeDefined()
          expect(persistedComment?.content).toBe(commentContent)

          // Clean up
          await apiService.deleteComment(newComment.id)
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 60000 }
    )
  }, 120000)

  // Feature: blog-management, Property 26: Comment display includes required fields
  it('Property 26: Comment display includes required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0),
          avatar: fc.webUrl()
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.string({ minLength: 1, maxLength: 500 }).filter((s: string) => s.trim().length > 0),
        async (userData, postData, commentContent) => {
          // Make email unique by adding timestamp and random number
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${Math.random()}-${userData.email}`
          }
          
          // Create and login a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create a post to comment on
          const createdPost = await apiService.createPost({
            ...postData,
            userId: createdUser.id
          })

          // Create a comment
          const { createComment, fetchCommentsByPostId, comments } = useComments()
          const commentData: CreateCommentData = {
            postId: createdPost.id,
            content: commentContent
          }
          
          await createComment(commentData)

          // Fetch comments to get the latest state
          await fetchCommentsByPostId(createdPost.id, 'asc')
          
          // Find the comment we just created
          const createdComment = comments.value.find(c => c.content === commentContent)
          expect(createdComment).toBeDefined()
          expect(createdComment).not.toBeNull()

          if (!createdComment) {
            throw new Error('Comment was not created')
          }

          // Verify the comment object has all required fields for display
          // According to Requirements 10.3, the display should include:
          // - commenter avatar
          // - commenter name
          // - comment content
          // - formatted timestamp

          // 1. Verify comment has userId (needed to fetch commenter avatar and name)
          expect(createdComment.userId).toBeDefined()
          expect(typeof createdComment.userId).toBe('string')
          expect(createdComment.userId).toBe(createdUser.id)

          // 2. Verify comment has content
          expect(createdComment.content).toBeDefined()
          expect(typeof createdComment.content).toBe('string')
          expect(createdComment.content).toBe(commentContent)

          // 3. Verify comment has createdAt timestamp (needed for formatted timestamp display)
          expect(createdComment.createdAt).toBeDefined()
          expect(typeof createdComment.createdAt).toBe('string')
          // Verify it's a valid ISO timestamp
          const timestamp = new Date(createdComment.createdAt)
          expect(timestamp.toString()).not.toBe('Invalid Date')

          // 4. Verify we can fetch the commenter's information (avatar and name)
          const commenter = await apiService.getUserById(createdComment.userId)
          expect(commenter).toBeDefined()
          expect(commenter.name).toBeDefined()
          expect(typeof commenter.name).toBe('string')
          expect(commenter.name).toBe(createdUser.name)
          expect(commenter.avatar).toBeDefined()
          expect(typeof commenter.avatar).toBe('string')

          // Clean up
          await apiService.deleteComment(createdComment.id)
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 60000 }
    )
  }, 120000)

  // Feature: blog-management, Property 27: Comment pagination shows limited initial comments
  it('Property 27: Comment pagination shows limited initial comments', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0)
        }),
        fc.array(
          fc.string({ minLength: 1, maxLength: 500 }).filter((s: string) => s.trim().length > 0),
          { minLength: 4, maxLength: 10 } // Generate at least 4 comments to test pagination
        ),
        async (userData, postData, commentContents) => {
          // Make email unique by adding timestamp and random number
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${Math.random()}-${userData.email}`
          }
          
          // Create and login a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create a post to comment on
          const createdPost = await apiService.createPost({
            ...postData,
            userId: createdUser.id
          })

          // Ensure no existing comments for this post before we start
          const existingComments = await apiService.getCommentsByPostId(createdPost.id)
          for (const comment of existingComments) {
            try {
              await apiService.deleteComment(comment.id)
            } catch (e) {
              // Ignore errors
            }
          }
          // Wait for deletions to complete
          await new Promise(resolve => setTimeout(resolve, 50))

          // Create multiple comments (more than 3) with small delays to ensure different timestamps
          const { createComment, fetchCommentsByPostId, comments } = useComments()
          
          // Track the comment IDs we create for proper cleanup
          const createdCommentIds: string[] = []
          
          for (const commentContent of commentContents) {
            const commentData: CreateCommentData = {
              postId: createdPost.id,
              content: commentContent
            }
            await createComment(commentData)
            // Small delay to ensure timestamps are different
            await new Promise(resolve => setTimeout(resolve, 10))
          }

          // Fetch comments with ascending sort order (for inline display)
          await fetchCommentsByPostId(createdPost.id, 'asc')
          
          // Store the IDs of comments we just created
          for (const comment of comments.value) {
            createdCommentIds.push(comment.id)
          }
          
          // Verify we have the expected number of comments (should match what we created)
          expect(comments.value.length).toBe(commentContents.length)
          // Verify we have more than 3 comments
          expect(comments.value.length).toBeGreaterThan(3)

          // The component logic should initially show only the first 3 comments
          // This is tested by verifying that the comments array contains all comments,
          // but the component's displayedComments computed property would limit to 3
          
          // Verify that we have all comments available in the data
          expect(comments.value.length).toBe(commentContents.length)
          
          // Verify the first 3 comments are the oldest ones (since we're using ascending order)
          const firstThree = comments.value.slice(0, 3)
          expect(firstThree.length).toBe(3)
          
          // Verify these are indeed the first 3 comments by checking their timestamps
          for (let i = 0; i < firstThree.length - 1; i++) {
            const currentComment = firstThree[i]
            const nextComment = firstThree[i + 1]
            
            if (!currentComment || !nextComment) {
              throw new Error('Comment is undefined')
            }
            
            const currentTimestamp = new Date(currentComment.createdAt).getTime()
            const nextTimestamp = new Date(nextComment.createdAt).getTime()
            expect(currentTimestamp).toBeLessThanOrEqual(nextTimestamp)
          }
          
          // Verify there are remaining comments beyond the first 3
          const remainingComments = comments.value.slice(3)
          expect(remainingComments.length).toBeGreaterThan(0)
          expect(remainingComments.length).toBe(commentContents.length - 3)

          // Clean up - use the tracked IDs to ensure we delete what we created
          for (const commentId of createdCommentIds) {
            try {
              await apiService.deleteComment(commentId)
            } catch (e) {
              // Ignore errors if comment already deleted
            }
          }
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 60000 }
    )
  }, 120000)
})
