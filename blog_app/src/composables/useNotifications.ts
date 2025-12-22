import { ref, computed } from 'vue'
import type { Notification, CreateNotificationData, User } from '../types'
import { apiService } from '../services/apiService'
import { useAuth } from './useAuth'

const notifications = ref<Notification[]>([])
const users = ref<Record<string, User>>({})
const loading = ref(false)
const lastFetchTime = ref(0)

export function useNotifications() {
  const { currentUser } = useAuth()

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.isRead).length
  })

  const sortedNotifications = computed(() => {
    return [...notifications.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  })

  const fetchNotifications = async () => {
    if (!currentUser.value) return
    
    loading.value = true
    try {
      // Fetch notifications for current user
      const response = await apiService.getNotificationsByUserId(currentUser.value.id)
      notifications.value = response

      // Fetch user info for each notification
      const userIds = [...new Set(response.map(n => n.fromUserId))]
      for (const userId of userIds) {
        if (!users.value[userId]) {
          try {
            const user = await apiService.getUserById(userId)
            users.value[userId] = user
          } catch {
            // User might not exist
          }
        }
      }
      
      lastFetchTime.value = Date.now()
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      loading.value = false
    }
  }

  const createNotification = async (data: CreateNotificationData) => {
    try {
      const notification = await apiService.createNotification(data)
      // Don't add to local state - it's for another user
      return notification
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId)
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.isRead = true
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!currentUser.value) return
    
    try {
      const unreadNotifications = notifications.value.filter(n => !n.isRead)
      await Promise.all(
        unreadNotifications.map(n => apiService.markNotificationAsRead(n.id))
      )
      notifications.value.forEach(n => {
        n.isRead = true
      })
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiService.deleteNotification(notificationId)
      notifications.value = notifications.value.filter(n => n.id !== notificationId)
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getUser = (userId: string): User | undefined => {
    return users.value[userId]
  }

  const getNotificationText = (notification: Notification): string => {
    const user = users.value[notification.fromUserId]
    const userName = user?.name || 'Ai đó'
    
    switch (notification.type) {
      case 'like':
        return `${userName} đã thích bài viết của bạn`
      case 'comment':
        return `${userName} đã bình luận bài viết của bạn`
      case 'share':
        return `${userName} đã chia sẻ bài viết của bạn`
      case 'message':
        return `${userName} đã gửi tin nhắn cho bạn`
      case 'friend_request':
        return `${userName} đã gửi lời mời kết bạn`
      default:
        return 'Bạn có thông báo mới'
    }
  }

  const getNotificationIcon = (type: Notification['type']): string => {
    switch (type) {
      case 'like':
        return '❤️'
      case 'comment':
        return '💬'
      case 'share':
        return '🔄'
      case 'message':
        return '✉️'
      case 'friend_request':
        return '👋'
      default:
        return '🔔'
    }
  }

  return {
    notifications: sortedNotifications,
    unreadCount,
    loading,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUser,
    getNotificationText,
    getNotificationIcon
  }
}
