import { ref } from 'vue'
import { friendService } from '../services/friendService'
import type { User, FriendRequest } from '../types'

export function useFriends() {
  const friends = ref<User[]>([])
  const suggestedUsers = ref<User[]>([])
  const friendRequests = ref<FriendRequest[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchFriends = async (userId: string) => {
    loading.value = true
    error.value = null
    try {
      friends.value = await friendService.getFriends(userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch friends'
      console.error('Error fetching friends:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchSuggestedUsers = async (userId: string) => {
    loading.value = true
    error.value = null
    try {
      suggestedUsers.value = await friendService.getSuggestedUsers(userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch suggested users'
      console.error('Error fetching suggested users:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchFriendRequests = async (userId: string) => {
    loading.value = true
    error.value = null
    try {
      friendRequests.value = await friendService.getFriendRequestsByReceiver(userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch friend requests'
      console.error('Error fetching friend requests:', err)
    } finally {
      loading.value = false
    }
  }

  const sendFriendRequest = async (senderId: string, receiverId: string) => {
    loading.value = true
    error.value = null
    try {
      await friendService.sendFriendRequest({ senderId, receiverId })
      // Refresh suggested users
      await fetchSuggestedUsers(senderId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send friend request'
      console.error('Error sending friend request:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const acceptFriendRequest = async (request: FriendRequest, currentUserId: string) => {
    loading.value = true
    error.value = null
    try {
      await friendService.acceptFriendRequest(
        request.id,
        request.senderId,
        request.receiverId
      )
      // Refresh data
      await Promise.all([
        fetchFriends(currentUserId),
        fetchFriendRequests(currentUserId)
      ])
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to accept friend request'
      console.error('Error accepting friend request:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const rejectFriendRequest = async (requestId: string, currentUserId: string) => {
    loading.value = true
    error.value = null
    try {
      await friendService.rejectFriendRequest(requestId)
      // Refresh friend requests
      await fetchFriendRequests(currentUserId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reject friend request'
      console.error('Error rejecting friend request:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const areFriends = async (userId1: string, userId2: string): Promise<boolean> => {
    try {
      return await friendService.areFriends(userId1, userId2)
    } catch (err) {
      console.error('Error checking friendship:', err)
      return false
    }
  }

  return {
    friends,
    suggestedUsers,
    friendRequests,
    loading,
    error,
    fetchFriends,
    fetchSuggestedUsers,
    fetchFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    areFriends
  }
}
