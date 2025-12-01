import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { useUser } from '../useUser'
import { apiService } from '../../services/apiService'
import type { UpdateUserData } from '../../types'

describe('useUser Property Tests', () => {
  beforeAll(async () => {
    // Wait for JSON server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  beforeEach(async () => {
    // Clear all users before each test
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

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear()
  })

  // Feature: blog-management, Property 13: Profile updates persist correctly
  it('Property 13: Profile updates persist correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial user data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0),
          avatar: fc.webUrl(),
          intro: fc.string({ minLength: 0, maxLength: 500 })
        }),
        // Generate update data - at least one field should be updated
        fc.record({
          name: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length > 0), { nil: undefined }),
          email: fc.option(fc.emailAddress(), { nil: undefined }),
          password: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter((s: string) => s.trim().length > 0), { nil: undefined }),
          avatar: fc.option(fc.webUrl(), { nil: undefined }),
          intro: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined })
        }).filter((updateData: UpdateUserData) => {
          // Ensure at least one field is being updated
          return updateData.name !== undefined || 
                 updateData.email !== undefined || 
                 updateData.password !== undefined || 
                 updateData.avatar !== undefined || 
                 updateData.intro !== undefined
        }),
        async (initialUserData, updateData: UpdateUserData) => {
          // Make email unique by adding timestamp
          const uniqueUserData = {
            ...initialUserData,
            email: `${Date.now()}-${Math.random()}-${initialUserData.email}`
          }
          
          // Create a user first
          const createdUser = await apiService.createUser(uniqueUserData)
          
          // Update the user using useUser composable
          const { updateUser, fetchUserById, user } = useUser()
          await updateUser(createdUser.id, updateData)
          
          // Fetch the user again to verify persistence
          await fetchUserById(createdUser.id)
          
          // Verify that the updates were persisted correctly
          expect(user.value).not.toBeNull()
          
          if (updateData.name !== undefined) {
            expect(user.value!.name).toBe(updateData.name)
          } else {
            expect(user.value!.name).toBe(createdUser.name)
          }
          
          if (updateData.email !== undefined) {
            expect(user.value!.email).toBe(updateData.email)
          } else {
            expect(user.value!.email).toBe(createdUser.email)
          }
          
          if (updateData.password !== undefined) {
            expect(user.value!.password).toBe(updateData.password)
          } else {
            expect(user.value!.password).toBe(createdUser.password)
          }
          
          if (updateData.avatar !== undefined) {
            expect(user.value!.avatar).toBe(updateData.avatar)
          } else {
            expect(user.value!.avatar).toBe(createdUser.avatar)
          }
          
          if (updateData.intro !== undefined) {
            expect(user.value!.intro).toBe(updateData.intro)
          } else {
            expect(user.value!.intro).toBe(createdUser.intro)
          }
        }
      ),
      { numRuns: 10 }
    )
  }, 30000) // 30 second timeout
})
