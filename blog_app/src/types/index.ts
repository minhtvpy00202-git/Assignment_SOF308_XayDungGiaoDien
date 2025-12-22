// User Models
export interface User {
  id: string
  name: string
  email: string
  password: string
  avatar: string
  intro: string
  isOnline?: boolean
  lastSeen?: string
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  avatar?: string
  intro?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  password?: string
  avatar?: string
  intro?: string
  isOnline?: boolean
  lastSeen?: string
}

// Post Models
export interface Post {
  id: string
  userId: string
  title: string
  content: string
  // Support multiple images per post
  images?: string[]
  // Video support
  video?: string
  // Emotion support
  emotion?: string
  createdAt: string
  sharedFromId?: string
  privacy?: 'public' | 'friends' | 'private'
  // Sentiment analysis fields
  sentiment?: 'positive' | 'neutral' | 'negative'
  sentiment_score?: number
}

export type PostPrivacy = 'public' | 'friends' | 'private'

export interface CreatePostData {
  title: string
  content: string
  images?: string[]
  video?: string
  emotion?: string
  sharedFromId?: string
  privacy?: PostPrivacy
  sentiment?: 'positive' | 'neutral' | 'negative'
  sentiment_score?: number
}

export interface UpdatePostData {
  title?: string
  content?: string
  images?: string[]
  video?: string
  emotion?: string
  privacy?: PostPrivacy
  sentiment?: 'positive' | 'neutral' | 'negative'
  sentiment_score?: number
}

// Comment Models
export interface Comment {
  id: string
  postId: string
  userId: string
  content: string
  parentId: string | null
  createdAt: string
  likesCount?: number
  repliesCount?: number
}

export interface CreateCommentData {
  postId: string
  content: string
  parentId?: string | null
}

// Comment Like Models
export interface CommentLike {
  id: string
  commentId: string
  userId: string
  createdAt: string
}

export interface CreateCommentLikeData {
  commentId: string
  userId: string
}

// Like Models
export interface Like {
  id: string
  postId: string
  userId: string
  createdAt: string
}

export interface CreateLikeData {
  postId: string
  userId: string
}

// Share Models
export interface Share {
  id: string
  postId: string
  userId: string
  createdAt: string
}

export interface CreateShareData {
  postId: string
  userId: string
}

// Message Models
export type MessageStatus = 'sent' | 'delivered' | 'seen'

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: string
  status?: MessageStatus
}

export interface CreateMessageData {
  senderId: string
  receiverId: string
  content: string
  status?: MessageStatus
}

export interface Conversation {
  userId: string
  userName: string
  userAvatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

// Friend Request Models
export interface FriendRequest {
  id: string
  senderId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface CreateFriendRequestData {
  senderId: string
  receiverId: string
}

// Friendship Models
export interface Friendship {
  id: string
  userId1: string
  userId2: string
  createdAt: string
}

// Authentication Storage
export interface AuthStorage {
  token: string
  user: User
}

// Search Models
export interface SearchResult {
  id: string
  type: 'user' | 'post'
  title: string
  subtitle?: string
  avatar?: string
  url: string
  matchedText?: string
}

export interface SearchResults {
  users: SearchResult[]
  posts: SearchResult[]
  total: number
}

export interface SearchableUser {
  id: string
  name: string
  email: string
  avatar: string
  searchableText: string // normalized name for searching
}

export interface SearchablePost {
  id: string
  title: string
  content: string
  userId: string
  authorName: string
  createdAt: string
  searchableText: string // title + content normalized
}

export interface SearchIndex {
  users: SearchableUser[]
  posts: SearchablePost[]
  lastUpdated: number
}

export interface RecentSearch {
  query: string
  timestamp: number
  userId?: string
}


// Notification Models
export type NotificationType = 'like' | 'comment' | 'share' | 'message' | 'friend_request'

export interface Notification {
  id: string
  userId: string // User who receives the notification
  fromUserId: string // User who triggered the notification
  type: NotificationType
  postId?: string // For like, comment, share
  message?: string // For message notifications
  isRead: boolean
  createdAt: string
}

export interface CreateNotificationData {
  userId: string
  fromUserId: string
  type: NotificationType
  postId?: string
  message?: string
}
