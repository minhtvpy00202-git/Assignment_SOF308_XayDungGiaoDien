<template>
  <div v-if="currentUser" class="suggestions-sidebar">
    <!-- Friend Requests Section -->
    <div v-if="friendRequests.length > 0" class="card mb-3">
      <div class="card-header bg-white">
        <h6 class="mb-0">{{ t('friends.friendRequests') }}</h6>
      </div>
      <div class="list-group list-group-flush">
        <div
          v-for="request in friendRequestsWithUsers"
          :key="request.id"
          class="list-group-item"
        >
          <router-link 
            :to="`/profile/${request.senderId}`" 
            class="d-flex align-items-center mb-2 text-decoration-none"
          >
            <img
              :src="request.senderUser?.avatar"
              :alt="request.senderUser?.name"
              class="rounded-circle me-2"
              width="40"
              height="40"
            />
            <div class="flex-grow-1">
              <div class="fw-semibold small text-dark">{{ request.senderUser?.name }}</div>
            </div>
          </router-link>
          <div class="d-flex gap-2">
            <button
              class="btn btn-sm btn-primary flex-grow-1"
              @click="handleAcceptRequest(request)"
              :disabled="loading"
            >
              {{ t('friends.accept') }}
            </button>
            <button
              class="btn btn-sm btn-outline-secondary flex-grow-1"
              @click="handleRejectRequest(request.id)"
              :disabled="loading"
            >
              {{ t('friends.reject') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Suggestions Section -->
    <div class="card">
      <div class="card-header bg-white">
        <h6 class="mb-0">{{ t('suggestions.suggestions') }}</h6>
      </div>
      
      <!-- Loading state -->
      <div v-if="loading && suggestedUsers.length === 0" class="card-body text-center py-4">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
          <span class="visually-hidden">{{ t('common.loading') }}</span>
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-else-if="suggestedUsers.length === 0" class="card-body text-center py-4">
        <p class="text-muted small mb-0">{{ t('suggestions.noSuggestions') }}</p>
      </div>
      
      <!-- Suggestions list -->
      <div v-else class="list-group list-group-flush">
        <div
          v-for="user in suggestedUsers"
          :key="user.id"
          class="list-group-item"
        >
          <router-link 
            :to="`/profile/${user.id}`" 
            class="d-flex align-items-center mb-2 text-decoration-none"
          >
            <img
              :src="user.avatar"
              :alt="user.name"
              class="rounded-circle me-2"
              width="40"
              height="40"
            />
            <div class="flex-grow-1">
              <div class="fw-semibold small text-dark">{{ user.name }}</div>
              <div class="text-muted" style="font-size: 0.75rem;">{{ user.intro?.substring(0, 30) }}...</div>
            </div>
          </router-link>
          <button
            class="btn btn-sm btn-outline-primary w-100"
            @click="handleSendRequest(user.id)"
            :disabled="loading"
          >
            {{ t('suggestions.addFriend') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useFriends } from '../composables/useFriends'
import { useLocale } from '../composables/useLocale'
import { apiService } from '../services/apiService'
import type { FriendRequest, User } from '../types'

const { currentUser } = useAuth()
const { t } = useLocale()
const {
  suggestedUsers,
  friendRequests,
  loading,
  fetchSuggestedUsers,
  fetchFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest
} = useFriends()

const friendRequestsWithUsers = ref<Array<FriendRequest & { senderUser?: User }>>([])

// Load friend requests with user data
const loadFriendRequestsWithUsers = async () => {
  if (!currentUser.value) return

  await fetchFriendRequests(currentUser.value.id)
  
  // Fetch sender user data for each request
  const requestsWithUsers = await Promise.all(
    friendRequests.value.map(async (request) => {
      try {
        const senderUser = await apiService.getUserById(request.senderId)
        return { ...request, senderUser }
      } catch (error) {
        console.error('Failed to load sender user:', error)
        return request
      }
    })
  )
  
  friendRequestsWithUsers.value = requestsWithUsers
}

const handleSendRequest = async (receiverId: string) => {
  if (!currentUser.value) return
  
  try {
    await sendFriendRequest(currentUser.value.id, receiverId)
  } catch (error) {
    alert('Failed to send friend request')
  }
}

const handleAcceptRequest = async (request: FriendRequest) => {
  if (!currentUser.value) return
  
  try {
    await acceptFriendRequest(request, currentUser.value.id)
    // Reload friend requests
    await loadFriendRequestsWithUsers()
  } catch (error) {
    alert('Failed to accept friend request')
  }
}

const handleRejectRequest = async (requestId: string) => {
  if (!currentUser.value) return
  
  try {
    await rejectFriendRequest(requestId, currentUser.value.id)
    // Reload friend requests
    await loadFriendRequestsWithUsers()
  } catch (error) {
    alert('Failed to reject friend request')
  }
}

onMounted(async () => {
  if (currentUser.value) {
    await Promise.all([
      fetchSuggestedUsers(currentUser.value.id),
      loadFriendRequestsWithUsers()
    ])
  }
})
</script>

<style scoped>
.suggestions-sidebar {
  position: sticky;
  top: 100px;
}

.card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-header {
  border-bottom: 1px solid rgba(222, 226, 230, 0.3);
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 249, 250, 0.8));
  border-radius: 20px 20px 0 0;
}

.list-group-flush {
  max-height: 500px;
  overflow-y: auto;
}

.list-group-item {
  padding: 1rem 1.25rem;
  border: none;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 12px;
  margin: 0.25rem 0.5rem;
}

.list-group-item:hover {
  background: rgba(24, 119, 242, 0.05);
  transform: translateX(4px);
}

.rounded-circle {
  object-fit: cover;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.rounded-circle:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 24px rgba(24, 119, 242, 0.3);
  border-color: #1877F2;
}

/* Custom scrollbar */
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
