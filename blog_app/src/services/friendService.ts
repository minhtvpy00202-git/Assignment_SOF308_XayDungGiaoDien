import axios from 'axios'
import type { FriendRequest, Friendship, CreateFriendRequestData, User } from '../types'

const API_URL = 'http://localhost:3000'

export const friendService = {
  // Friend Requests
  async sendFriendRequest(data: CreateFriendRequestData): Promise<FriendRequest> {
    const response = await axios.post(`${API_URL}/friendRequests`, {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString()
    })
    return response.data
  },

  async getFriendRequestsByReceiver(receiverId: string): Promise<FriendRequest[]> {
    const response = await axios.get(`${API_URL}/friendRequests`, {
      params: {
        receiverId,
        status: 'pending'
      }
    })
    return response.data
  },

  async getFriendRequestsBySender(senderId: string): Promise<FriendRequest[]> {
    const response = await axios.get(`${API_URL}/friendRequests`, {
      params: {
        senderId
      }
    })
    return response.data
  },

  async acceptFriendRequest(requestId: string, userId1: string, userId2: string): Promise<void> {
    // Update request status
    await axios.patch(`${API_URL}/friendRequests/${requestId}`, {
      status: 'accepted'
    })

    // Create friendship
    await axios.post(`${API_URL}/friendships`, {
      userId1,
      userId2,
      createdAt: new Date().toISOString()
    })
  },

  async rejectFriendRequest(requestId: string): Promise<void> {
    await axios.patch(`${API_URL}/friendRequests/${requestId}`, {
      status: 'rejected'
    })
  },

  // Friendships
  async getFriends(userId: string): Promise<User[]> {
    // Get all friendships where user is either userId1 or userId2
    const response = await axios.get(`${API_URL}/friendships`)
    const friendships: Friendship[] = response.data

    const userFriendships = friendships.filter(
      f => f.userId1 === userId || f.userId2 === userId
    )

    // Get friend IDs
    const friendIds = userFriendships.map(f => 
      f.userId1 === userId ? f.userId2 : f.userId1
    )

    // Fetch friend users
    const friends: User[] = []
    for (const friendId of friendIds) {
      const userResponse = await axios.get(`${API_URL}/users/${friendId}`)
      friends.push(userResponse.data)
    }

    return friends
  },

  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const response = await axios.get(`${API_URL}/friendships`)
    const friendships: Friendship[] = response.data

    return friendships.some(
      f => (f.userId1 === userId1 && f.userId2 === userId2) ||
           (f.userId1 === userId2 && f.userId2 === userId1)
    )
  },

  async getSuggestedUsers(currentUserId: string): Promise<User[]> {
    // Get all users
    const usersResponse = await axios.get(`${API_URL}/users`)
    const allUsers: User[] = usersResponse.data

    // Get current user's friends
    const friends = await this.getFriends(currentUserId)
    const friendIds = friends.map(f => f.id)

    // Get pending friend requests (sent and received)
    const sentRequests = await this.getFriendRequestsBySender(currentUserId)
    const receivedRequests = await this.getFriendRequestsByReceiver(currentUserId)
    
    const pendingUserIds = [
      ...sentRequests.map(r => r.receiverId),
      ...receivedRequests.map(r => r.senderId)
    ]

    // Filter out current user, friends, and users with pending requests
    return allUsers.filter(user => 
      user.id !== currentUserId &&
      !friendIds.includes(user.id) &&
      !pendingUserIds.includes(user.id)
    )
  }
}
