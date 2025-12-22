<template>
  <div v-if="currentUser" class="messages-sidebar">
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Messages</h5>
      </div>

      <!-- Search Box -->
      <div class="card-body p-3 border-bottom">
        <div class="search-container">
          <div class="input-group input-group-sm">
            <span class="input-group-text">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Search messages..."
              @input="handleSearch"
            />
            <button
              v-if="searchQuery"
              class="btn btn-outline-secondary"
              type="button"
              @click="clearSearch"
            >
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Initial loading only -->
      <div v-if="initialLoading" class="card-body text-center py-4">
        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
        <p class="mt-2 mb-0 text-muted small">Loading...</p>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="allFriendsWithConversations.length === 0"
        class="card-body text-center py-4"
      >
        <p class="text-muted small mb-0">
          No friends yet. Add friends to start messaging!
        </p>
      </div>

      <!-- Friends list -->
      <div v-else class="list-group list-group-flush">
        <div
          v-for="friend in filteredFriendsWithConversations"
          :key="friend.userId"
          class="list-group-item list-group-item-action"
          style="cursor: pointer"
          @click="handleConversationClick(friend.userId)"
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
                  <h6 class="mb-0 small fw-semibold text-dark" v-html="highlightMatch(friend.userName, searchQuery)">
                  </h6>
                </router-link>

                <small
                  v-if="friend.lastMessageTime"
                  class="text-muted"
                  style="font-size: 0.7rem"
                >
                  {{ formatTime(friend.lastMessageTime) }}
                </small>
              </div>

              <p
                v-if="friend.lastMessage"
                class="mb-0 text-muted small text-truncate"
                v-html="highlightMatch(friend.lastMessage, searchQuery)"
              >
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
const { conversations, fetchConversations } = useMessages()
const { friends, fetchFriends } = useFriends()
const { openChatPopup } = useChatPopups()

const initialLoading = ref(true)
const searchQuery = ref('')
let refreshInterval: number | null = null

/* ===== Combine friends + conversations ===== */
const allFriendsWithConversations = computed<Conversation[]>(() => {
  if (!friends.value.length) return []

  return friends.value
    .map(friend => {
      const conversation = conversations.value.find(
        c => c.userId === friend.id
      )

      return (
        conversation || {
          userId: friend.id,
          userName: friend.name,
          userAvatar: friend.avatar,
          lastMessage: '',
          lastMessageTime: '',
          unreadCount: 0
        }
      )
    })
    .sort((a, b) => {
      if (!a.lastMessageTime) return 1
      if (!b.lastMessageTime) return -1
      return (
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime()
      )
    })
})

/* ===== Filtered conversations based on search query ===== */
const filteredFriendsWithConversations = computed(() => {
  if (!searchQuery.value.trim()) {
    return allFriendsWithConversations.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return allFriendsWithConversations.value.filter(friend => {
    // Search by user name
    const nameMatch = friend.userName.toLowerCase().includes(query)
    // Search by message content
    const messageMatch = friend.lastMessage.toLowerCase().includes(query)
    
    return nameMatch || messageMatch
  })
})

/* ===== Handle search input ===== */
const handleSearch = () => {
  // The filtering is handled by the computed property
  // This function can be used for additional search logic if needed
}

/* ===== Clear search ===== */
const clearSearch = () => {
  searchQuery.value = ''
}

/* ===== Highlight matching text ===== */
const highlightMatch = (text: string, query: string) => {
  if (!query.trim() || !text) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/* ===== Format time ===== */
const formatTime = (timestamp: string) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffHours =
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  return diffHours < 24
    ? date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
}

/* ===== Click conversation ===== */
const handleConversationClick = async (userId: string) => {
  try {
    const user = await apiService.getUserById(userId)
    const messages = await apiService.getMessagesBetweenUsers(
      currentUser.value!.id,
      userId
    )

    openChatPopup(
      user,
      userId,
      messages.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      )
    )
  } catch (err) {
    console.error('Open chat failed:', err)
  }
}

/* ===== Load data ===== */
const loadInitialData = async () => {
  if (!currentUser.value) return

  initialLoading.value = true

  await Promise.all([
    fetchFriends(currentUser.value.id),
    fetchConversations()
  ])

  initialLoading.value = false
}

/* ===== Auto refresh (silent) ===== */
const startAutoRefresh = () => {
  stopAutoRefresh()
  refreshInterval = window.setInterval(() => {
    fetchConversations() // silent refresh
  }, 5000)
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

/* ===== Lifecycle ===== */
onMounted(async () => {
  await loadInitialData()
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
  min-height: 433px;
}

.card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background-color: #fff;
  border-bottom: 1px solid #dee2e6;
}

.search-container {
  margin-bottom: 0;
}

.input-group-text {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.form-control {
  border-color: #dee2e6;
  font-size: 0.875rem;
}

.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
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

/* Highlight matches */
:deep(mark) {
  background-color: #fff3cd;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 500;
}
</style>
