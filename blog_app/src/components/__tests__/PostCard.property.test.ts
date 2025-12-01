import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { useAuth } from '../../composables/useAuth'
import { useLikes } from '../../composables/useLikes'
import { useShares } from '../../composables/useShares'
import { useComments } from '../../composables/useComments'
import { apiService } from '../../services/apiService'
import type { User } from '../../types'

describe('PostCard Property Tests', () => {
  beforeAll(async () => {
    // Wait for JSON server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  beforeEach(async () => {
    // Clear all data before each test
    try {
      const comments = await apiService.getComments()
      for (const comment of comments) {
        try {
          await apiService['axiosInstance'].delete(`/comments/${comment.id}`)
        } catch (e) {
          // Ignore errors
        }
      }
    } catch (e) {
      // Ignore errors
    }

    try {
      const likes = await apiService.getLikes()
      for (const like of likes) {
        try {
          await apiService['axiosInstance'].delete(`/likes/${like.id}`)
        } catch (e) {
          // Ignore errors
        }
      }
    } catch (e) {
      // Ignore errors
    }

    try {
      const shares = await apiService.getShares()
      for (const share of shares) {
        try {
          await apiService['axiosInstance'].delete(`/shares/${share.id}`)
        } catch (e) {
          // Ignore errors
        }
      }
    } catch (e) {
      // Ignore errors
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

  // Feature: blog-management, Property 15: Post card contains required information
  it('Property 15: Post card contains required information', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate user data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        // Generate post data
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0),
          image: fc.option(fc.webUrl(), { nil: undefined })
        }),
        async (userData, postData) => {
          // Make email unique
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${Math.random()}-${userData.email}`
          }
          
          // Create user
          const user = await apiService.createUser(uniqueUserData)
          
          // Login as user
          const { login } = useAuth()
          await login(uniqueUserData.email, uniqueUserData.password)
          
          // Create post
          const createdPost = await apiService.createPost({
            ...postData,
            userId: user.id
          })

          // Create some likes, shares, and comments to test counts
          const like1 = await apiService.createLike({ postId: createdPost.id, userId: user.id })
          const share1 = await apiService.createShare({ postId: createdPost.id, userId: user.id })
          const comment1 = await apiService.createComment({ postId: createdPost.id, content: 'Test comment', userId: user.id })

          // Fetch the post data to simulate what PostCard would receive
          const fetchedPost = await apiService.getPostById(createdPost.id)
          const fetchedAuthor = await apiService.getUserById(user.id)

          // Get counts using the composables (simulating what PostCard does)
          const { getLikeCount } = useLikes()
          const { getShareCount } = useShares()
          const { fetchCommentsByPostId, comments } = useComments()

          const likeCount = await getLikeCount(createdPost.id)
          const shareCount = await getShareCount(createdPost.id)
          await fetchCommentsByPostId(createdPost.id, 'asc')
          const commentCount = comments.value.length

          // Property: The post card should contain all required information
          // According to Requirement 7.2, the post card must show:
          // title, content, author name, avatar, creation date, image, like count, share count, comment count

          // Verify post data contains required fields
          expect(fetchedPost.title).toBe(postData.title)
          expect(fetchedPost.content).toBe(postData.content)
          expect(fetchedPost.image).toBe(postData.image || '')
          expect(fetchedPost.createdAt).toBeDefined()
          expect(fetchedPost.createdAt).not.toBe('')

          // Verify author data contains required fields
          expect(fetchedAuthor.name).toBe(userData.name)
          expect(fetchedAuthor.avatar).toBeDefined()
          expect(fetchedAuthor.avatar).not.toBe('')

          // Verify counts are available and correct
          expect(likeCount).toBe(1)
          expect(shareCount).toBe(1)
          expect(commentCount).toBe(1)

          // Clean up
          await apiService['axiosInstance'].delete(`/comments/${comment1.id}`)
          await apiService['axiosInstance'].delete(`/shares/${share1.id}`)
          await apiService['axiosInstance'].delete(`/likes/${like1.id}`)
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${user.id}`)
        }
      ),
      { numRuns: 100, timeout: 20000 }
    )
  }, 300000)

  // Feature: blog-management, Property 22: Shared post rendering includes both users
  it('Property 22: Shared post rendering includes both users', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate original post author
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        // Generate sharing user
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        // Generate original post data
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0),
          image: fc.option(fc.webUrl(), { nil: undefined })
        }),
        async (originalAuthorData, sharingUserData, postData) => {
          // Make emails unique
          const uniqueOriginalAuthorData = {
            ...originalAuthorData,
            email: `${Date.now()}-original-${Math.random()}-${originalAuthorData.email}`
          }
          
          const uniqueSharingUserData = {
            ...sharingUserData,
            email: `${Date.now()}-sharing-${Math.random()}-${sharingUserData.email}`
          }
          
          // Create original author
          const originalAuthor = await apiService.createUser(uniqueOriginalAuthorData)
          
          // Login as original author and create original post
          const { login } = useAuth()
          await login(uniqueOriginalAuthorData.email, uniqueOriginalAuthorData.password)
          
          const originalPost = await apiService.createPost({
            ...postData,
            userId: originalAuthor.id
          })

          // Create sharing user
          const sharingUser = await apiService.createUser(uniqueSharingUserData)
          
          // Login as sharing user
          await login(uniqueSharingUserData.email, uniqueSharingUserData.password)

          // Share the post using useShares composable
          const { sharePost } = useShares()
          await sharePost(originalPost.id)

          // Fetch all posts to find the shared post
          const allPosts = await apiService.getPosts()
          const sharedPost = allPosts.find(p => p.sharedFromId === originalPost.id && p.userId === sharingUser.id)

          // Verify shared post was created
          expect(sharedPost).toBeDefined()
          
          if (!sharedPost) {
            throw new Error('Shared post was not created')
          }
          
          expect(sharedPost.sharedFromId).toBe(originalPost.id)
          expect(sharedPost.userId).toBe(sharingUser.id)

          // Simulate what PostCard does when rendering a shared post
          // It should load both the sharing user and the original post/author
          const fetchedSharingUser = await apiService.getUserById(sharedPost.userId)
          const fetchedOriginalPost = await apiService.getPostById(sharedPost.sharedFromId!)
          const fetchedOriginalAuthor = await apiService.getUserById(fetchedOriginalPost.userId)

          // Property: Shared post rendering should include both users' information
          // According to Requirement 9.3, the rendered output must show:
          // 1. The sharing user's information (who shared it)
          // 2. The original post's content and author

          // Verify sharing user information is available
          expect(fetchedSharingUser.id).toBe(sharingUser.id)
          expect(fetchedSharingUser.name).toBe(uniqueSharingUserData.name)
          expect(fetchedSharingUser.avatar).toBeDefined()

          // Verify original post content is available
          expect(fetchedOriginalPost.id).toBe(originalPost.id)
          expect(fetchedOriginalPost.title).toBe(postData.title)
          expect(fetchedOriginalPost.content).toBe(postData.content)
          expect(fetchedOriginalPost.image).toBe(postData.image || '')

          // Verify original author information is available
          expect(fetchedOriginalAuthor.id).toBe(originalAuthor.id)
          expect(fetchedOriginalAuthor.name).toBe(uniqueOriginalAuthorData.name)
          expect(fetchedOriginalAuthor.avatar).toBeDefined()

          // The PostCard component should display:
          // - sharingUser.name in the header ("X shared this post")
          // - originalAuthor.name and avatar as the post author
          // - originalPost.title, content, and image as the post content

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
            await apiService['axiosInstance'].delete(`/users/${originalAuthor.id}`)
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
      { numRuns: 100, timeout: 30000 }
    )
  }, 120000)

  // Feature: blog-management, Property 7: Post ownership controls visibility of actions
  it('Property 7: Post ownership controls visibility of actions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different users: one who creates the post, one who views it
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
        fc.boolean(), // Whether the viewer is the owner
        async (postOwnerData, viewerData, postData, viewerIsOwner) => {
          // Make emails unique by adding timestamp
          const uniquePostOwnerData = {
            ...postOwnerData,
            email: `${Date.now()}-owner-${postOwnerData.email}`
          }
          
          const uniqueViewerData = {
            ...viewerData,
            email: `${Date.now()}-viewer-${viewerData.email}`
          }
          
          // Create the post owner user
          const postOwner = await apiService.createUser(uniquePostOwnerData)
          
          // Create the viewer user (only if viewer is not the owner)
          let viewer: User
          if (viewerIsOwner) {
            viewer = postOwner
          } else {
            viewer = await apiService.createUser(uniqueViewerData)
          }

          // Login as post owner and create a post
          const { login: loginOwner } = useAuth()
          await loginOwner(uniquePostOwnerData.email, uniquePostOwnerData.password)
          
          const createdPost = await apiService.createPost({
            ...postData,
            userId: postOwner.id
          })

          // Logout and login as the viewer
          const { logout, login: loginViewer, currentUser } = useAuth()
          logout()
          
          if (viewerIsOwner) {
            await loginViewer(uniquePostOwnerData.email, uniquePostOwnerData.password)
          } else {
            await loginViewer(uniqueViewerData.email, uniqueViewerData.password)
          }

          // Test the ownership logic: currentUser.id should match post.userId for owner
          const isOwner = currentUser.value?.id === createdPost.userId

          // Property: isOwner should be true if and only if viewer is the owner
          expect(isOwner).toBe(viewerIsOwner)

          // Verify the logic matches the requirement:
          // Edit and delete buttons should be visible if and only if post.userId matches authenticated user's ID
          if (viewerIsOwner) {
            // Viewer is the owner: isOwner should be true
            expect(isOwner).toBe(true)
            expect(currentUser.value?.id).toBe(createdPost.userId)
          } else {
            // Viewer is not the owner: isOwner should be false
            expect(isOwner).toBe(false)
            expect(currentUser.value?.id).not.toBe(createdPost.userId)
          }

          // Clean up
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${postOwner.id}`)
          if (!viewerIsOwner) {
            await apiService['axiosInstance'].delete(`/users/${viewer.id}`)
          }
        }
      ),
      { numRuns: 100, timeout: 20000 }
    )
  }, 300000)

  // Feature: blog-management, Property 24: Comment input visible for authenticated users
  it('Property 24: Comment input visible for authenticated users', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate user data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0)
        }),
        // Generate post data
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 5000 }).filter((s: string) => s.trim().length > 0),
          image: fc.option(fc.webUrl(), { nil: undefined })
        }),
        fc.boolean(), // Whether user is authenticated
        async (userData, postData, isAuthenticated) => {
          // Make email unique
          const uniqueUserData = {
            ...userData,
            email: `${Date.now()}-${Math.random()}-${userData.email}`
          }
          
          // Create user
          const user = await apiService.createUser(uniqueUserData)
          
          // Create post
          const createdPost = await apiService.createPost({
            ...postData,
            userId: user.id
          })

          // Authenticate or not based on the boolean
          const { login, logout, currentUser } = useAuth()
          if (isAuthenticated) {
            await login(uniqueUserData.email, uniqueUserData.password)
          } else {
            logout()
          }

          // Property: Comment input field should be visible if and only if user is authenticated
          // According to Requirement 10.1: "WHEN an authenticated user views a post in the news feed 
          // THEN the Blog System SHALL display a comment input field directly below the post"
          
          // The PostCard component uses v-if="currentUser" to conditionally render CommentForm
          // So we verify that currentUser exists if and only if the user is authenticated
          
          if (isAuthenticated) {
            // User is authenticated: currentUser should exist
            expect(currentUser.value).not.toBeNull()
            expect(currentUser.value?.id).toBe(user.id)
            // In the actual component, CommentForm would be rendered because v-if="currentUser" is true
          } else {
            // User is not authenticated: currentUser should be null
            expect(currentUser.value).toBeNull()
            // In the actual component, CommentForm would NOT be rendered because v-if="currentUser" is false
          }

          // Clean up
          await apiService.deletePost(createdPost.id)
          await apiService['axiosInstance'].delete(`/users/${user.id}`)
        }
      ),
      { numRuns: 100, timeout: 20000 }
    )
  }, 300000)
})
