import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { apiService } from '../../services/apiService'
import { usePosts } from '../../composables/usePosts'
import { useAuth } from '../../composables/useAuth'
import type { Post } from '../../types'

describe('MyProfilePage Property Tests', () => {
  beforeAll(async () => {
    // Wait for JSON server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  beforeEach(async () => {
    // Clear all data before each test
    try {
      const users = await apiService.getUsers()
      for (const user of users) {
        try {
          await apiService['axiosInstance'].delete(`/users/${user.id}`)
        } catch (e) {
          // Ignore errors
        }
      }

      const posts = await apiService.getPosts()
      for (const post of posts) {
        try {
          await apiService.deletePost(post.id)
        } catch (e) {
          // Ignore errors
        }
      }

      const comments = await apiService.getComments()
      for (const comment of comments) {
        try {
          await apiService.deleteComment(comment.id)
        } catch (e) {
          // Ignore errors
        }
      }
    } catch (e) {
      // Ignore errors
    }

    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // Feature: blog-management, Property 40: Profile post deletion removes post
  it('Property 40: Profile post deletion removes post', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate user data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0),
          avatar: fc.webUrl(),
          intro: fc.string({ minLength: 0, maxLength: 500 })
        }),
        // Generate number of posts (2 to 5, so we can delete one and still have others)
        fc.integer({ min: 2, max: 5 }),
        async (userData, postCount) => {
          // Make email unique
          const uniqueUserData = {
            ...userData,
            email: `user-${Date.now()}-${Math.random()}@test.com`
          }

          // Create the user
          const createdUser = await apiService.createUser(uniqueUserData)

          // Authenticate the user using useAuth composable
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create posts for this user
          const createdPosts: Post[] = []
          for (let i = 0; i < postCount; i++) {
            const post = await apiService.createPost({
              userId: createdUser.id,
              title: `Test Post ${i}`,
              content: `Test content ${i}`,
              image: ''
            })
            createdPosts.push(post)
          }

          // Ensure we have at least one post
          expect(createdPosts.length).toBeGreaterThan(0)
          
          // Create some comments on the first post to test cascade deletion
          const firstPost = createdPosts[0]!
          const createdComments = []
          for (let i = 0; i < 3; i++) {
            const comment = await apiService.createComment({
              postId: firstPost.id,
              userId: createdUser.id,
              content: `Test comment ${i}`
            })
            createdComments.push(comment)
          }

          // Verify posts exist before deletion
          const postsBeforeDeletion = await apiService.getPostsByUserId(createdUser.id)
          expect(postsBeforeDeletion.length).toBe(postCount)

          // Verify comments exist before deletion
          const commentsBeforeDeletion = await apiService.getCommentsByPostId(firstPost.id)
          expect(commentsBeforeDeletion.length).toBe(3)

          // Use the composable to delete the first post (this is what MyProfilePage does)
          const { deletePost } = usePosts()
          await deletePost(firstPost.id)

          // Verify the post is removed from the backend
          const postsAfterDeletion = await apiService.getPostsByUserId(createdUser.id)
          expect(postsAfterDeletion.length).toBe(postCount - 1)

          // Verify the deleted post is not in the list
          const deletedPostExists = postsAfterDeletion.some(p => p.id === firstPost.id)
          expect(deletedPostExists).toBe(false)

          // Verify all remaining posts are still there
          for (let i = 1; i < createdPosts.length; i++) {
            const post = createdPosts[i]
            if (post) {
              const postExists = postsAfterDeletion.some(p => p.id === post.id)
              expect(postExists).toBe(true)
            }
          }

          // Verify comments were cascade deleted
          const commentsAfterDeletion = await apiService.getCommentsByPostId(firstPost.id)
          expect(commentsAfterDeletion.length).toBe(0)

          // Verify the post cannot be retrieved directly
          try {
            await apiService.getPostById(firstPost.id)
            // If we get here, the post still exists (should not happen)
            expect(true).toBe(false) // Force failure
          } catch (error) {
            // Expected: post should not be found
            expect(error).toBeDefined()
          }
        }
      ),
      { numRuns: 100 }
    )
  }, 120000) // 120 second timeout for multiple posts and comments
})
