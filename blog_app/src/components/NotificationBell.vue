<template>
  <div class="notification-bell-container">
    <button 
      class="notification-bell-btn"
      @click="toggleDropdown"
      :title="unreadCount > 0 ? `${unreadCount} thông báo mới` : 'Thông báo'"
    >
      <img src="../assets/img/bell.png" alt="Notification" class="bell-icon-img" />
      <span v-if="unreadCount > 0" class="notification-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown Menu -->
    <div v-if="showDropdown" class="notification-dropdown">
      <div class="dropdown-header">
        <h6 class="mb-0">🎄 Thông báo</h6>
        <button 
          v-if="unreadCount > 0"
          @click="handleMarkAllAsRead"
          class="mark-all-btn"
        >
          Đánh dấu đã đọc
        </button>
      </div>

      <div class="dropdown-body">
        <div v-if="loading" class="text-center py-3">
          <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>

        <div v-else-if="notifications.length === 0" class="empty-state">
          <span class="empty-icon">🎅</span>
          <p>Chưa có thông báo nào</p>
        </div>

        <div v-else class="notification-list">
          <div
            v-for="notification in notifications.slice(0, 10)"
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              {{ getNotificationIcon(notification.type) }}
            </div>
            <div class="notification-content">
              <p class="notification-text">{{ getNotificationText(notification) }}</p>
              <small class="notification-time">{{ formatTime(notification.createdAt) }}</small>
            </div>
            <button 
              class="delete-btn"
              @click.stop="handleDelete(notification.id)"
              title="Xóa thông báo"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div v-if="notifications.length > 10" class="dropdown-footer">
        <router-link to="/notifications" class="view-all-link" @click="showDropdown = false">
          Xem tất cả thông báo
        </router-link>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="showDropdown" class="dropdown-backdrop" @click="showDropdown = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '../composables/useNotifications'
import type { Notification } from '../types'

const router = useRouter()
const {
  notifications,
  unreadCount,
  loading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationText,
  getNotificationIcon
} = useNotifications()

const showDropdown = ref(false)
let pollInterval: number | null = null

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    fetchNotifications()
  }
}

const handleNotificationClick = async (notification: Notification) => {
  if (!notification.isRead) {
    await markAsRead(notification.id)
  }
  
  showDropdown.value = false
  
  // Navigate based on notification type
  switch (notification.type) {
    case 'like':
    case 'comment':
    case 'share':
      if (notification.postId) {
        router.push(`/posts/${notification.postId}`)
      }
      break
    case 'message':
      router.push('/messages')
      break
    case 'friend_request':
      router.push('/friends')
      break
  }
}

const handleMarkAllAsRead = async () => {
  await markAllAsRead()
}

const handleDelete = async (id: string) => {
  await deleteNotification(id)
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`
  
  return date.toLocaleDateString('vi-VN')
}

onMounted(() => {
  fetchNotifications()
  // Poll for new notifications every 30 seconds
  pollInterval = window.setInterval(() => {
    fetchNotifications()
  }, 30000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})
</script>

<style scoped>
.notification-bell-container {
  position: relative;
}

.notification-bell-btn {
  background: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.notification-bell-btn:hover {
  background: #f8f9fa;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.bell-icon {
  font-size: 1.4rem;
  animation: bellRing 2s ease-in-out infinite;
}

.bell-icon-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  animation: bellRing 2s ease-in-out infinite;
}

@keyframes bellRing {
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  30% { transform: rotate(10deg); }
  40% { transform: rotate(-10deg); }
  50% { transform: rotate(0deg); }
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: linear-gradient(135deg, #ff4444, #cc0000);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  box-shadow: 0 2px 8px rgba(255, 0, 0, 0.4);
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.notification-dropdown {
  position: absolute;
  top: 55px;
  right: 0;
  width: 360px;
  max-height: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1050;
  overflow: hidden;
  animation: dropdownSlide 0.3s ease;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #c41e3a, #165b33);
  color: white;
}

.dropdown-header h6 {
  font-weight: 700;
}

.mark-all-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mark-all-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dropdown-body {
  max-height: 360px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 10px;
}

.notification-list {
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.notification-item:hover {
  background: rgba(196, 30, 58, 0.05);
}

.notification-item.unread {
  background: rgba(196, 30, 58, 0.08);
  border-left: 3px solid #c41e3a;
}

.notification-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  margin: 0;
  font-size: 0.9rem;
  color: #333;
  line-height: 1.4;
}

.notification-time {
  color: #888;
  font-size: 0.75rem;
}

.delete-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 4px;
  opacity: 0;
  transition: all 0.2s ease;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #c41e3a;
}

.dropdown-footer {
  padding: 12px;
  text-align: center;
  border-top: 1px solid #eee;
}

.view-all-link {
  color: #c41e3a;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}

.view-all-link:hover {
  text-decoration: underline;
}

.dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1040;
}

/* Responsive */
@media (max-width: 576px) {
  .notification-dropdown {
    width: calc(100vw - 20px);
    right: -60px;
  }
}
</style>
