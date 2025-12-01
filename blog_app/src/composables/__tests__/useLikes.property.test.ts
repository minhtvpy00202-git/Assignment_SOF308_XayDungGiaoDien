import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { useLikes } from '../useLikes'
import { useAuth } from '../useAuth'
import { usePosts } from '../usePosts'
import { apiService } from '../../services/apiService'
import type { CreatePostData } from '../../types'

describe('useLikes Property Tests', () => {
  beforeAll(async () => {
    // Wait for JSON server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  beforeEach(async () => {
    // Clear all data before each test
    try {
      const likes = await apiService.getLikes()
      for (const like of likes) {
        try {
          await apiService.deleteLike(like.id)
        } catch (e) {
          // Ignore errors if like already deleted
        }
      }
    } catch (e) {
      // Ignore errors if can't fetch likes
    }

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
  })

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear()
  })

  // Feature: blog-management, Property 17: Like creation stores correct data
  it('Property 17: Like creation stores correct data', async () => {
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

          // Fetch posts to get the created post
          await fetchPosts()
          const createdPost = posts.value.find(p => p.userId === createdUser.id && p.title === postData.title)
          
          if (!createdPost) {
            throw new Error('Post was not created')
          }

          // Like the post using toggleLike
          const { toggleLike, fetchLikesByPostId } = useLikes()
          await toggleLike(createdPost.id)

          // Fetch likes for the post
          const likes = await fetchLikesByPostId(createdPost.id)

          // Verify a like record was created
          expect(likes.length).toBe(1)
          const createdLike = likes[0]

          if (!createdLike) {
            throw new Error('Like was not created')
          }

          // Verify the like has correct userId
          expect(createdLike.userId).toBe(createdUser.id)

          // Verify the like has correct postId
          expect(createdLike.postId).toBe(createdPost.id)

          // Verify the like has an id
          expect(createdLike.id).toBeDefined()
          expect(createdLike.id).not.toBe('')
          expect(typeof createdLike.id).toBe('string')

          // Verify the like has a timestamp
          expect(createdLike.createdAt).toBeDefined()
          expect(typeof createdLike.createdAt).toBe('string')
          const createdTime = new Date(createdLike.createdAt).getTime()
          const now = Date.now()
          // Timestamp should be within last 5 seconds
          expect(now - createdTime).toBeLessThan(5000)
          expect(now - createdTime).toBeGreaterThanOrEqual(0)

          // Clean up
          await apiService.deleteLike(createdLike.id)
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 15000 }
    )
  }, 20000)

  // Feature: blog-management, Property 18: Like toggle removes existing like
  it('Property 18: Like toggle removes existing like', async () => {
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

          // Fetch posts to get the created post
          await fetchPosts()
          const createdPost = posts.value.find(p => p.userId === createdUser.id && p.title === postData.title)
          
          if (!createdPost) {
            throw new Error('Post was not created')
          }

          // Like the post using toggleLike (first toggle - creates like)
          const { toggleLike, fetchLikesByPostId } = useLikes()
          await toggleLike(createdPost.id)

          // Verify like was created
          let likes = await fetchLikesByPostId(createdPost.id)
          expect(likes.length).toBe(1)
          const createdLike = likes[0]
          expect(createdLike.userId).toBe(createdUser.id)
          expect(createdLike.postId).toBe(createdPost.id)

          // Toggle like again (second toggle - removes like)
          await toggleLike(createdPost.id)

          // Verify like was removed
          likes = await fetchLikesByPostId(createdPost.id)
          expect(likes.length).toBe(0)

          // Verify the specific like record no longer exists
          const allLikes = await apiService.getLikes()
          const deletedLike = allLikes.find(like => like.id === createdLike.id)
          expect(deletedLike).toBeUndefined()

          // Clean up
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 15000 }
    )
  }, 20000)

  // Feature: blog-management, Property 19: Like count reflects total likes
  it('Property 19: Like count reflects total likes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0),
          image: fc.option(fc.webUrl(), { nil: undefined })
        }),
        async (usersData, postData: CreatePostData) => {
          const createdUsers = []
          const createdLikes = []

          try {
            // Create multiple users
            for (const userData of usersData) {
              const uniqueUserData = {
                ...userData,
                email: `${Date.now()}-${Math.random()}-${userData.email}`
              }
              const user = await apiService.createUser(uniqueUserData)
              createdUsers.push({ user, credentials: uniqueUserData })
            }

            // First user creates a post
            const { login } = useAuth()
            await login(createdUsers[0].credentials.email, createdUsers[0].credentials.password)

            const { createPost, posts, fetchPosts } = usePosts()
            await createPost(postData)

            // Fetch posts to get the created post
            await fetchPosts()
            const createdPost = posts.value.find(p => p.userId === createdUsers[0].user.id && p.title === postData.title)
            
            if (!createdPost) {
              throw new Error('Post was not created')
            }

            // Each user likes the post
            const { getLikeCount, fetchLikesByPostId } = useLikes()
            
            for (let i = 0; i < createdUsers.length; i++) {
              // Login as each user
              await login(createdUsers[i].credentials.email, createdUsers[i].credentials.password)
              
              // Create like directly via API
              const like = await apiService.createLike({
                postId: createdPost.id,
                userId: createdUsers[i].user.id
              })
              createdLikes.push(like)

              // Verify like count equals number of likes created so far
              const likeCount = await getLikeCount(createdPost.id)
              expect(likeCount).toBe(i + 1)

              // Also verify by fetching likes directly
              const likes = await fetchLikesByPostId(createdPost.id)
              expect(likes.length).toBe(i + 1)
            }

            // Final verification: like count should equal total number of users
            const finalLikeCount = await getLikeCount(createdPost.id)
            expect(finalLikeCount).toBe(createdUsers.length)

            // Verify the count matches the actual number of like records
            const allLikesForPost = await fetchLikesByPostId(createdPost.id)
            expect(allLikesForPost.length).toBe(createdUsers.length)
            expect(finalLikeCount).toBe(allLikesForPost.length)

            // Clean up
            for (const like of createdLikes) {
              try {
                await apiService.deleteLike(like.id)
              } catch (e) {
                // Ignore if already deleted
              }
            }
            await apiService.deletePost(createdPost.id)
            for (const { user } of createdUsers) {
              try {
                await apiService['axiosInstance'].delete(`/users/${user.id}`)
              } catch (e) {
                // Ignore if already deleted
              }
            }
          } catch (error) {
            // Clean up on error
            for (const like of createdLikes) {
              try {
                await apiService.deleteLike(like.id)
              } catch (e) {
                // Ignore
              }
            }
            for (const { user } of createdUsers) {
              try {
                await apiService['axiosInstance'].delete(`/users/${user.id}`)
              } catch (e) {
                // Ignore
              }
            }
            throw error
          }
        }
      ),
      { numRuns: 100, timeout: 20000 }
    )
  }, 30000)

  // Feature: blog-management, Property 20: Like button state reflects user like status
  it('Property 20: Like button state reflects user like status', async () => {
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

          // Fetch posts to get the created post
          await fetchPosts()
          const createdPost = posts.value.find(p => p.userId === createdUser.id && p.title === postData.title)
          
          if (!createdPost) {
            throw new Error('Post was not created')
          }

          const { isLikedByUser, toggleLike } = useLikes()

          // Initially, the post should NOT be liked by the user
          let isLiked = await isLikedByUser(createdPost.id, createdUser.id)
          expect(isLiked).toBe(false)

          // Like the post
          await toggleLike(createdPost.id)

          // Now the post SHOULD be liked by the user
          isLiked = await isLikedByUser(createdPost.id, createdUser.id)
          expect(isLiked).toBe(true)

          // Unlike the post
          await toggleLike(createdPost.id)

          // Now the post should NOT be liked by the user again
          isLiked = await isLikedByUser(createdPost.id, createdUser.id)
          expect(isLiked).toBe(false)

          // Clean up
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${createdUser.id}`)
        }
      ),
      { numRuns: 100, timeout: 15000 }
    )
  }, 20000)
})
