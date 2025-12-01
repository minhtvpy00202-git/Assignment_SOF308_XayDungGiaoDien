import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { useShares } from '../useShares'
import { useAuth } from '../useAuth'
import { usePosts } from '../usePosts'
import { apiService } from '../../services/apiService'
import type { CreatePostData } from '../../types'

describe('useShares Property Tests', () => {
  beforeAll(async () => {
    // Wait for JSON server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  beforeEach(async () => {
    // Clear all data before each test
    try {
      const shares = await apiService.getShares()
      for (const share of shares) {
        try {
          await apiService['axiosInstance'].delete(`/shares/${share.id}`)
        } catch (e) {
          // Ignore errors if share already deleted
        }
      }
    } catch (e) {
      // Ignore errors if can't fetch shares
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

  // Feature: blog-management, Property 21: Share creates new post with reference
  it('Property 21: Share creates new post with reference', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
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
        async (originalUserData, sharingUserData, postData: CreatePostData) => {
          // Make emails unique by adding timestamp
          const uniqueOriginalUserData = {
            ...originalUserData,
            email: `${Date.now()}-original-${originalUserData.email}`
          }
          
          const uniqueSharingUserData = {
            ...sharingUserData,
            email: `${Date.now()}-sharing-${sharingUserData.email}`
          }
          
          // Create the original user who will create the post
          const originalUser = await apiService.createUser(uniqueOriginalUserData)
          const { login } = useAuth()
          await login(uniqueOriginalUserData.email, uniqueOriginalUserData.password)

          // Create the original post
          const { createPost, fetchPosts } = usePosts()
          await createPost(postData)

          // Fetch posts to get the created post
          await fetchPosts()
          const posts = await apiService.getPosts()
          const originalPost = posts.find(p => p.userId === originalUser.id && p.title === postData.title)
          
          if (!originalPost) {
            throw new Error('Original post was not created')
          }

          // Create the sharing user
          const sharingUser = await apiService.createUser(uniqueSharingUserData)
          
          // Login as the sharing user
          await login(uniqueSharingUserData.email, uniqueSharingUserData.password)

          // Share the post
          const { sharePost } = useShares()
          await sharePost(originalPost.id)

          // Fetch all posts to find the shared post
          const allPosts = await apiService.getPosts()
          
          // Find the shared post (should have sharedFromId pointing to original post)
          const sharedPost = allPosts.find(p => 
            p.sharedFromId === originalPost.id && 
            p.userId === sharingUser.id
          )

          // Verify a new post was created
          expect(sharedPost).toBeDefined()
          
          if (!sharedPost) {
            throw new Error('Shared post was not created')
          }

          // Verify the shared post has the sharing user's ID
          expect(sharedPost.userId).toBe(sharingUser.id)

          // Verify the shared post has sharedFromId referencing the original post
          expect(sharedPost.sharedFromId).toBe(originalPost.id)

          // Verify the shared post has the same content as the original
          expect(sharedPost.title).toBe(originalPost.title)
          expect(sharedPost.content).toBe(originalPost.content)
          expect(sharedPost.image).toBe(originalPost.image)

          // Verify the shared post has its own unique ID
          expect(sharedPost.id).toBeDefined()
          expect(sharedPost.id).not.toBe(originalPost.id)

          // Verify the shared post has a timestamp
          expect(sharedPost.createdAt).toBeDefined()
          expect(typeof sharedPost.createdAt).toBe('string')

          // Verify a share record was also created
          const shares = await apiService.getSharesByPostId(originalPost.id)
          expect(shares.length).toBeGreaterThan(0)
          
          const shareRecord = shares.find(s => 
            s.userId === sharingUser.id && 
            s.postId === originalPost.id
          )
          expect(shareRecord).toBeDefined()

          // Clean up
          try {
            await apiService.deletePost(sharedPost.id)
          } catch (e) {
            // Ignore if already deleted
          }
          try {
            await apiService.deletePost(originalPost.id)
          } catch (e) {
            // Ignore if already deleted
          }
          try {
            await apiService['axiosInstance'].delete(`/users/${originalUser.id}`)
          } catch (e) {
            // Ignore if already deleted
          }
          try {
            await apiService['axiosInstance'].delete(`/users/${sharingUser.id}`)
          } catch (e) {
            // Ignore if already deleted
          }
        }
      ),
      { numRuns: 100, timeout: 20000 }
    )
  }, 30000)

  // Feature: blog-management, Property 23: Share count reflects total shares
  it('Property 23: Share count reflects total shares', async () => {
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
        fc.integer({ min: 1, max: 5 }), // Number of shares to create
        async (userData, postData: CreatePostData, numShares: number) => {
          // Create unique email with more randomness
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${Math.random()}-${userData.email}`
          }
          
          // Create the user who will create the post
          const user = await apiService.createUser(uniqueUserData)
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)

          // Create the original post
          const { createPost } = usePosts()
          await createPost(postData)

          // Fetch posts to get the created post
          const posts = await apiService.getPosts()
          const originalPost = posts.find(p => p.userId === user.id && p.title === postData.title)
          
          if (!originalPost) {
            throw new Error('Original post was not created')
          }

          // Verify no shares exist for this post yet
          const initialShares = await apiService.getSharesByPostId(originalPost.id)
          expect(initialShares.length).toBe(0)

          // Create multiple users who will share the post
          const sharingUsers = []
          for (let i = 0; i < numShares; i++) {
            const sharingUserData = {
              name: `Sharer ${i}`,
              email: `${Date.now()}-sharer-${i}-${Math.random()}@example.com`,
              password: 'password123'
            }
            const sharingUser = await apiService.createUser(sharingUserData)
            sharingUsers.push(sharingUser)
            
            // Login as the sharing user
            await login(sharingUserData.email, sharingUserData.password)

            // Share the post
            const { sharePost } = useShares()
            await sharePost(originalPost.id)
          }

          // Now check the share count
          const { getShareCount } = useShares()
          const shareCount = await getShareCount(originalPost.id)

          // Verify the share count equals the number of shares created
          expect(shareCount).toBe(numShares)

          // Also verify by fetching share records directly
          const shares = await apiService.getSharesByPostId(originalPost.id)
          expect(shares.length).toBe(numShares)

          // Verify each share record has the correct postId
          for (const share of shares) {
            expect(share.postId).toBe(originalPost.id)
          }

          // Clean up
          try {
            // Delete all shares for this post
            const sharesToDelete = await apiService.getSharesByPostId(originalPost.id)
            for (const share of sharesToDelete) {
              await apiService['axiosInstance'].delete(`/shares/${share.id}`)
            }
            
            // Delete all shared posts
            const allPosts = await apiService.getPosts()
            const sharedPosts = allPosts.filter(p => p.sharedFromId === originalPost.id)
            for (const sharedPost of sharedPosts) {
              await apiService.deletePost(sharedPost.id)
            }
            
            // Delete original post
            await apiService.deletePost(originalPost.id)
          } catch (e) {
            // Ignore if already deleted
          }
          
          try {
            // Delete all users
            await apiService['axiosInstance'].delete(`/users/${user.id}`)
            for (const sharingUser of sharingUsers) {
              await apiService['axiosInstance'].delete(`/users/${sharingUser.id}`)
            }
          } catch (e) {
            // Ignore if already deleted
          }
        }
      ),
      { numRuns: 100, timeout: 30000 }
    )
  }, 120000)
})
