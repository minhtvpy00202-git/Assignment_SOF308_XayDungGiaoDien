# Design Document

## Overview

Blog Management là một Single Page Application (SPA) mạng xã hội được xây dựng với Vue.js 3 (Composition API), TypeScript, Bootstrap 5 và JSON Server. Ứng dụng cho phép người dùng đăng ký, đăng nhập, tạo và quản lý bài viết, tương tác với bài viết (like, share, comment), gửi tin nhắn trực tiếp, và quản lý trang cá nhân. Kiến trúc được thiết kế theo mô hình component-based với state management tập trung và routing được bảo vệ.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vue.js Frontend                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Views/     │  │  Components  │  │   Router     │  │
│  │   Pages      │◄─┤   (Reusable) │◄─┤  (Protected) │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  │
│         │                                                │
│  ┌──────▼───────────────────────────────────────────┐  │
│  │         Composables (Business Logic)             │  │
│  │  - useAuth  - usePosts  - useComments            │  │
│  │  - useMessages  - useLikes  - useShares          │  │
│  └──────┬───────────────────────────────────────────┘  │
│         │                                                │
│  ┌──────▼───────────────────────────────────────────┐  │
│  │              API Service Layer                    │  │
│  │         (Axios HTTP Client)                       │  │
│  └──────┬───────────────────────────────────────────┘  │
└─────────┼───────────────────────────────────────────────┘
          │
          │ HTTP/REST
          │
┌─────────▼───────────────────────────────────────────────┐
│                   JSON Server                            │
│                    (db.json)                             │
│  - users  - posts  - comments  - messages               │
│  - likes  - shares                                       │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: Vue.js 3 với Composition API
- **Language**: TypeScript
- **UI Framework**: Bootstrap 5
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Backend**: JSON Server
- **Build Tool**: Vite
- **State Management**: Reactive refs và composables (không dùng Vuex/Pinia)

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Top Navigation Bar                    │
│  Logo | Home | Profile | Create Post | Logout           │
└─────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────┬───────────────────┐
│   Messages   │     News Feed        │   (Future: Ads)   │
│   Sidebar    │   (Center Column)    │                   │
│   (Left)     │                      │                   │
│              │  ┌────────────────┐  │                   │
│ Conversations│  │  Post Card     │  │                   │
│ List         │  │  - Like/Share  │  │                   │
│              │  │  - Comments    │  │                   │
│              │  └────────────────┘  │                   │
│              │  ┌────────────────┐  │                   │
│              │  │  Post Card     │  │                   │
│              │  └────────────────┘  │                   │
└──────────────┴──────────────────────┴───────────────────┘
```

## Components and Interfaces

### Core Composables

#### useAuth Composable
```typescript
interface AuthState {
  currentUser: Ref<User | null>
  isAuthenticated: Ref<boolean>
}

interface UseAuth {
  currentUser: Readonly<Ref<User | null>>
  isAuthenticated: Readonly<Ref<boolean>>
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  checkAuth: () => void
}
```

#### usePosts Composable
```typescript
interface UsePost {
  posts: Readonly<Ref<Post[]>>
  currentPost: Readonly<Ref<Post | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  fetchPosts: () => Promise<void>
  fetchPostsByUserId: (userId: string) => Promise<void>
  fetchPostById: (id: string) => Promise<void>
  createPost: (postData: CreatePostData) => Promise<void>
  updatePost: (id: string, postData: UpdatePostData) => Promise<void>
  deletePost: (id: string) => Promise<void>
}
```

#### useComments Composable
```typescript
interface UseComments {
  comments: Readonly<Ref<Comment[]>>
  loading: Readonly<Ref<boolean>>
  fetchCommentsByPostId: (postId: string) => Promise<void>
  createComment: (commentData: CreateCommentData) => Promise<void>
}
```

#### useLikes Composable
```typescript
interface UseLikes {
  toggleLike: (postId: string) => Promise<void>
  getLikeCount: (postId: string) => Promise<number>
  isLikedByUser: (postId: string, userId: string) => Promise<boolean>
  fetchLikesByPostId: (postId: string) => Promise<Like[]>
}
```

#### useShares Composable
```typescript
interface UseShares {
  sharePost: (postId: string) => Promise<void>
  getShareCount: (postId: string) => Promise<number>
  fetchSharesByPostId: (postId: string) => Promise<Share[]>
}
```

#### useMessages Composable
```typescript
interface UseMessages {
  conversations: Readonly<Ref<Conversation[]>>
  currentConversation: Readonly<Ref<Message[]>>
  loading: Readonly<Ref<boolean>>
  fetchConversations: () => Promise<void>
  fetchConversationWith: (userId: string) => Promise<void>
  sendMessage: (receiverId: string, content: string) => Promise<void>
}
```

#### useUser Composable
```typescript
interface UseUser {
  user: Readonly<Ref<User | null>>
  loading: Readonly<Ref<boolean>>
  fetchUserById: (id: string) => Promise<void>
  updateUser: (id: string, userData: UpdateUserData) => Promise<void>
}
```

### API Service Layer

```typescript
class ApiService {
  private axiosInstance: AxiosInstance
  
  // User endpoints
  getUsers(): Promise<User[]>
  getUserById(id: string): Promise<User>
  createUser(userData: CreateUserData): Promise<User>
  updateUser(id: string, userData: UpdateUserData): Promise<User>
  
  // Post endpoints
  getPosts(): Promise<Post[]>
  getPostsByUserId(userId: string): Promise<Post[]>
  getPostById(id: string): Promise<Post>
  createPost(postData: CreatePostData): Promise<Post>
  updatePost(id: string, postData: UpdatePostData): Promise<Post>
  deletePost(id: string): Promise<void>
  
  // Comment endpoints
  getComments(): Promise<Comment[]>
  getCommentsByPostId(postId: string): Promise<Comment[]>
  createComment(commentData: CreateCommentData): Promise<Comment>
  deleteComment(id: string): Promise<void>
  
  // Like endpoints
  getLikes(): Promise<Like[]>
  getLikesByPostId(postId: string): Promise<Like[]>
  createLike(likeData: CreateLikeData): Promise<Like>
  deleteLike(id: string): Promise<void>
  
  // Share endpoints
  getShares(): Promise<Share[]>
  getSharesByPostId(postId: string): Promise<Share[]>
  createShare(shareData: CreateShareData): Promise<Share>
  
  // Message endpoints
  getMessages(): Promise<Message[]>
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]>
  createMessage(messageData: CreateMessageData): Promise<Message>
}
```

### Router Configuration

```typescript
const routes = [
  { path: '/', component: HomePage, meta: { requiresAuth: true } },
  { path: '/login', component: LoginPage, meta: { guestOnly: true } },
  { path: '/register', component: RegisterPage, meta: { guestOnly: true } },
  { path: '/profile/:userId', component: UserProfilePage, meta: { requiresAuth: false } },
  { path: '/profile', component: MyProfilePage, meta: { requiresAuth: true } },
  { path: '/posts/create', component: CreatePostPage, meta: { requiresAuth: true } },
  { path: '/posts/:id/edit', component: EditPostPage, meta: { requiresAuth: true } },
  { path: '/messages/:userId', component: MessagesPage, meta: { requiresAuth: true } }
]
```

### Key Components

1. **AppNavbar**: Navigation bar với conditional rendering dựa trên authentication state
2. **MessagesSidebar**: Sidebar bên trái hiển thị danh sách conversations
3. **PostCard**: Hiển thị bài viết với like, share, comment buttons và inline comments
4. **PostForm**: Form tạo/chỉnh sửa bài viết với validation
5. **CommentList**: Hiển thị danh sách comments dưới post
6. **CommentForm**: Form thêm comment inline dưới post
7. **LikeButton**: Button like với toggle functionality
8. **ShareButton**: Button share bài viết
9. **ConversationItem**: Item trong danh sách conversations
10. **MessageBubble**: Hiển thị một tin nhắn trong conversation
11. **MessageInput**: Input field để gửi tin nhắn
12. **UserProfileHeader**: Header của trang profile với avatar, name, intro
13. **AuthForm**: Reusable form cho login/register

## Data Models

### User Model
```typescript
interface User {
  id: string
  name: string
  email: string
  password: string
  avatar: string
  intro: string
}

interface CreateUserData {
  name: string
  email: string
  password: string
  avatar?: string
  intro?: string
}

interface UpdateUserData {
  name?: string
  email?: string
  password?: string
  avatar?: string
  intro?: string
}
```

### Post Model
```typescript
interface Post {
  id: string
  userId: string
  title: string
  content: string
  image: string
  createdAt: string
  sharedFromId?: string  // ID của bài viết gốc nếu đây là shared post
}

interface CreatePostData {
  title: string
  content: string
  image?: string
  sharedFromId?: string
}

interface UpdatePostData {
  title?: string
  content?: string
  image?: string
}
```

### Comment Model
```typescript
interface Comment {
  id: string
  postId: string
  userId: string
  content: string
  parentId: string | null
  createdAt: string
}

interface CreateCommentData {
  postId: string
  content: string
  parentId?: string | null
}
```

### Like Model
```typescript
interface Like {
  id: string
  postId: string
  userId: string
  createdAt: string
}

interface CreateLikeData {
  postId: string
  userId: string
}
```

### Share Model
```typescript
interface Share {
  id: string
  postId: string
  userId: string
  createdAt: string
}

interface CreateShareData {
  postId: string
  userId: string
}
```

### Message Model
```typescript
interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: string
}

interface CreateMessageData {
  senderId: string
  receiverId: string
  content: string
}

interface Conversation {
  userId: string
  userName: string
  userAvatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}
```

### Authentication Storage
```typescript
interface AuthStorage {
  token: string  // userId được lưu làm token
  user: User
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid registration creates unique user
*For any* valid registration data (non-empty name, email, password), submitting the registration form should create a new user with a unique identifier in the system.
**Validates: Requirements 1.1**

### Property 2: Empty field validation prevents submission
*For any* registration or form submission with empty or whitespace-only required fields, the system should prevent submission and display validation errors.
**Validates: Requirements 1.3, 3.2, 5.2, 11.2**

### Property 3: New users have default fields
*For any* newly created user account, the stored user data should include default avatar and intro fields even if not provided during registration.
**Validates: Requirements 1.4**

### Property 4: Valid login creates authentication token
*For any* valid email and password combination that matches an existing user, the login process should create and store an authentication token in browser storage.
**Validates: Requirements 2.1, 2.3**

### Property 5: Post creation includes required metadata
*For any* valid post data (non-empty title and content), creating a post should generate a unique identifier, current timestamp, and associate it with the authenticated user's ID.
**Validates: Requirements 3.1, 3.4, 3.5**

### Property 6: Image URL storage
*For any* post created with an image URL, the stored post data should contain the exact image URL provided.
**Validates: Requirements 3.3**

### Property 7: Post ownership controls visibility of actions
*For any* post viewed by an authenticated user, edit and delete buttons should be visible if and only if the post's userId matches the authenticated user's ID.
**Validates: Requirements 4.1, 4.2**

### Property 8: Post updates persist correctly
*For any* valid update data applied to a user's own post, the changes should be saved to the backend and reflected when the post is retrieved again.
**Validates: Requirements 4.3**

### Property 9: Post deletion cascades to comments
*For any* post that is deleted, all comments associated with that post (matching postId) should also be removed from the system.
**Validates: Requirements 4.4**

### Property 10: Comment creation includes metadata
*For any* valid comment content submitted on a post, the created comment should have a unique identifier, timestamp, the authenticated user's ID, and the correct postId.
**Validates: Requirements 5.1, 5.4**

### Property 11: Comment rendering includes required information
*For any* comment displayed in the UI, the rendered output should contain the commenter's name, comment content, and a formatted timestamp.
**Validates: Requirements 5.3**

### Property 12: Comments are sorted by timestamp descending
*For any* post with multiple comments, when displayed, the comments should be ordered with the most recent comment first (descending by createdAt timestamp).
**Validates: Requirements 5.5**

### Property 13: Profile updates persist correctly
*For any* valid profile update data (name, email, password, avatar, intro), the changes should be saved to the backend and reflected when the user data is retrieved again.
**Validates: Requirements 6.2, 6.3, 6.4**

### Property 14: News feed posts sorted by timestamp descending
*For any* collection of posts displayed on the home page, the posts should be ordered with the most recent post first (descending by createdAt timestamp).
**Validates: Requirements 7.1**

### Property 15: Post card contains required information
*For any* post displayed in the news feed, the rendered post card should include title, content, author name, avatar, creation date, image, like count, share count, and comment count.
**Validates: Requirements 7.2**

### Property 16: Messages sidebar visible for authenticated users
*For any* authenticated user accessing the home page, the messages sidebar should be visible on the left side of the layout.
**Validates: Requirements 7.3**

### Property 17: Like creation stores correct data
*For any* post that an authenticated user likes, a like record should be created with the correct userId and postId.
**Validates: Requirements 8.1**

### Property 18: Like toggle removes existing like
*For any* post that a user has already liked, clicking the like button again should remove the like record (toggle behavior).
**Validates: Requirements 8.2**

### Property 19: Like count reflects total likes
*For any* post, the displayed like count should equal the number of like records associated with that postId.
**Validates: Requirements 8.3**

### Property 20: Like button state reflects user like status
*For any* post viewed by an authenticated user, the like button should be highlighted if and only if a like record exists with the user's ID and the post's ID.
**Validates: Requirements 8.4**

### Property 21: Share creates new post with reference
*For any* post that is shared, a new post should be created with the sharing user's ID and a sharedFromId field referencing the original post.
**Validates: Requirements 9.1, 9.2**

### Property 22: Shared post rendering includes both users
*For any* shared post displayed, the rendered output should include both the sharing user's information and the original post's content and author.
**Validates: Requirements 9.3**

### Property 23: Share count reflects total shares
*For any* post, the displayed share count should equal the number of share records or shared posts associated with that postId.
**Validates: Requirements 9.4**

### Property 24: Comment input visible for authenticated users
*For any* post in the news feed viewed by an authenticated user, a comment input field should be displayed directly below the post.
**Validates: Requirements 10.1**

### Property 25: Inline comment creation without navigation
*For any* comment submitted on a post in the news feed, the comment should appear immediately below the post without changing the current route.
**Validates: Requirements 10.2**

### Property 26: Comment display includes required fields
*For any* comment displayed under a post, the rendered output should include the commenter's avatar, name, content, and formatted timestamp.
**Validates: Requirements 10.3**

### Property 27: Comment pagination shows limited initial comments
*For any* post with more than three comments, the initial display should show only the first three comments with a button to view all remaining comments.
**Validates: Requirements 10.4**

### Property 28: Comments sorted by timestamp ascending
*For any* post with multiple comments displayed inline, the comments should be ordered with the oldest comment first (ascending by createdAt timestamp).
**Validates: Requirements 10.5**

### Property 29: Message creation includes required metadata
*For any* valid message content sent to another user, the created message should have a unique identifier, senderId, receiverId, content, and current timestamp.
**Validates: Requirements 11.1, 11.3**

### Property 30: Message display in conversation
*For any* message sent in a conversation, the message should appear in the conversation view with the correct sender information.
**Validates: Requirements 11.4**

### Property 31: Messages sorted by timestamp ascending
*For any* conversation with multiple messages, the messages should be ordered with the oldest message first (ascending by createdAt timestamp).
**Validates: Requirements 11.5**

### Property 32: Conversations sorted by most recent message
*For any* authenticated user's conversation list, the conversations should be ordered with the conversation containing the most recent message appearing first.
**Validates: Requirements 12.1**

### Property 33: Conversation item includes required information
*For any* conversation displayed in the sidebar, the rendered item should include the other user's avatar, name, and a preview of the last message.
**Validates: Requirements 12.2**

### Property 34: User profile displays complete information
*For any* user profile page accessed, the page should display the user's avatar, name, intro, and the total count of posts created by that user.
**Validates: Requirements 13.1**

### Property 35: Profile page filters posts by user
*For any* user profile page, only posts where the userId matches the profile user's ID should be displayed.
**Validates: Requirements 13.2**

### Property 36: Profile posts sorted by timestamp descending
*For any* user profile page with multiple posts, the posts should be ordered with the most recent post first (descending by createdAt timestamp).
**Validates: Requirements 13.3**

### Property 37: Message button visible on other user profiles
*For any* authenticated user viewing another user's profile page, a "Send Message" button should be visible.
**Validates: Requirements 13.4**

### Property 38: Edit button visible on own profile
*For any* authenticated user viewing their own profile page, an "Edit Profile" button should be visible.
**Validates: Requirements 13.5**

### Property 39: Own profile posts have action buttons
*For any* post displayed on the authenticated user's own profile page, edit and delete buttons should be visible.
**Validates: Requirements 14.3**

### Property 40: Profile post deletion removes post
*For any* post deleted from the user's own profile page, the post should be removed from the backend and no longer appear in any post listings.
**Validates: Requirements 14.4**

### Property 41: Authenticated navigation includes additional links
*For any* authenticated user viewing the navigation, additional links (create post, profile, logout) should be visible compared to guest navigation.
**Validates: Requirements 15.2**

### Property 42: Protected routes redirect unauthenticated users
*For any* protected route accessed by an unauthenticated user, the router should redirect to the login page.
**Validates: Requirements 15.3**

### Property 43: Guest-only routes redirect authenticated users
*For any* guest-only route (login, register) accessed by an authenticated user, the router should redirect to the home page.
**Validates: Requirements 15.4**

## Error Handling

### Validation Errors
- All form inputs must be validated before submission
- Empty or whitespace-only strings should be rejected for required fields
- Email format should be validated using regex pattern
- Validation errors should be displayed inline near the relevant form field
- Bootstrap's `is-invalid` class should be applied to invalid inputs

### API Errors
- Network errors should be caught and displayed to users with user-friendly messages
- 404 errors (resource not found) should redirect to appropriate pages
- Duplicate email during registration should show specific error message
- Invalid credentials during login should show generic error for security
- All API calls should have try-catch blocks with error state management

### Authentication Errors
- Expired or invalid tokens should trigger logout and redirect to login
- Unauthorized access attempts should be logged and redirected
- Missing authentication for protected actions should show login prompt

### Data Integrity
- Post deletion should verify ownership before execution
- Comment creation should verify post exists before submission
- User updates should verify current user matches target user ID
- All mutations should validate data before persisting to backend
- Like/unlike operations should check for existing records to prevent duplicates
- Share operations should verify original post exists

## Testing Strategy

### Unit Testing Framework
- **Framework**: Vitest (recommended for Vite projects)
- **Component Testing**: Vue Test Utils
- **Coverage Target**: Focus on business logic in composables and API service

### Unit Tests
Unit tests will cover:
- API service methods (mocked axios calls)
- Form validation logic
- Data transformation functions
- Route guard logic
- Utility functions (date formatting, ID generation)
- Like toggle logic
- Share creation logic
- Message filtering and sorting

Example unit tests:
- Test that `validateEmail()` correctly identifies valid/invalid emails
- Test that `generateId()` produces unique identifiers
- Test that `formatDate()` correctly formats ISO timestamps
- Test API service methods return expected data structures
- Test route guards redirect correctly based on auth state
- Test that `toggleLike()` creates or removes likes correctly
- Test that `getConversations()` groups messages by users correctly

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test must include a comment tag in this exact format:
```typescript
// Feature: blog-management, Property {number}: {property_text}
```

**Implementation**: Each correctness property listed above must be implemented as a single property-based test.

Property tests will verify:
- **Property 1-4**: Registration and authentication with generated user data
- **Property 5-9**: Post CRUD operations with generated post data
- **Property 10-13**: Comment operations with generated comments
- **Property 14-16**: News feed rendering with generated posts
- **Property 17-20**: Like operations with generated users and posts
- **Property 21-23**: Share operations with generated posts
- **Property 24-28**: Inline comment operations with generated data
- **Property 29-33**: Messaging operations with generated messages
- **Property 34-40**: Profile page operations with generated users and posts
- **Property 41-43**: Navigation and routing with generated auth states

### Test Data Generators
Property-based tests will use custom generators:
- `arbitraryUser()`: Generates valid user objects
- `arbitraryPost()`: Generates valid post objects
- `arbitraryComment()`: Generates valid comment objects
- `arbitraryMessage()`: Generates valid message objects
- `arbitraryLike()`: Generates valid like objects
- `arbitraryShare()`: Generates valid share objects
- `arbitraryInvalidString()`: Generates empty/whitespace strings
- `arbitraryEmail()`: Generates valid email addresses
- `arbitraryTimestamp()`: Generates ISO timestamp strings

### Integration Testing
Integration tests will verify:
- Complete user flows (register → login → create post → like → comment → share)
- Messaging flow (send message → view conversation → reply)
- Profile flow (view profile → edit profile → view posts)
- API integration with JSON Server
- Router navigation between pages
- Authentication persistence across page reloads

### End-to-End Testing Considerations
While not part of the initial implementation, E2E tests could be added later using:
- Playwright or Cypress for browser automation
- Testing complete user journeys in real browser environment
- Visual regression testing for UI components

## Implementation Notes

### Authentication Flow
1. User submits login form
2. API service queries JSON Server for matching email
3. If found, compare passwords (plain text in this simple implementation)
4. Store user ID as token in localStorage
5. Store full user object in localStorage
6. Update reactive auth state in useAuth composable
7. Router redirects to home page

### State Management Pattern
- Use Vue 3 Composition API with reactive refs
- Composables provide centralized state and methods
- No global store (Vuex/Pinia) needed for this application size
- Each composable manages its own domain (auth, posts, comments, likes, shares, messages)
- Composables can be imported and used in any component

### Routing Guards
```typescript
router.beforeEach((to, from, next) => {
  const isAuthenticated = checkAuthStatus()
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.guestOnly && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})
```

### Data Fetching Strategy
- Fetch data in component `onMounted` lifecycle hook
- Display loading state while fetching
- Handle errors with user-friendly messages
- Cache data in composable state to avoid redundant fetches
- Refresh data after mutations (create, update, delete)
- For news feed, fetch posts with associated counts (likes, shares, comments)

### Like/Unlike Implementation
```typescript
async function toggleLike(postId: string) {
  const existingLike = await findLikeByUserAndPost(currentUser.value.id, postId)
  
  if (existingLike) {
    await apiService.deleteLike(existingLike.id)
  } else {
    await apiService.createLike({ userId: currentUser.value.id, postId })
  }
  
  // Refresh post to update like count
  await fetchPostById(postId)
}
```

### Share Implementation
```typescript
async function sharePost(postId: string) {
  const originalPost = await apiService.getPostById(postId)
  
  const sharedPost = await apiService.createPost({
    userId: currentUser.value.id,
    title: originalPost.title,
    content: originalPost.content,
    image: originalPost.image,
    sharedFromId: postId
  })
  
  // Create share record for counting
  await apiService.createShare({
    userId: currentUser.value.id,
    postId: postId
  })
}
```

### Messaging Implementation
```typescript
async function fetchConversations() {
  const allMessages = await apiService.getMessages()
  
  // Filter messages where current user is sender or receiver
  const userMessages = allMessages.filter(m => 
    m.senderId === currentUser.value.id || m.receiverId === currentUser.value.id
  )
  
  // Group by conversation partner
  const conversationsMap = new Map<string, Message[]>()
  
  userMessages.forEach(message => {
    const partnerId = message.senderId === currentUser.value.id 
      ? message.receiverId 
      : message.senderId
    
    if (!conversationsMap.has(partnerId)) {
      conversationsMap.set(partnerId, [])
    }
    conversationsMap.get(partnerId).push(message)
  })
  
  // Convert to conversation objects with last message
  const conversations = Array.from(conversationsMap.entries()).map(([userId, messages]) => {
    const sortedMessages = messages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const lastMessage = sortedMessages[0]
    
    return {
      userId,
      lastMessage: lastMessage.content,
      lastMessageTime: lastMessage.createdAt,
      unreadCount: 0 // TODO: implement read tracking
    }
  })
  
  // Sort by most recent message
  conversations.sort((a, b) => 
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  )
  
  return conversations
}
```

### Form Handling Pattern
1. Bind form inputs to reactive refs using v-model
2. Validate on submit (not on every keystroke for better UX)
3. Display validation errors inline
4. Disable submit button during API call
5. Show success/error feedback after submission
6. Clear form or redirect on success

### Bootstrap Integration
- Import Bootstrap CSS in main.ts
- Use Bootstrap classes for layout (container, row, col)
- Use Bootstrap components (card, form, button, alert, navbar)
- Apply Bootstrap utility classes for spacing and typography
- Use Bootstrap form validation classes (is-valid, is-invalid)
- Use Bootstrap icons for like, share, comment buttons

### TypeScript Configuration
- Enable strict mode for better type safety
- Define interfaces for all data models
- Type all function parameters and return values
- Use readonly refs for exposed composable state
- Avoid `any` type, use `unknown` when type is truly unknown

### News Feed Layout
```
┌─────────────────────────────────────────────────────────┐
│  Container (Bootstrap)                                   │
│  ┌────────────┬──────────────────────┬─────────────┐   │
│  │ Messages   │  News Feed           │  (Future)   │   │
│  │ Sidebar    │                      │             │   │
│  │ col-md-3   │  col-md-6            │  col-md-3   │   │
│  │            │                      │             │   │
│  │ Conv 1     │  ┌────────────────┐  │             │   │
│  │ Conv 2     │  │ Post Card      │  │             │   │
│  │ Conv 3     │  │ [Like] [Share] │  │             │   │
│  │            │  │ Comments (3)   │  │             │   │
│  │            │  │ [Add Comment]  │  │             │   │
│  │            │  └────────────────┘  │             │   │
│  │            │  ┌────────────────┐  │             │   │
│  │            │  │ Post Card      │  │             │   │
│  │            │  └────────────────┘  │             │   │
│  └────────────┴──────────────────────┴─────────────┘   │
└─────────────────────────────────────────────────────────┘
```
