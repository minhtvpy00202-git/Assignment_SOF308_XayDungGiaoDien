<template>
  <div class="message-search">
    <!-- Search Input -->
    <div class="search-input-container">
      <div class="input-group">
        <span class="input-group-text">
          <i class="bi bi-search"></i>
        </span>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          class="form-control"
          :placeholder="t('messages.searchMessages')"
          @input="handleSearch"
          @focus="showDropdown = true"
          @blur="handleBlur"
          @keydown="handleKeydown"
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

    <!-- Search Results Dropdown -->
    <div
      v-if="showDropdown && (searchResults.length > 0 || isSearching)"
      class="search-dropdown"
      @mousedown.prevent
    >
      <!-- Loading -->
      <div v-if="isSearching" class="search-loading">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        {{ t('search.searching') }}
      </div>

      <!-- Results -->
      <div v-else-if="searchResults.length > 0" class="search-results">
        <div
          v-for="(result, index) in searchResults"
          :key="`${result.type}-${result.id}`"
          class="search-result-item"
          :class="{ 'selected': selectedIndex === index }"
          @click="selectResult(result)"
          @mouseenter="selectedIndex = index"
        >
          <!-- User Result -->
          <div v-if="result.type === 'user'" class="d-flex align-items-center">
            <img
              :src="result.avatar || ''"
              :alt="result.name || ''"
              class="rounded-circle me-2"
              width="32"
              height="32"
            />
            <div class="flex-grow-1">
              <div class="fw-semibold small">{{ result.name }}</div>
              <div class="text-muted small">{{ t('messages.user') }}</div>
            </div>
          </div>

          <!-- Message Result -->
          <div v-else-if="result.type === 'message'" class="d-flex align-items-center">
            <img
              :src="result.senderAvatar || ''"
              :alt="result.senderName || ''"
              class="rounded-circle me-2"
              width="32"
              height="32"
            />
            <div class="flex-grow-1">
              <div class="fw-semibold small">{{ result.senderName }}</div>
              <div class="text-muted small text-truncate" v-html="highlightMatch(result.content || '', searchQuery)">
              </div>
              <div class="text-muted" style="font-size: 0.7rem">
                {{ formatTime(result.createdAt || '') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else class="search-no-results">
        <i class="bi bi-search text-muted"></i>
        <p class="mb-0 text-muted small">{{ t('search.noResults', { query: searchQuery }) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'
import { useFriends } from '../composables/useFriends'
import { apiService } from '../services/apiService'
import type { Message } from '../types'

interface MessageSearchResult {
  id: string
  type: 'user' | 'message'
  name?: string
  avatar?: string
  content?: string
  senderName?: string
  senderAvatar?: string
  createdAt?: string
  userId?: string
  senderId?: string
  receiverId?: string
}

interface Emits {
  (e: 'selectUser', userId: string): void
  (e: 'selectMessage', result: MessageSearchResult): void
}

const emit = defineEmits<Emits>()

const { currentUser } = useAuth()
const { t } = useLocale()
const { friends } = useFriends()

const searchInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const showDropdown = ref(false)
const isSearching = ref(false)
const searchResults = ref<MessageSearchResult[]>([])
const selectedIndex = ref(-1)

let searchTimeout: number | null = null

// Handle search input
const handleSearch = async () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!searchQuery.value.trim()) {
    searchResults.value = []
    showDropdown.value = false
    return
  }

  searchTimeout = window.setTimeout(async () => {
    await performSearch()
  }, 300) // Debounce 300ms
}

// Perform search
const performSearch = async () => {
  if (!searchQuery.value.trim() || !currentUser.value) return

  isSearching.value = true
  searchResults.value = []

  try {
    const query = searchQuery.value.toLowerCase().trim()
    const results: MessageSearchResult[] = []

    // Search users (friends)
    const userResults = friends.value
      .filter(friend => 
        friend.name.toLowerCase().includes(query) ||
        friend.email.toLowerCase().includes(query)
      )
      .slice(0, 5) // Limit to 5 users
      .map(friend => ({
        id: friend.id,
        type: 'user' as const,
        name: friend.name,
        avatar: friend.avatar,
        userId: friend.id
      }))

    results.push(...userResults)

    // Search messages
    const messageResults = await searchMessages(query)
    results.push(...messageResults.slice(0, 10)) // Limit to 10 messages

    searchResults.value = results
    selectedIndex.value = -1
  } catch (error) {
    console.error('Search failed:', error)
  } finally {
    isSearching.value = false
  }
}

// Search messages
const searchMessages = async (query: string): Promise<MessageSearchResult[]> => {
  if (!currentUser.value) return []

  try {
    // Get all messages for current user
    const allMessages: Message[] = []
    
    // Get messages with each friend
    for (const friend of friends.value) {
      try {
        const messages = await apiService.getMessagesBetweenUsers(
          currentUser.value.id,
          friend.id
        )
        allMessages.push(...messages)
      } catch (error) {
        console.error(`Failed to get messages with ${friend.name}:`, error)
      }
    }

    // Filter messages by query
    const filteredMessages = allMessages
      .filter(message => 
        message.content.toLowerCase().includes(query)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Convert to search results
    const messageResults: MessageSearchResult[] = []
    
    for (const message of filteredMessages) {
      const sender = friends.value.find(f => f.id === message.senderId) || 
                    (message.senderId === currentUser.value!.id ? currentUser.value : null)
      
      if (sender) {
        messageResults.push({
          id: message.id,
          type: 'message',
          content: message.content,
          senderName: sender.name,
          senderAvatar: sender.avatar,
          createdAt: message.createdAt,
          senderId: message.senderId,
          receiverId: message.receiverId,
          userId: message.senderId === currentUser.value!.id ? message.receiverId : message.senderId
        })
      }
    }

    return messageResults
  } catch (error) {
    console.error('Failed to search messages:', error)
    return []
  }
}

// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value || searchResults.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0 && selectedIndex.value < searchResults.value.length) {
        const selectedResult = searchResults.value[selectedIndex.value]
        if (selectedResult) {
          selectResult(selectedResult)
        }
      }
      break
    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      searchInput.value?.blur()
      break
  }
}

// Handle blur
const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

// Select result
const selectResult = async (result: MessageSearchResult) => {
  showDropdown.value = false
  
  if (result.type === 'user' && result.userId) {
    emit('selectUser', result.userId)
  } else if (result.type === 'message') {
    emit('selectMessage', result)
  }
}

// Clear search
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  showDropdown.value = false
  selectedIndex.value = -1
}

// Highlight match in text
const highlightMatch = (text: string, query: string) => {
  if (!query.trim() || !text) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Format time
const formatTime = (timestamp: string) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

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

// Focus search input
const focus = () => {
  nextTick(() => {
    searchInput.value?.focus()
  })
}

defineExpose({
  focus,
  clearSearch
})
</script>

<style scoped>
.message-search {
  position: relative;
  margin-bottom: 1rem;
}

.search-input-container {
  position: relative;
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

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.search-loading {
  padding: 1rem;
  text-align: center;
  color: #6c757d;
  font-size: 0.875rem;
}

.search-results {
  padding: 0.5rem 0;
}

.search-result-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.search-result-item:hover,
.search-result-item.selected {
  background-color: #f8f9fa;
}

.search-no-results {
  padding: 2rem 1rem;
  text-align: center;
  color: #6c757d;
}

.search-no-results i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
}

/* Custom scrollbar */
.search-dropdown::-webkit-scrollbar {
  width: 6px;
}

.search-dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.search-dropdown::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.search-dropdown::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Highlight matches */
:deep(mark) {
  background-color: #fff3cd;
  padding: 0;
  border-radius: 2px;
}
</style>