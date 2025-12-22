<template>
  <div class="conversations-page">
    <div class="container" style="padding-top: 100px;">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">{{ t('messages.messages') }}</h5>
            </div>
            
            <!-- Search Box -->
            <div class="card-body p-3 border-bottom">
              <div class="search-container">
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="bi bi-search"></i>
                  </span>
                  <input
                    v-model="searchQuery"
                    type="text"
                    class="form-control"
                    :placeholder="t('messages.searchMessages')"
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
            
            <div class="card-body p-0">
              <!-- Loading state -->
              <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">{{ t('common.loading') }}</span>
                </div>
              </div>

              <!-- Empty state -->
              <div v-else-if="conversations.length === 0" class="text-center py-5">
                <p class="text-muted">{{ t('messages.noFriends') }}</p>
              </div>

              <!-- Conversations list -->
              <div v-else class="list-group list-group-flush">
                <button
                  v-for="conversation in filteredConversations"
                  :key="conversation.userId"
                  class="list-group-item list-group-item-action d-flex align-items-center p-3"
                  @click="openChat(conversation)"
                >
                  <img
                    :src="conversation.userAvatar"
                    :alt="conversation.userName"
                    class="rounded-circle me-3"
                    width="50"
                    height="50"
                  />
                  <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                      <h6 class="mb-1">{{ conversation.userName }}</h6>
                      <small class="text-muted">{{ formatTime(conversation.lastMessageTime) }}</small>
                    </div>
                    <p class="mb-0 text-muted text-truncate" v-html="highlightMatch(conversation.lastMessage, searchQuery)"></p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useMessages } from '../composables/useMessages'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'
import { useChatPopups } from '../composables/useChatPopups'
import { apiService } from '../services/apiService'
import type { Conversation } from '../types'

const { conversations, loading, fetchConversations } = useMessages()
const { currentUser } = useAuth()
const { t } = useLocale()
const { openChatPopup } = useChatPopups()

const searchQuery = ref('')
let refreshInterval: number | null = null

// Filtered conversations based on search query
const filteredConversations = computed(() => {
  if (!searchQuery.value.trim()) {
    return conversations.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return conversations.value.filter(conversation => {
    // Search by user name
    const nameMatch = conversation.userName.toLowerCase().includes(query)
    // Search by message content
    const messageMatch = conversation.lastMessage.toLowerCase().includes(query)
    
    return nameMatch || messageMatch
  })
})

// Handle search input
const handleSearch = () => {
  // The filtering is handled by the computed property
  // This function can be used for additional search logic if needed
}

// Clear search
const clearSearch = () => {
  searchQuery.value = ''
}

// Highlight matching text
const highlightMatch = (text: string, query: string) => {
  if (!query.trim() || !text) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Format time for display
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút`
  if (diffHours < 24) return `${diffHours} giờ`
  if (diffDays < 7) return `${diffDays} ngày`
  
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

// Open chat popup when clicking a conversation
const openChat = async (conversation: Conversation) => {
  try {
    // Fetch user details
    const user = await apiService.getUserById(conversation.userId)
    
    // Fetch messages
    const messages = await apiService.getMessagesBetweenUsers(
      currentUser.value!.id,
      conversation.userId
    )
    
    // Sort messages
    const sortedMessages = messages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    // Open chat popup
    openChatPopup(user, conversation.userId, sortedMessages)
  } catch (error) {
    console.error('Failed to open chat:', error)
  }
}

// Auto-refresh conversations
const startAutoRefresh = () => {
  refreshInterval = window.setInterval(() => {
    fetchConversations()
  }, 5000)
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

onMounted(() => {
  fetchConversations()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.conversations-page {
  min-height: calc(100vh - 56px);
  background-color: #f0f2f5;
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

.list-group-item {
  border-left: none;
  border-right: none;
  transition: background-color 0.2s;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

.list-group-item:first-child {
  border-top: none;
}

.rounded-circle {
  object-fit: cover;
}

.text-truncate {
  max-width: 100%;
}

/* Highlight matches */
:deep(mark) {
  background-color: #fff3cd;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 500;
}
</style>
