import axios, { type AxiosInstance } from 'axios'
import type {
  User,
  CreateUserData,
  UpdateUserData,
  Post,
  CreatePostData,
  UpdatePostData,
  Comment,
  CreateCommentData,
  CommentLike,
  CreateCommentLikeData,
  Like,
  CreateLikeData,
  Share,
  CreateShareData,
  Message,
  CreateMessageData,
  Notification,
  CreateNotificationData
} from '../types'

class ApiService {
  private axiosInstance: AxiosInstance

  constructor(baseURL: string = 'http://localhost:3000') {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // User endpoints
  async getUsers(): Promise<User[]> {
    const response = await this.axiosInstance.get<User[]>('/users')
    return response.data
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.axiosInstance.get<User>(`/users/${id}`)
    return response.data
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const newUser = {
      id: this.generateId(),
      ...userData,
      avatar: userData.avatar || 'https://via.placeholder.com/150',
      intro: userData.intro || ''
    }
    const response = await this.axiosInstance.post<User>('/users', newUser)
    return response.data
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const response = await this.axiosInstance.patch<User>(`/users/${id}`, userData)
    return response.data
  }

  // Post endpoints
  async getPosts(): Promise<Post[]> {
    const response = await this.axiosInstance.get<Post[]>('/posts')
    return response.data
  }

  async getPostsByUserId(userId: string): Promise<Post[]> {
    const response = await this.axiosInstance.get<Post[]>(`/posts?userId=${userId}`)
    return response.data
  }

  async getPostById(id: string): Promise<Post> {
    const response = await this.axiosInstance.get<Post>(`/posts/${id}`)
    return response.data
  }

  async createPost(postData: CreatePostData & { userId: string }): Promise<Post> {
    const newPost = {
      id: this.generateId(),
      ...postData,
      images: postData.images || [],
      createdAt: new Date().toISOString()
    }
    const response = await this.axiosInstance.post<Post>('/posts', newPost)
    return response.data
  }

  async updatePost(id: string, postData: UpdatePostData): Promise<Post> {
    const response = await this.axiosInstance.patch<Post>(`/posts/${id}`, postData)
    return response.data
  }

  async deletePost(id: string): Promise<void> {
    await this.axiosInstance.delete(`/posts/${id}`)
  }

  // Comment endpoints
  async getComments(): Promise<Comment[]> {
    const response = await this.axiosInstance.get<Comment[]>('/comments')
    return response.data
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const response = await this.axiosInstance.get<Comment[]>(`/comments?postId=${postId}`)
    return response.data
  }

  async createComment(commentData: CreateCommentData & { userId?: string }): Promise<Comment> {
    const newComment = {
      id: this.generateId(),
      userId: commentData.userId || '', // Will be set by the composable if not provided
      ...commentData,
      parentId: commentData.parentId || null,
      createdAt: new Date().toISOString()
    }
    const response = await this.axiosInstance.post<Comment>('/comments', newComment)
    return response.data
  }

  async deleteComment(id: string): Promise<void> {
    await this.axiosInstance.delete(`/comments/${id}`)
  }

  // Comment Like endpoints
  async getCommentLikes(): Promise<CommentLike[]> {
    const response = await this.axiosInstance.get<CommentLike[]>('/commentLikes')
    return response.data
  }

  async getCommentLikesByCommentId(commentId: string): Promise<CommentLike[]> {
    const response = await this.axiosInstance.get<CommentLike[]>(`/commentLikes?commentId=${commentId}`)
    return response.data
  }

  async createCommentLike(likeData: CreateCommentLikeData): Promise<CommentLike> {
    const newLike = {
      id: this.generateId(),
      ...likeData,
      createdAt: new Date().toISOString()
    }
    const response = await this.axiosInstance.post<CommentLike>('/commentLikes', newLike)
    return response.data
  }

  async deleteCommentLike(commentId: string, userId: string): Promise<void> {
    const likes = await this.getCommentLikesByCommentId(commentId)
    const like = likes.find(l => l.userId === userId)
    if (like) {
      await this.axiosInstance.delete(`/commentLikes/${like.id}`)
    }
  }

  // Like endpoints
  async getLikes(): Promise<Like[]> {
    const response = await this.axiosInstance.get<Like[]>('/likes')
    return response.data
  }

  async getLikesByPostId(postId: string): Promise<Like[]> {
    const response = await this.axiosInstance.get<Like[]>(`/likes?postId=${postId}`)
    return response.data
  }

  async createLike(likeData: CreateLikeData): Promise<Like> {
    const newLike = {
      id: this.generateId(),
      ...likeData,
      createdAt: new Date().toISOString()
    }
    const response = await this.axiosInstance.post<Like>('/likes', newLike)
    return response.data
  }

  async deleteLike(id: string): Promise<void> {
    await this.axiosInstance.delete(`/likes/${id}`)
  }

  // Share endpoints
  async getShares(): Promise<Share[]> {
    const response = await this.axiosInstance.get<Share[]>('/shares')
    return response.data
  }

  async getSharesByPostId(postId: string): Promise<Share[]> {
    const response = await this.axiosInstance.get<Share[]>(`/shares?postId=${postId}`)
    return response.data
  }

  async createShare(shareData: CreateShareData): Promise<Share> {
    const newShare = {
      id: this.generateId(),
      ...shareData,
      createdAt: new Date().toISOString()
    }
    const response = await this.axiosInstance.post<Share>('/shares', newShare)
    return response.data
  }

  // Message endpoints
  async getMessages(): Promise<Message[]> {
    const response = await this.axiosInstance.get<Message[]>('/messages')
    return response.data
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    const response = await this.axiosInstance.get<Message[]>(
      `/messages?senderId=${userId1}&receiverId=${userId2}`
    )
    const response2 = await this.axiosInstance.get<Message[]>(
      `/messages?senderId=${userId2}&receiverId=${userId1}`
    )
    return [...response.data, ...response2.data].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }

  async createMessage(messageData: CreateMessageData): Promise<Message> {
    const newMessage = {
      id: this.generateId(),
      ...messageData,
      status: 'sent' as const,
      createdAt: new Date().toISOString()
    }
    const response = await this.axiosInstance.post<Message>('/messages', newMessage)
    return response.data
  }

  async updateMessageStatus(id: string, status: 'sent' | 'delivered' | 'seen'): Promise<Message> {
    const response = await this.axiosInstance.patch<Message>(`/messages/${id}`, { status })
    return response.data
  }

  async markMessagesAsDelivered(receiverId: string, senderId: string): Promise<void> {
    const messages = await this.getMessagesBetweenUsers(receiverId, senderId)
    const undeliveredMessages = messages.filter(
      m => m.senderId === senderId && m.receiverId === receiverId && (!m.status || m.status === 'sent')
    )
    for (const msg of undeliveredMessages) {
      await this.updateMessageStatus(msg.id, 'delivered')
    }
  }

  async markMessagesAsSeen(receiverId: string, senderId: string): Promise<void> {
    const messages = await this.getMessagesBetweenUsers(receiverId, senderId)
    const unseenMessages = messages.filter(
      m => m.senderId === senderId && m.receiverId === receiverId && m.status !== 'seen'
    )
    for (const msg of unseenMessages) {
      await this.updateMessageStatus(msg.id, 'seen')
    }
  }

  // ==================== Notification Methods ====================

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const response = await this.axiosInstance.get<Notification[]>(`/notifications?userId=${userId}`)
    return response.data
  }

  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const newNotification: Notification = {
      id: this.generateId(),
      ...data,
      isRead: false,
      createdAt: new Date().toISOString()
    }
    const response = await this.axiosInstance.post<Notification>('/notifications', newNotification)
    return response.data
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const response = await this.axiosInstance.patch<Notification>(`/notifications/${id}`, { isRead: true })
    return response.data
  }

  async deleteNotification(id: string): Promise<void> {
    await this.axiosInstance.delete(`/notifications/${id}`)
  }

  // User online status methods
  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<User> {
    const userData = {
      isOnline,
      lastSeen: new Date().toISOString()
    }
    return this.updateUser(userId, userData)
  }

  async setUserOnline(userId: string): Promise<User> {
    return this.updateUserOnlineStatus(userId, true)
  }

  async setUserOffline(userId: string): Promise<User> {
    return this.updateUserOnlineStatus(userId, false)
  }

  // Utility method for generating unique IDs
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export a singleton instance
export const apiService = new ApiService()
export default apiService
