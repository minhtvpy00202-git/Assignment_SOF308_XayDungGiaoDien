# Requirements Document

## Introduction

Ứng dụng Blog Management là một nền tảng mạng xã hội được xây dựng bằng Vue.js và Bootstrap, cho phép người dùng tạo tài khoản, đăng nhập, đăng bài viết, tương tác với bài viết (like, share, comment), gửi tin nhắn trực tiếp cho nhau, và quản lý trang cá nhân. Hệ thống sử dụng JSON Server làm backend API để lưu trữ và quản lý dữ liệu người dùng, bài viết, bình luận, tin nhắn, và các tương tác.

## Glossary

- **Blog System**: Hệ thống quản lý blog bao gồm frontend Vue.js và backend JSON Server
- **User**: Người dùng đã đăng ký tài khoản trong hệ thống
- **Guest**: Người truy cập chưa đăng nhập vào hệ thống
- **Post**: Bài viết được tạo bởi người dùng, bao gồm tiêu đề, nội dung và hình ảnh
- **Comment**: Bình luận của người dùng trên một bài viết cụ thể, hiển thị ngay dưới bài viết
- **Like**: Hành động thích một bài viết, được lưu trữ với userId và postId
- **Share**: Hành động chia sẻ bài viết của người khác lên trang cá nhân
- **Message**: Tin nhắn riêng tư giữa hai người dùng
- **Conversation**: Chuỗi tin nhắn giữa hai người dùng cụ thể
- **User Profile Page**: Trang cá nhân hiển thị thông tin và bài viết của một người dùng cụ thể
- **Authentication Token**: Mã xác thực được lưu trữ để duy trì phiên đăng nhập
- **JSON Server**: Backend API server sử dụng file db.json để lưu trữ dữ liệu
- **Vue Router**: Thư viện quản lý routing trong ứng dụng Vue.js
- **Protected Route**: Route yêu cầu người dùng phải đăng nhập mới có thể truy cập
- **News Feed**: Trang chủ hiển thị danh sách bài viết từ tất cả người dùng

## Requirements

### Requirement 1

**User Story:** Là một người dùng mới, tôi muốn đăng ký tài khoản, để có thể truy cập các tính năng của hệ thống blog.

#### Acceptance Criteria

1. WHEN a guest submits the registration form with valid name, email and password THEN the Blog System SHALL create a new user account with a unique identifier
2. WHEN a guest submits the registration form with an email that already exists THEN the Blog System SHALL reject the registration and display an error message
3. WHEN a guest submits the registration form with empty required fields THEN the Blog System SHALL prevent submission and display validation errors
4. WHEN a new user account is created THEN the Blog System SHALL store the user data to JSON Server with default avatar and intro fields
5. WHEN registration is successful THEN the Blog System SHALL redirect the user to the login page

### Requirement 2

**User Story:** Là một người dùng đã đăng ký, tôi muốn đăng nhập vào hệ thống, để có thể sử dụng các chức năng đăng bài và bình luận.

#### Acceptance Criteria

1. WHEN a user submits login credentials with valid email and password THEN the Blog System SHALL authenticate the user and create an authentication token
2. WHEN a user submits login credentials with invalid email or password THEN the Blog System SHALL reject the login and display an error message
3. WHEN authentication is successful THEN the Blog System SHALL store the authentication token in browser storage
4. WHEN authentication is successful THEN the Blog System SHALL redirect the user to the home page
5. WHEN a user clicks logout THEN the Blog System SHALL remove the authentication token and redirect to the login page

### Requirement 3

**User Story:** Là một người dùng đã đăng nhập, tôi muốn tạo bài viết mới, để chia sẻ nội dung với cộng đồng.

#### Acceptance Criteria

1. WHEN an authenticated user submits a new post with title and content THEN the Blog System SHALL create the post with a unique identifier and current timestamp
2. WHEN an authenticated user submits a new post with empty title or content THEN the Blog System SHALL prevent submission and display validation errors
3. WHEN an authenticated user adds an image URL to the post THEN the Blog System SHALL store the image URL with the post data
4. WHEN a new post is created THEN the Blog System SHALL associate the post with the authenticated user identifier
5. WHEN a new post is created THEN the Blog System SHALL persist the post data to JSON Server immediately

### Requirement 4

**User Story:** Là tác giả của bài viết, tôi muốn chỉnh sửa hoặc xóa bài viết của mình, để quản lý nội dung đã đăng.

#### Acceptance Criteria

1. WHEN an authenticated user views their own post THEN the Blog System SHALL display edit and delete action buttons
2. WHEN an authenticated user views another user post THEN the Blog System SHALL hide edit and delete action buttons
3. WHEN an authenticated user updates their post with valid data THEN the Blog System SHALL save the changes to JSON Server
4. WHEN an authenticated user deletes their post THEN the Blog System SHALL remove the post and all associated comments from JSON Server
5. WHEN a post is deleted THEN the Blog System SHALL redirect the user to the posts list page

### Requirement 5

**User Story:** Là một người dùng đã đăng nhập, tôi muốn bình luận vào bài viết, để tương tác với nội dung và tác giả.

#### Acceptance Criteria

1. WHEN an authenticated user submits a comment with content on a post THEN the Blog System SHALL create the comment with unique identifier, timestamp and user association
2. WHEN an authenticated user submits an empty comment THEN the Blog System SHALL prevent submission and display a validation error
3. WHEN a comment is created THEN the Blog System SHALL display the commenter name, content and formatted timestamp
4. WHEN a comment is created THEN the Blog System SHALL persist the comment data to JSON Server immediately
5. WHEN a post displays comments THEN the Blog System SHALL order comments by creation timestamp in descending order

### Requirement 6

**User Story:** Là một người dùng đã đăng nhập, tôi muốn xem và chỉnh sửa thông tin cá nhân, để cập nhật hồ sơ của mình.

#### Acceptance Criteria

1. WHEN an authenticated user accesses the profile page THEN the Blog System SHALL display current name, email, avatar and intro information
2. WHEN an authenticated user updates profile information with valid data THEN the Blog System SHALL save the changes to JSON Server
3. WHEN an authenticated user updates the password field THEN the Blog System SHALL validate the new password and update it in JSON Server
4. WHEN an authenticated user updates the avatar URL THEN the Blog System SHALL store the new avatar URL and display it across the application
5. WHEN profile update is successful THEN the Blog System SHALL display a success message to the user

### Requirement 7

**User Story:** Là một người truy cập, tôi muốn xem news feed với danh sách bài viết, để khám phá nội dung từ cộng đồng.

#### Acceptance Criteria

1. WHEN any user accesses the home page THEN the Blog System SHALL display all posts in the center column ordered by creation timestamp in descending order
2. WHEN displaying a post in the news feed THEN the Blog System SHALL show title, content, author name, avatar, creation date, image, like count, share count and comment count
3. WHEN an authenticated user accesses the home page THEN the Blog System SHALL display a messages sidebar on the left with recent conversations
4. WHEN the posts list is empty THEN the Blog System SHALL display a message indicating no posts are available
5. WHEN posts are loaded from JSON Server THEN the Blog System SHALL display a loading indicator until data is received

### Requirement 8

**User Story:** Là một người dùng đã đăng nhập, tôi muốn like bài viết, để thể hiện sự yêu thích với nội dung.

#### Acceptance Criteria

1. WHEN an authenticated user clicks the like button on a post THEN the Blog System SHALL create a like record with userId and postId
2. WHEN an authenticated user clicks the like button on an already-liked post THEN the Blog System SHALL remove the like record
3. WHEN displaying a post THEN the Blog System SHALL show the total count of likes
4. WHEN displaying a post THEN the Blog System SHALL highlight the like button if the current user has liked the post
5. WHEN a like is added or removed THEN the Blog System SHALL update the like count immediately without page reload

### Requirement 9

**User Story:** Là một người dùng đã đăng nhập, tôi muốn share bài viết, để chia sẻ nội dung thú vị lên trang cá nhân của mình.

#### Acceptance Criteria

1. WHEN an authenticated user clicks the share button on a post THEN the Blog System SHALL create a new post referencing the original post
2. WHEN a shared post is created THEN the Blog System SHALL associate it with the sharing user and store the original post identifier
3. WHEN displaying a shared post THEN the Blog System SHALL show both the sharing user information and the original post content
4. WHEN displaying a post THEN the Blog System SHALL show the total count of shares
5. WHEN a post is shared THEN the Blog System SHALL update the share count immediately

### Requirement 10

**User Story:** Là một người dùng đã đăng nhập, tôi muốn bình luận ngay dưới bài viết trên news feed, để tương tác nhanh chóng.

#### Acceptance Criteria

1. WHEN an authenticated user views a post in the news feed THEN the Blog System SHALL display a comment input field directly below the post
2. WHEN an authenticated user submits a comment THEN the Blog System SHALL display the comment immediately below the post without navigation
3. WHEN displaying comments under a post THEN the Blog System SHALL show commenter avatar, name, content and timestamp
4. WHEN a post has more than three comments THEN the Blog System SHALL initially show only three comments with a button to view all
5. WHEN displaying comments THEN the Blog System SHALL order them by creation timestamp in ascending order

### Requirement 11

**User Story:** Là một người dùng đã đăng nhập, tôi muốn gửi tin nhắn cho người dùng khác, để trò chuyện riêng tư.

#### Acceptance Criteria

1. WHEN an authenticated user sends a message to another user THEN the Blog System SHALL create a message record with senderId, receiverId, content and timestamp
2. WHEN an authenticated user sends an empty message THEN the Blog System SHALL prevent submission and display a validation error
3. WHEN a message is sent THEN the Blog System SHALL persist the message to JSON Server immediately
4. WHEN a message is sent THEN the Blog System SHALL display the message in the conversation view immediately
5. WHEN displaying messages THEN the Blog System SHALL order them by creation timestamp in ascending order

### Requirement 12

**User Story:** Là một người dùng đã đăng nhập, tôi muốn xem danh sách cuộc trò chuyện, để truy cập các tin nhắn của mình.

#### Acceptance Criteria

1. WHEN an authenticated user accesses the messages sidebar THEN the Blog System SHALL display all conversations ordered by most recent message
2. WHEN displaying a conversation in the list THEN the Blog System SHALL show the other user avatar, name and last message preview
3. WHEN a conversation has unread messages THEN the Blog System SHALL display a visual indicator
4. WHEN an authenticated user clicks on a conversation THEN the Blog System SHALL open the full conversation view
5. WHEN a new message is received THEN the Blog System SHALL update the conversation list immediately

### Requirement 13

**User Story:** Là một người dùng đã đăng nhập, tôi muốn xem trang cá nhân của người dùng khác, để tìm hiểu về họ và xem bài viết của họ.

#### Acceptance Criteria

1. WHEN any user accesses a user profile page THEN the Blog System SHALL display the user avatar, name, intro and post count
2. WHEN displaying a user profile page THEN the Blog System SHALL show only posts created by that specific user
3. WHEN displaying posts on a profile page THEN the Blog System SHALL order them by creation timestamp in descending order
4. WHEN an authenticated user views another user profile THEN the Blog System SHALL display a button to send message
5. WHEN a user views their own profile page THEN the Blog System SHALL display an edit profile button

### Requirement 14

**User Story:** Là một người dùng đã đăng nhập, tôi muốn truy cập trang cá nhân của mình, để quản lý thông tin và xem bài viết đã đăng.

#### Acceptance Criteria

1. WHEN an authenticated user accesses their own profile page THEN the Blog System SHALL display editable profile information
2. WHEN an authenticated user updates profile information THEN the Blog System SHALL save changes to JSON Server
3. WHEN displaying the user own profile THEN the Blog System SHALL show all posts created by the user with edit and delete options
4. WHEN an authenticated user deletes a post from their profile THEN the Blog System SHALL remove the post and refresh the profile view
5. WHEN profile information is updated THEN the Blog System SHALL reflect changes across all areas of the application

### Requirement 15

**User Story:** Là một người dùng, tôi muốn điều hướng giữa các trang, để truy cập các chức năng khác nhau của ứng dụng.

#### Acceptance Criteria

1. WHEN any user accesses the application THEN the Blog System SHALL display a navigation menu with links to home, login and register pages
2. WHEN an authenticated user accesses the application THEN the Blog System SHALL display additional navigation links to create post, profile and logout
3. WHEN a guest attempts to access a protected route THEN the Blog System SHALL redirect to the login page
4. WHEN an authenticated user accesses a guest-only route THEN the Blog System SHALL redirect to the home page
5. WHEN navigation occurs THEN the Blog System SHALL update the browser URL without full page reload

### Requirement 16

**User Story:** Là một người dùng, tôi muốn giao diện responsive và thân thiện, để sử dụng ứng dụng trên nhiều thiết bị khác nhau.

#### Acceptance Criteria

1. WHEN the application is accessed on any device THEN the Blog System SHALL render using Bootstrap responsive grid system
2. WHEN the viewport width changes THEN the Blog System SHALL adapt the layout to fit the screen size
3. WHEN forms are displayed THEN the Blog System SHALL use Bootstrap form components with proper validation styling
4. WHEN buttons are displayed THEN the Blog System SHALL use Bootstrap button styles with appropriate colors and sizes
5. WHEN loading or error states occur THEN the Blog System SHALL display Bootstrap alert components with appropriate styling

### Requirement 17

**User Story:** Là một developer, tôi muốn ứng dụng sử dụng Vue.js reactivity, để giao diện tự động cập nhật khi dữ liệu thay đổi.

#### Acceptance Criteria

1. WHEN application state changes THEN the Blog System SHALL automatically update all dependent UI components without manual DOM manipulation
2. WHEN user input occurs in form fields THEN the Blog System SHALL bind the input values to Vue reactive data properties
3. WHEN conditional rendering is needed THEN the Blog System SHALL use Vue directives to show or hide elements based on state
4. WHEN lists are displayed THEN the Blog System SHALL use Vue list rendering to generate elements from array data
5. WHEN CSS classes need to change dynamically THEN the Blog System SHALL use Vue class binding based on component state

### Requirement 18

**User Story:** Là một developer, tôi muốn xử lý sự kiện người dùng, để ứng dụng phản hồi với các tương tác.

#### Acceptance Criteria

1. WHEN a user clicks a button THEN the Blog System SHALL execute the associated event handler method
2. WHEN a user submits a form THEN the Blog System SHALL prevent default form submission and execute custom handler logic
3. WHEN a user types in an input field THEN the Blog System SHALL capture the input event and update reactive data
4. WHEN event handlers execute THEN the Blog System SHALL handle errors gracefully and display appropriate feedback
5. WHEN multiple events occur rapidly THEN the Blog System SHALL process events in order without blocking the UI
