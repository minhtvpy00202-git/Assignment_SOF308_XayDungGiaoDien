# Implementation Plan

## Task 1: Setup project infrastructure and dependencies
**Status:** completed

- Install and configure Bootstrap 5
- Install and configure Axios for HTTP requests
- Install and configure Vue Router 4
- Setup JSON Server with db.json file containing users, posts, comments, likes, shares, messages collections
- Configure TypeScript interfaces for all data models
- _Requirements: All requirements_

## Task 2: Implement core TypeScript interfaces and types
**Status:** completed

- Create User, Post, Comment, Like, Share, Message interface definitions
- Create CreateUserData, UpdateUserData, CreatePostData, UpdatePostData interface definitions
- Create CreateCommentData, CreateLikeData, CreateShareData, CreateMessageData interfaces
- Create Conversation interface for messaging
- _Requirements: 1.1, 3.1, 5.1, 8.1, 9.1, 11.1_

## Task 3: Implement API Service Layer
**Status:** completed

- Create ApiService class with Axios instance
- Implement user endpoints (getUsers, getUserById, createUser, updateUser)
- Implement post endpoints (getPosts, getPostsByUserId, getPostById, createPost, updatePost, deletePost)
- Implement comment endpoints (getComments, getCommentsByPostId, createComment, deleteComment)
- Implement like endpoints (getLikes, getLikesByPostId, createLike, deleteLike)
- Implement share endpoints (getShares, getSharesByPostId, createShare)
- Implement message endpoints (getMessages, getMessagesBetweenUsers, createMessage)
- _Requirements: 1.1, 2.1, 3.1, 4.3, 4.4, 5.1, 6.2, 8.1, 9.1, 11.1_

## Task 3.1: Write property test for API service
**Status:** completed

- **Property 1: Valid registration creates unique user**
- **Validates: Requirements 1.1**

## Task 3.2: Write property test for empty field validation
**Status:** completed

- **Property 2: Empty field validation prevents submission**
- **Validates: Requirements 1.3, 3.2, 5.2, 11.2**

## Task 4: Implement useAuth composable
**Status:** completed

- Create reactive state for currentUser and isAuthenticated
- Implement login function with email/password validation
- Implement register function with user creation
- Implement logout function with token removal
- Implement checkAuth function to restore auth state from localStorage
- Handle authentication token storage in localStorage
- _Requirements: 1.1, 1.4, 2.1, 2.3, 2.5_

## Task 4.1: Write property test for authentication
**Status:** completed

- **Property 3: New users have default fields**
- **Validates: Requirements 1.4**

## Task 4.2: Write property test for login token creation
**Status:** completed

- **Property 4: Valid login creates authentication token**
- **Validates: Requirements 2.1, 2.3**

## Task 5: Implement authentication pages
**Status:** completed

- Create RegisterPage component with form validation
- Create LoginPage component with form validation
- Implement form validation for empty fields
- Implement email format validation
- Display validation errors inline
- Handle registration success redirect to login
- Handle login success redirect to home
- _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.4_

## Task 6: Implement Vue Router with route guards
**Status:** completed

- Configure routes for all pages (home, login, register, profile, create post, edit post, messages)
- Implement beforeEach navigation guard for protected routes
- Redirect unauthenticated users to login for protected routes
- Redirect authenticated users to home for guest-only routes
- _Requirements: 15.1, 15.2, 15.3, 15.4_

## Task 6.1: Write property test for route guards
**Status:** completed

- **Property 42: Protected routes redirect unauthenticated users**
- **Validates: Requirements 15.3**

## Task 6.2: Write property test for guest-only routes
**Status:** completed

- **Property 43: Guest-only routes redirect authenticated users**
- **Validates: Requirements 15.4**

## Task 7: Implement AppNavbar component
**Status:** completed

- Create navigation bar with logo and links
- Implement conditional rendering for guest links (home, login, register)
- Implement conditional rendering for authenticated links (home, create post, profile, logout)
- Handle logout button click
- Apply Bootstrap navbar classes
- _Requirements: 15.1, 15.2_

## Task 7.1: Write property test for navigation links
**Status:** completed

- **Property 41: Authenticated navigation includes additional links**
- **Validates: Requirements 15.2_

## Task 8: Implement usePosts composable
**Status:** completed

- Create reactive state for posts, currentPost, loading, error
- Implement fetchPosts function to get all posts
- Implement fetchPostsByUserId function for profile pages
- Implement fetchPostById function for single post
- Implement createPost function with validation
- Implement updatePost function with ownership check
- Implement deletePost function with cascade deletion of comments
- _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.3, 4.4, 7.1_

## Task 8.1: Write property test for post creation
**Status:** completed

- **Property 5: Post creation includes required metadata**
- **Validates: Requirements 3.1, 3.4, 3.5**

## Task 8.2: Write property test for image URL storage
**Status:** completed

- **Property 6: Image URL storage**
- **Validates: Requirements 3.3**

## Task 8.3: Write property test for post updates
**Status:** completed

- **Property 8: Post updates persist correctly**
- **Validates: Requirements 4.3**

## Task 8.4: Write property test for post deletion cascade
**Status:** completed

- **Property 9: Post deletion cascades to comments**
- **Validates: Requirements 4.4**

## Task 9: Implement post management pages
**Status:** completed

- Create CreatePostPage with PostForm component
- Create EditPostPage with PostForm component and ownership check
- Implement PostForm component with title, content, image fields
- Implement form validation for empty title/content
- Handle post creation success redirect
- Handle post update success feedback
- _Requirements: 3.1, 3.2, 3.3, 4.3**

## Task 10: Implement useComments composable
**Status:** completed

- Create reactive state for comments and loading
- Implement fetchCommentsByPostId function
- Implement createComment function with validation
- Sort comments by timestamp (descending for Requirement 5, ascending for Requirement 10)
- _Requirements: 5.1, 5.2, 5.4, 5.5, 10.2, 10.5_

## Task 10.1: Write property test for comment creation
**Status:** completed

- **Property 10: Comment creation includes metadata**
- **Validates: Requirements 5.1, 5.4**

## Task 10.2: Write property test for comment sorting
**Status:** completed

- **Property 12: Comments are sorted by timestamp descending**
- **Validates: Requirements 5.5**

## Task 10.3: Write property test for inline comment sorting
**Status:** completed

- **Property 28: Comments sorted by timestamp ascending**
- **Validates: Requirements 10.5**

## Task 11: Implement useLikes composable
**Status:** completed

- Create toggleLike function to add/remove likes
- Implement getLikeCount function to count likes for a post
- Implement isLikedByUser function to check if user liked a post
- Implement fetchLikesByPostId function
- Handle like/unlike toggle logic
- _Requirements: 8.1, 8.2, 8.3, 8.4_

## Task 11.1: Write property test for like creation
**Status:** completed

- **Property 17: Like creation stores correct data**
- **Validates: Requirements 8.1**

## Task 11.2: Write property test for like toggle
**Status:** completed

- **Property 18: Like toggle removes existing like**
- **Validates: Requirements 8.2**

## Task 11.3: Write property test for like count
**Status:** completed

- **Property 19: Like count reflects total likes**
- **Validates: Requirements 8.3**

## Task 11.4: Write property test for like button state
**Status:** completed

- **Property 20: Like button state reflects user like status**
- **Validates: Requirements 8.4**

## Task 12: Implement useShares composable
**Status:** completed

- Create sharePost function to create shared post
- Implement getShareCount function to count shares for a post
- Implement fetchSharesByPostId function
- Handle share creation with original post reference
- _Requirements: 9.1, 9.2, 9.4_

## Task 12.1: Write property test for share creation
**Status:** completed

- **Property 21: Share creates new post with reference**
- **Validates: Requirements 9.1, 9.2**

## Task 12.2: Write property test for share count
**Status:** completed

- **Property 23: Share count reflects total shares**
- **Validates: Requirements 9.4**

## Task 13: Implement PostCard component
**Status:** completed

- Display post title, content, author name, avatar, creation date, image
- Integrate LikeButton component with like count display
- Integrate ShareButton component with share count display
- Display comment count
- Show edit/delete buttons only for post owner
- Handle shared post rendering with both users' information
- Apply Bootstrap card classes
- _Requirements: 4.1, 4.2, 7.2, 9.3_

## Task 13.1: Write property test for post ownership controls
**Status:** completed

- **Property 7: Post ownership controls visibility of actions**
- **Validates: Requirements 4.1, 4.2**

## Task 13.2: Write property test for post card information
**Status:** completed

- **Property 15: Post card contains required information**
- **Validates: Requirements 7.2**

## Task 13.3: Write property test for shared post rendering
**Status:** completed

- **Property 22: Shared post rendering includes both users**
- **Validates: Requirements 9.3**

## Task 14: Implement LikeButton component
**Status:** completed

- Create button with heart icon
- Implement click handler to toggle like
- Display like count next to button
- Highlight button if user has liked the post
- Apply Bootstrap button classes
- _Requirements: 8.1, 8.2, 8.3, 8.4_

## Task 15: Implement ShareButton component
**Status:** completed

- Create button with share icon
- Implement click handler to share post
- Display share count next to button
- Apply Bootstrap button classes
- _Requirements: 9.1, 9.2, 9.4_

## Task 16: Implement inline comment functionality
**Status:** completed

- Create CommentForm component for inline comment input
- Create CommentList component to display comments under post
- Implement comment pagination (show 3 initially, button to view all)
- Display commenter avatar, name, content, timestamp
- Sort comments by timestamp ascending for inline display
- Show comment form only for authenticated users
- _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

## Task 16.1: Write property test for comment input visibility
**Status:** completed

- **Property 24: Comment input visible for authenticated users**
- **Validates: Requirements 10.1**

## Task 16.2: Write property test for inline comment creation
**Status:** completed

- **Property 25: Inline comment creation without navigation**
- **Validates: Requirements 10.2**

## Task 16.3: Write property test for comment display fields
**Status:** completed

- **Property 26: Comment display includes required fields**
- **Validates: Requirements 10.3**

## Task 16.4: Write property test for comment pagination
**Status:** completed

- **Property 27: Comment pagination shows limited initial comments**
- **Validates: Requirements 10.4**

## Task 17: Implement HomePage with news feed layout
**Status:** completed

- Create three-column layout (messages sidebar, news feed, future column)
- Display all posts in center column sorted by timestamp descending
- Integrate PostCard components with inline comments
- Show loading indicator while fetching posts
- Show empty state message when no posts exist
- Apply Bootstrap grid classes (col-md-3, col-md-6, col-md-3)
- _Requirements: 7.1, 7.2, 7.4, 7.5_

## Task 17.1: Write property test for news feed sorting
**Status:** completed

- **Property 14: News feed posts sorted by timestamp descending**
- **Validates: Requirements 7.1**

## Task 18: Implement useMessages composable
**Status:** completed

- Create reactive state for conversations, currentConversation, loading
- Implement fetchConversations function to group messages by conversation partner
- Implement fetchConversationWith function to get messages between two users
- Implement sendMessage function with validation
- Sort conversations by most recent message
- Sort messages within conversation by timestamp ascending
- _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1_

## Task 18.1: Write property test for message creation
**Status:** completed

- **Property 29: Message creation includes required metadata**
- **Validates: Requirements 11.1, 11.3**

## Task 18.2: Write property test for message display
**Status:** completed

- **Property 30: Message display in conversation**
- **Validates: Requirements 11.4**

## Task 18.3: Write property test for message sorting
**Status:** completed

- **Property 31: Messages sorted by timestamp ascending**
- **Validates: Requirements 11.5**

## Task 18.4: Write property test for conversation sorting
**Status:** completed

- **Property 32: Conversations sorted by most recent message**
- **Validates: Requirements 12.1**

## Task 19: Implement MessagesSidebar component
**Status:** completed

- Display list of conversations on left side of home page
- Show only for authenticated users
- Display ConversationItem components for each conversation
- Handle click to open conversation view
- Apply Bootstrap classes for sidebar layout
- _Requirements: 7.3, 12.1, 12.2, 12.4_

## Task 19.1: Write property test for messages sidebar visibility
**Status:** completed

- **Property 16: Messages sidebar visible for authenticated users**
- **Validates: Requirements 7.3**

## Task 19.2: Write property test for conversation item information
**Status:** completed

- **Property 33: Conversation item includes required information**
- **Validates: Requirements 12.2**

## Task 20: Implement ConversationItem component
**Status:** completed

- Display other user's avatar, name
- Display last message preview
- Display timestamp of last message
- Handle click to navigate to full conversation
- Apply Bootstrap list group item classes
- _Requirements: 12.2, 12.4_

## Task 21: Implement MessagesPage for full conversation view
**Status:** completed

- Create page to display full conversation with a specific user
- Display MessageBubble components for each message
- Integrate MessageInput component at bottom
- Sort messages by timestamp ascending
- Auto-scroll to bottom on new message
- _Requirements: 11.4, 11.5, 12.4_

## Task 22: Implement MessageBubble component
**Status:** completed

- Display message content
- Display sender name and timestamp
- Apply different styling for sent vs received messages
- Apply Bootstrap classes for message bubbles
- _Requirements: 11.4_

## Task 23: Implement MessageInput component
**Status:** completed

- Create input field for message content
- Implement send button
- Validate empty message content
- Handle message send with immediate display
- Apply Bootstrap form classes
- _Requirements: 11.1, 11.2, 11.3, 11.4_

## Task 24: Implement useUser composable
**Status:** completed

- Create reactive state for user and loading
- Implement fetchUserById function
- Implement updateUser function with validation
- _Requirements: 6.1, 6.2, 6.3, 6.4, 13.1_

## Task 24.1: Write property test for profile updates
**Status:** completed

- **Property 13: Profile updates persist correctly**
- **Validates: Requirements 6.2, 6.3, 6.4**

## Task 25: Implement UserProfilePage component
**Status:** completed

- Display user avatar, name, intro, post count
- Fetch and display posts by specific user
- Sort posts by timestamp descending
- Show "Send Message" button for other users' profiles
- Show "Edit Profile" button for own profile
- Show edit/delete buttons on own posts
- Apply Bootstrap layout classes
- _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.3_

## Task 25.1: Write property test for profile information display
**Status:** completed

- **Property 34: User profile displays complete information**
- **Validates: Requirements 13.1**

## Task 25.2: Write property test for profile post filtering
**Status:** completed

- **Property 35: Profile page filters posts by user**
- **Validates: Requirements 13.2**

## Task 25.3: Write property test for profile post sorting
**Status:** completed

- **Property 36: Profile posts sorted by timestamp descending**
- **Validates: Requirements 13.3**

## Task 25.4: Write property test for message button visibility
**Status:** completed

- **Property 37: Message button visible on other user profiles**
- **Validates: Requirements 13.4**

## Task 25.5: Write property test for edit button visibility
**Status:** completed

- **Property 38: Edit button visible on own profile**
- **Validates: Requirements 13.5**

## Task 25.6: Write property test for own profile post actions
**Status:** completed

- **Property 39: Own profile posts have action buttons**
- **Validates: Requirements 14.3**

## Task 26: Implement MyProfilePage component
**Status:** completed

- Display editable profile form with current user data
- Implement profile update functionality
- Display all posts by current user with edit/delete options
- Handle post deletion from profile
- Show success message on profile update
- Apply Bootstrap form and layout classes
- _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 14.1, 14.2, 14.3, 14.4_

## Task 26.1: Write property test for profile post deletion
**Status:** completed

- **Property 40: Profile post deletion removes post**
- **Validates: Requirements 14.4**

## Task 27: Implement UserProfileHeader component
**Status:** completed

- Display user avatar (large size)
- Display user name
- Display user intro text
- Display post count
- Apply Bootstrap classes for header layout
- _Requirements: 13.1, 14.1_

## Task 28: Implement utility functions
**Status:** completed

- Create generateId function for unique identifiers
- Create formatDate function for timestamp formatting
- Create validateEmail function for email validation
- Create validateRequired function for empty field validation
- _Requirements: 1.1, 1.3, 3.1, 5.3, 10.3_

## Task 28.1: Write unit tests for utility functions
**Status:** completed

- Test generateId produces unique IDs
- Test formatDate correctly formats ISO timestamps
- Test validateEmail identifies valid/invalid emails
- Test validateRequired rejects empty/whitespace strings

## Task 29: Checkpoint - Ensure all tests pass
**Status:** completed

- Ensure all tests pass, ask the user if questions arise.

## Task 30: Polish UI and add Bootstrap styling
**Status:** completed

- Apply consistent Bootstrap spacing utilities (mt, mb, p, etc.)
- Add Bootstrap alert components for success/error messages
- Add Bootstrap spinner for loading states
- Add Bootstrap form validation classes (is-valid, is-invalid)
- Add Bootstrap icons for like, share, comment buttons
- Ensure responsive layout works on mobile devices
- _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

## Task 31: Final testing and bug fixes
**Status:** completed

- Test complete user flow: register → login → create post → like → comment → share
- Test messaging flow: send message → view conversation → reply
- Test profile flow: view profile → edit profile → view posts
- Test authentication persistence across page reloads
- Test route guards for protected and guest-only routes
- Fix any bugs discovered during testing
- _Requirements: All requirements_

## Task 32: Final Checkpoint - Ensure all tests pass
**Status:** completed

- Ensure all tests pass, ask the user if questions arise.
