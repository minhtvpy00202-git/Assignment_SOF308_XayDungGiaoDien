import { ref, readonly, type Ref } from 'vue'
import type { User, UpdateUserData } from '../types'
import { apiService } from '../services/apiService'

export function useUser() {
  const user: Ref<User | null> = ref(null)
  const loading: Ref<boolean> = ref(false)

  const fetchUserById = async (id: string): Promise<void> => {
    loading.value = true
    try {
      const fetchedUser = await apiService.getUserById(id)
      user.value = fetchedUser
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (id: string, userData: UpdateUserData): Promise<void> => {
    // Validate that at least one field is provided
    if (!userData.name && !userData.email && !userData.password && !userData.avatar && !userData.intro) {
      throw new Error('At least one field must be provided for update')
    }

    // Validate empty fields - reject empty or whitespace-only strings
    if (userData.name !== undefined && userData.name.trim() === '') {
      throw new Error('Name cannot be empty')
    }

    if (userData.email !== undefined && userData.email.trim() === '') {
      throw new Error('Email cannot be empty')
    }

    if (userData.password !== undefined && userData.password.trim() === '') {
      throw new Error('Password cannot be empty')
    }

    loading.value = true
    try {
      const updatedUser = await apiService.updateUser(id, userData)
      user.value = updatedUser

      // Update localStorage if this is the current authenticated user
      const authToken = localStorage.getItem('authToken')
      if (authToken === id) {
        localStorage.setItem('authUser', JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    fetchUserById,
    updateUser
  }
}
