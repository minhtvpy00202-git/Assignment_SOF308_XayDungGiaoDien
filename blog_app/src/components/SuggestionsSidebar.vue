<template>
  <div v-if="currentUser" class="suggestions-sidebar">
    <!-- Friend Requests Section -->
    <div v-if="friendRequests.length > 0" class="card mb-3">
      <div class="card-header bg-white">
        <h6 class="mb-0">Friend Requests</h6>
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
              Accept
            </button>
            <button
              class="btn btn-sm btn-outline-secondary flex-grow-1"
              @click="handleRejectRequest(request.id)"
              :disabled="loading"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Suggestions Section -->
    <div class="card">
      <div class="card-header bg-white">
        <h6 class="mb-0">Suggestions</h6>
      </div>
      
      <!-- Loading state -->
      <div v-if="loading && suggestedUsers.length === 0" class="card-body text-center py-4">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-else-if="suggestedUsers.length === 0" class="card-body text-center py-4">
        <p class="text-muted small mb-0">No suggestions available</p>
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
            Add Friend
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useFriends } from '../composables/useFriends'
import { apiService } from '../services/apiService'
import type { FriendRequest, User } from '../types'

const { currentUser } = useAuth()
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
  top: 20px;
}

.card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  border-bottom: 1px solid #dee2e6;
  padding: 0.75rem 1rem;
}

.list-group-flush {
  max-height: 500px;
  overflow-y: auto;
}

.list-group-item {
  padding: 0.75rem 1rem;
}

.rounded-circle {
  object-fit: cover;
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
