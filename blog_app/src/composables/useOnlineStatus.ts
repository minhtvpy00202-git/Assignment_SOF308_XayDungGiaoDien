import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from './useAuth'
import { apiService } from '../services/apiService'

export function useOnlineStatus() {
  const { currentUser } = useAuth()
  const isOnline = ref(navigator.onLine)
  let heartbeatInterval: number | null = null
  let beforeUnloadHandler: (() => void) | null = null

  // Update user online status
  const updateOnlineStatus = async (online: boolean) => {
    if (!currentUser.value) return

    try {
      if (online) {
        await apiService.setUserOnline(currentUser.value.id)
      } else {
        await apiService.setUserOffline(currentUser.value.id)
      }
    } catch (error) {
      console.error('Failed to update online status:', error)
    }
  }

  // Send heartbeat to keep user online
  const sendHeartbeat = async () => {
    if (!currentUser.value || !isOnline.value) return

    try {
      await apiService.setUserOnline(currentUser.value.id)
    } catch (error) {
      console.error('Failed to send heartbeat:', error)
    }
  }

  // Start heartbeat interval
  const startHeartbeat = () => {
    if (heartbeatInterval) return

    // Send heartbeat every 2 minutes
    heartbeatInterval = window.setInterval(sendHeartbeat, 2 * 60 * 1000)
  }

  // Stop heartbeat interval
  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }

  // Handle online/offline events
  const handleOnline = () => {
    isOnline.value = true
    updateOnlineStatus(true)
    startHeartbeat()
  }

  const handleOffline = () => {
    isOnline.value = false
    updateOnlineStatus(false)
    stopHeartbeat()
  }

  // Handle page unload
  const handleBeforeUnload = () => {
    if (currentUser.value) {
      // Use sendBeacon for reliable offline status update
      const data = JSON.stringify({
        isOnline: false,
        lastSeen: new Date().toISOString()
      })
      
      navigator.sendBeacon(
        `http://localhost:3000/users/${currentUser.value.id}`,
        data
      )
    }
  }

  // Initialize online status tracking
  const initializeOnlineStatus = () => {
    if (!currentUser.value) return

    // Set initial online status
    updateOnlineStatus(true)
    startHeartbeat()

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Handle page unload
    beforeUnloadHandler = handleBeforeUnload
    window.addEventListener('beforeunload', beforeUnloadHandler)
  }

  // Cleanup online status tracking
  const cleanupOnlineStatus = () => {
    stopHeartbeat()
    
    // Remove event listeners
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    
    if (beforeUnloadHandler) {
      window.removeEventListener('beforeunload', beforeUnloadHandler)
      beforeUnloadHandler = null
    }

    // Set user offline
    if (currentUser.value) {
      updateOnlineStatus(false)
    }
  }

  onMounted(() => {
    initializeOnlineStatus()
  })

  onUnmounted(() => {
    cleanupOnlineStatus()
  })

  return {
    isOnline,
    updateOnlineStatus,
    initializeOnlineStatus,
    cleanupOnlineStatus
  }
}