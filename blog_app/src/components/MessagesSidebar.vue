<template>
  <div v-if="currentUser" class="messages-sidebar">
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Messages</h5>
      </div>
      
      <!-- Loading state -->
      <div v-if="loading" class="card-body text-center py-4">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 mb-0 text-muted small">Loading...</p>
      </div>
      
      <!-- Empty state -->
      <div v-else-if="allFriendsWithConversations.length === 0" class="card-body text-center py-4">
        <p class="text-muted small mb-0">No friends yet. Add friends to start messaging!</p>
      </div>
      
      <!-- Friends list with conversations -->
      <div v-else class="list-group list-group-flush">
        <div
          v-for="friend in allFriendsWithConversations"
          :key="friend.userId"
          class="list-group-item list-group-item-action position-relative"
          @click="handleConversationClick(friend.userId)"
          style="cursor: pointer;"
        >
          <div class="d-flex align-items-center">
            <router-link 
              :to="`/profile/${friend.userId}`" 
              @click.stop
              class="text-decoration-none"
            >
              <img
                :src="friend.userAvatar"
                :alt="friend.userName"
                class="rounded-circle me-2"
                width="40"
                height="40"
              />
            </router-link>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-center">
                <router-link 
                  :to="`/profile/${friend.userId}`" 
                  @click.stop
                  class="text-decoration-none"
                >
                  <h6 class="mb-0 small fw-semibold text-dark">{{ friend.userName }}</h6>
                </router-link>
                <small v-if="friend.lastMessageTime" class="text-muted" style="font-size: 0.7rem;">
                  {{ formatTime(friend.lastMessageTime) }}
                </small>
              </div>
              <p v-if="friend.lastMessage" class="mb-0 text-muted small text-truncate">
                {{ friend.lastMessage }}
              </p>
              <p v-else class="mb-0 text-muted small fst-italic">
                Start a conversation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useMessages } from '../composables/useMessages'
import { useFriends } from '../composables/useFriends'
import { useChatPopups } from '../composables/useChatPopups'
import { apiService } from '../services/apiService'
import type { Conversation } from '../types'

const { currentUser } = useAuth()
const { conversations, loading: messagesLoading, fetchConversations } = useMessages()
const { friends, loading: friendsLoading, fetchFriends } = useFriends()
const { openChatPopup } = useChatPopups()

let refreshInterval: number | null = null

const loading = computed(() => messagesLoading.value || friendsLoading.value)

// Combine friends with their conversation data
const allFriendsWithConversations = computed(() => {
  if (!friends.value.length) return []

  return friends.value.map(friend => {
    // Find existing conversation with this friend
    const conversation = conversations.value.find(c => c.userId === friend.id)
    
    if (conversation) {
      return conversation
    } else {
      // Create a placeholder conversation for friends without messages
      return {
        userId: friend.id,
        userName: friend.name,
        userAvatar: friend.avatar,
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0
      } as Conversation
    }
  }).sort((a, b) => {
    // Sort by last message time, friends without messages go to bottom
    if (!a.lastMessageTime) return 1
    if (!b.lastMessageTime) return -1
    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  })
})

// Format time for display
const formatTime = (timestamp: string) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

// Handle conversation click - open chat popup
const handleConversationClick = async (userId: string) => {
  try {
    // Fetch user details
    const user = await apiService.getUserById(userId)
    
    // Fetch messages
    const messages = await apiService.getMessagesBetweenUsers(
      currentUser.value!.id,
      userId
    )
    
    // Sort messages
    const sortedMessages = messages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    // Open chat popup
    openChatPopup(user, userId, sortedMessages)
  } catch (error) {
    console.error('Failed to open chat:', error)
  }
}

// Load conversations and friends
const loadData = async () => {
  if (currentUser.value) {
    await Promise.all([
      fetchConversations(),
      fetchFriends(currentUser.value.id)
    ])
  }
}

// Start auto-refresh for conversations
const startAutoRefresh = () => {
  // Refresh every 5 seconds
  refreshInterval = window.setInterval(() => {
    loadData()
  }, 5000)
}

// Stop auto-refresh
const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Load data on mount
onMounted(async () => {
  await loadData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.messages-sidebar {
  position: sticky;
  top: 20px;
}

.card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background-color: #fff;
  border-bottom: 1px solid #dee2e6;
}

.list-group-flush {
  max-height: 500px;
  overflow-y: auto;
}

/* Custom scrollbar for webkit browsers */
.list-group-flush::-webkit-scrollbar {
  width: 6px;
}

.list-group-flush::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.list-group-flush::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.list-group-flush::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
