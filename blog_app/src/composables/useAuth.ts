import { ref, readonly, type Ref } from 'vue'
import type { User, CreateUserData } from '../types'
import { apiService } from '../services/apiService'

const currentUser: Ref<User | null> = ref(null)
const isAuthenticated: Ref<boolean> = ref(false)

export function useAuth() {
  const login = async (email: string, password: string): Promise<void> => {
    try {
      // Fetch all users and find matching email
      const users = await apiService.getUsers()
      const user = users.find(u => u.email === email)

      if (!user) {
        throw new Error('Invalid email or password')
      }

      // Compare passwords (plain text in this simple implementation)
      if (user.password !== password) {
        throw new Error('Invalid email or password')
      }

      // Store authentication token (userId) in localStorage
      localStorage.setItem('authToken', user.id)
      localStorage.setItem('authUser', JSON.stringify(user))

      // Update reactive state
      currentUser.value = user
      isAuthenticated.value = true
    } catch (error) {
      currentUser.value = null
      isAuthenticated.value = false
      throw error
    }
  }

  const register = async (userData: CreateUserData): Promise<void> => {
    try {
      // Check if email already exists
      const users = await apiService.getUsers()
      const existingUser = users.find(u => u.email === userData.email)

      if (existingUser) {
        throw new Error('Email already exists')
      }

      // Create new user with default avatar and intro
      await apiService.createUser({
        ...userData,
        avatar: userData.avatar || 'https://via.placeholder.com/150',
        intro: userData.intro || ''
      })

      // Note: After registration, user needs to login separately
      // This follows the requirement that registration redirects to login page
    } catch (error) {
      throw error
    }
  }

  const logout = (): void => {
    // Remove authentication token from localStorage
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')

    // Update reactive state
    currentUser.value = null
    isAuthenticated.value = false
  }

  const checkAuth = (): void => {
    // Restore auth state from localStorage
    const token = localStorage.getItem('authToken')
    const userJson = localStorage.getItem('authUser')

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User
        currentUser.value = user
        isAuthenticated.value = true
      } catch (error) {
        // If parsing fails, clear invalid data
        logout()
      }
    } else {
      currentUser.value = null
      isAuthenticated.value = false
    }
  }

  return {
    currentUser: readonly(currentUser),
    isAuthenticated: readonly(isAuthenticated),
    login,
    register,
    logout,
    checkAuth
  }
}
