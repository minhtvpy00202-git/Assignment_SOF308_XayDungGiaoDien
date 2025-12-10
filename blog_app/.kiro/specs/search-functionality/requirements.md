# Requirements Document

## Introduction

Tính năng tìm kiếm toàn diện cho Blog360, cho phép người dùng tìm kiếm người dùng và bài viết, sử dụng db.json và localStorage để lưu trữ dữ liệu.

## Glossary

- **Search System**: Hệ thống tìm kiếm tổng thể của ứng dụng
- **Search Bar**: Thanh tìm kiếm trên navbar
- **Search Results**: Kết quả tìm kiếm được hiển thị
- **Search Dropdown**: Menu dropdown hiển thị kết quả tìm kiếm
- **User**: Người dùng đã đăng ký trong hệ thống
- **Post**: Bài viết được tạo bởi người dùng

## Requirements

### Requirement 1

**User Story:** As a user, I want to search for other users by name, so that I can find and connect with people I know.

#### Acceptance Criteria

1. WHEN a user types in the search bar, THE Search System SHALL display matching users in real-time
2. WHEN displaying user results, THE Search System SHALL show user avatar, name, and mutual friends count
3. WHEN a user clicks on a user result, THE Search System SHALL navigate to that user's profile page
4. WHEN no users match the search query, THE Search System SHALL display "No users found" message
5. THE Search System SHALL limit user results to maximum 5 items per search

### Requirement 2

**User Story:** As a user, I want to search for posts by content or title, so that I can find specific content I'm interested in.

#### Acceptance Criteria

1. WHEN a user searches for text, THE Search System SHALL return posts containing that text in title or content
2. WHEN displaying post results, THE Search System SHALL show post title, author name, and creation date
3. WHEN a user clicks on a post result, THE Search System SHALL navigate to the full post view
4. THE Search System SHALL search both post titles and post content
5. THE Search System SHALL limit post results to maximum 5 items per search

### Requirement 3

**User Story:** As a user, I want to see search suggestions as I type, so that I can quickly find what I'm looking for without typing the full query.

#### Acceptance Criteria

1. WHEN a user types at least 2 characters, THE Search System SHALL display search suggestions within 300ms
2. WHEN a user types, THE Search System SHALL debounce search requests by 300ms to avoid excessive API calls
3. WHEN displaying mixed results, THE Search System SHALL group results by type with headers ("Users", "Posts")
4. WHEN a user presses Escape key, THE Search System SHALL close the search dropdown
5. WHEN a user clicks outside the search area, THE Search System SHALL close the search dropdown
6. THE Search System SHALL highlight matching text in search results with contextual snippets
7. WHEN search results exceed limits, THE Search System SHALL show "See all results" option

### Requirement 4

**User Story:** As a user, I want to navigate search results using keyboard, so that I can efficiently select results without using mouse.

#### Acceptance Criteria

1. WHEN search dropdown is open, THE Search System SHALL allow navigation using arrow keys with ARIA support
2. WHEN a user presses Enter on a highlighted result, THE Search System SHALL select that result
3. WHEN a user presses Tab, THE Search System SHALL move to the next result
4. THE Search System SHALL visually highlight the currently selected result with proper focus indicators
5. WHEN reaching the end of results with ArrowDown, THE Search System SHALL focus the first result
6. WHEN reaching the beginning of results with ArrowUp, THE Search System SHALL focus the last result

### Requirement 5

**User Story:** As a user, I want to see recent searches, so that I can quickly access previously searched items.

#### Acceptance Criteria

1. WHEN a user clicks on the search bar without typing, THE Search System SHALL display recent searches from localStorage
2. WHEN a user performs a search, THE Search System SHALL save it to recent searches with timestamp
3. THE Search System SHALL limit recent searches to maximum 5 items and remove oldest when exceeded
4. WHEN displaying recent searches, THE Search System SHALL show a clock icon and search text
5. WHEN a user clicks on a recent search, THE Search System SHALL perform that search again

### Requirement 6

**User Story:** As a user, I want intelligent search matching, so that I can find results even with typos or partial matches.

#### Acceptance Criteria

1. THE Search System SHALL support fuzzy matching for user names with diacritics normalization
2. THE Search System SHALL rank results by relevance: exact match, prefix match, then content match
3. WHEN searching Vietnamese text, THE Search System SHALL handle both accented and unaccented input
4. THE Search System SHALL sanitize all search input to prevent injection attacks
5. THE Search System SHALL handle empty queries and whitespace-only queries gracefully

### Requirement 7

**User Story:** As a user, I want to access full search results, so that I can see all matches when dropdown results are limited.

#### Acceptance Criteria

1. WHEN clicking "See all results", THE Search System SHALL navigate to a dedicated search results page with query in URL
2. WHEN on search results page, THE Search System SHALL display results with pagination of 20 items per page
3. THE Search System SHALL maintain search query in URL format /search?q=query for bookmarking and sharing
4. WHEN on search results page, THE Search System SHALL provide filters by content type and date range
5. THE Search System SHALL respect user privacy settings and hide blocked users from results

### Requirement 8

**User Story:** As a developer, I want efficient client-side search, so that users get fast search results without server complexity.

#### Acceptance Criteria

1. THE Search System SHALL perform client-side filtering on data loaded from db.json
2. THE Search System SHALL implement debounced search to avoid excessive filtering operations
3. THE Search System SHALL cache search results in memory during user session
4. THE Search System SHALL limit concurrent search operations to prevent UI blocking
5. THE Search System SHALL provide loading indicators during initial data fetch

### Requirement 9

**User Story:** As a user with accessibility needs, I want keyboard and screen reader support, so that I can use search functionality effectively.

#### Acceptance Criteria

1. THE Search System SHALL implement ARIA roles with listbox for dropdown and option for results
2. THE Search System SHALL provide aria-activedescendant for currently focused search result
3. THE Search System SHALL ensure high contrast highlighting with minimum 4.5:1 contrast ratio
4. THE Search System SHALL announce search result counts to screen readers
5. THE Search System SHALL provide clear focus indicators visible to keyboard-only users

### Requirement 10

**User Story:** As a user, I want privacy-respecting search, so that my search history and data are protected.

#### Acceptance Criteria

1. THE Search System SHALL store recent searches in localStorage with user-specific keys
2. THE Search System SHALL sanitize all search input to prevent XSS attacks
3. THE Search System SHALL respect user privacy by filtering search results based on friendship status
4. THE Search System SHALL not expose sensitive user data in search results
5. THE Search System SHALL allow users to clear their search history from localStorage