# Search Functionality Design Document

## Overview

The search functionality provides users with a comprehensive way to find other users and posts within the Blog360 application. The system implements a client-side search approach using data from db.json, with real-time suggestions displayed in a dropdown interface similar to Facebook's search experience.

## Architecture

### High-Level Architecture
```
SearchBar Component (Navbar)
    ↓
useSearch Composable
    ↓
SearchDropdown Component
    ↓
SearchResults Component
    ↓
apiService (db.json data)
```

### Component Hierarchy
- **SearchBar**: Input field in navbar with dropdown trigger
- **SearchDropdown**: Overlay container for search results
- **SearchResults**: Displays categorized results (Users/Posts)
- **SearchResultItem**: Individual result item with navigation
- **RecentSearches**: Shows recent search history

## Components and Interfaces

### SearchBar Component
```typescript
interface SearchBarProps {
  placeholder?: string
  autoFocus?: boolean
}

interface SearchBarEmits {
  search: [query: string]
  focus: []
  blur: []
}
```

### SearchDropdown Component
```typescript
interface SearchDropdownProps {
  isOpen: boolean
  results: SearchResults
  recentSearches: string[]
  loading: boolean
  selectedIndex: number
}

interface SearchDropdownEmits {
  selectResult: [result: SearchResult]
  selectRecent: [query: string]
  close: []
}
```

### useSearch Composable
```typescript
interface SearchResult {
  id: string
  type: 'user' | 'post'
  title: string
  subtitle?: string
  avatar?: string
  url: string
  matchedText?: string
}

interface SearchResults {
  users: SearchResult[]
  posts: SearchResult[]
  total: number
}

interface UseSearchReturn {
  query: Ref<string>
  results: Ref<SearchResults>
  recentSearches: Ref<string[]>
  loading: Ref<boolean>
  selectedIndex: Ref<number>
  isDropdownOpen: Ref<boolean>
  
  search: (query: string) => Promise<void>
  clearSearch: () => void
  selectResult: (result: SearchResult) => void
  addToRecent: (query: string) => void
  clearRecent: () => void
  handleKeyboard: (event: KeyboardEvent) => void
}
```

## Data Models

### Search Data Structure
```typescript
interface SearchableUser {
  id: string
  name: string
  email: string
  avatar: string
  searchableText: string // normalized name for searching
}

interface SearchablePost {
  id: string
  title: string
  content: string
  userId: string
  authorName: string
  createdAt: string
  searchableText: string // title + content normalized
}

interface SearchIndex {
  users: SearchableUser[]
  posts: SearchablePost[]
  lastUpdated: number
}
```

### Recent Searches Storage
```typescript
interface RecentSearch {
  query: string
  timestamp: number
  userId?: string
}

// localStorage key: `blog360_recent_searches_${userId || 'guest'}`
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Search Result Matching Consistency
*For any* search query and database of users/posts, all returned results should contain the search term in name, title, or content fields
**Validates: Requirements 1.1, 2.1, 2.4**

### Property 2: Result Limit Enforcement
*For any* search query that would return more than 5 results per category, the system should return exactly 5 users and 5 posts maximum
**Validates: Requirements 1.5, 2.5**

### Property 3: Debounced Search Behavior
*For any* sequence of rapid typing events, the search system should only execute search after the debounce period without intermediate searches
**Validates: Requirements 3.2, 8.2**

### Property 4: Keyboard Navigation Cycling
*For any* search dropdown with N results, pressing ArrowDown on the last result should focus the first result, and ArrowUp on the first should focus the last
**Validates: Requirements 4.5, 4.6**

### Property 5: Recent Search Management
*For any* sequence of search queries, the system should maintain at most 5 recent searches in localStorage, removing the oldest when exceeded
**Validates: Requirements 5.2, 5.3**

### Property 6: Vietnamese Text Normalization
*For any* Vietnamese search query with or without diacritics, the system should find matching results regardless of accent presence in either query or data
**Validates: Requirements 6.1, 6.3**

### Property 7: Search Input Sanitization
*For any* user input containing HTML, JavaScript, or special characters, the search system should safely process it without executing malicious code
**Validates: Requirements 6.4, 10.2**

### Property 8: Result Ranking Consistency
*For any* search results, exact matches should appear before prefix matches, which should appear before content matches
**Validates: Requirements 6.2**

### Property 9: Privacy Filtering Completeness
*For any* search results, users who have blocked the current user or set privacy to non-searchable should never appear in results
**Validates: Requirements 7.5, 10.3**

### Property 10: ARIA Accessibility Compliance
*For any* search dropdown state, the component should have proper ARIA roles, aria-activedescendant pointing to the focused result, and announce result counts
**Validates: Requirements 9.1, 9.2, 9.4**

### Property 11: Result Display Format Consistency
*For any* user result, the display should include avatar, name, and mutual friends count; for any post result, the display should include title, author name, and creation date
**Validates: Requirements 1.2, 2.2**

### Property 12: Search History Persistence
*For any* executed search query, it should be stored in localStorage with user-specific keys and be retrievable in subsequent sessions
**Validates: Requirements 5.1, 5.2, 10.1**

## Error Handling

### Client-Side Error Scenarios
1. **Network Failure**: Show cached results if available, display offline message
2. **Invalid Input**: Sanitize and continue with cleaned input
3. **Empty Results**: Display "No results found" with suggestions
4. **localStorage Full**: Clear oldest recent searches automatically
5. **Component Mount Errors**: Graceful degradation to basic search

### Error Recovery Strategies
- Retry failed API calls with exponential backoff
- Cache successful search results for offline access
- Provide fallback UI when components fail to load
- Log errors to console for debugging without exposing to users

## Testing Strategy

### Unit Testing Approach
- Test search filtering algorithms with various input combinations
- Verify keyboard navigation logic with simulated key events
- Test localStorage operations for recent searches
- Validate input sanitization with malicious input samples

### Property-Based Testing Requirements
- Use **fast-check** library for JavaScript property-based testing
- Configure each property test to run minimum 100 iterations
- Tag each test with format: **Feature: search-functionality, Property {number}: {property_text}**
- Each correctness property must be implemented by a single property-based test

### Integration Testing
- Test complete search flow from input to result selection
- Verify dropdown positioning and responsive behavior
- Test search with real db.json data structure
- Validate navigation integration with Vue Router

### Accessibility Testing
- Verify ARIA attributes with automated tools
- Test keyboard-only navigation scenarios
- Validate screen reader announcements
- Check color contrast ratios for highlighted results

## Performance Considerations

### Client-Side Optimization
- Implement search index caching in memory
- Use Web Workers for heavy search operations if needed
- Debounce search input to reduce computation
- Lazy load search dropdown component
- Implement virtual scrolling for large result sets

### Memory Management
- Clear search cache when memory usage is high
- Limit recent searches to prevent localStorage bloat
- Use weak references for cached search results
- Implement cleanup on component unmount

### Search Algorithm Efficiency
- Pre-process searchable text for faster matching
- Use efficient string matching algorithms (Boyer-Moore for exact matches)
- Implement fuzzy matching with reasonable performance limits
- Cache normalized search terms to avoid repeated processing

## Security Considerations

### Input Validation
- Sanitize all search input to prevent XSS attacks
- Limit search query length to prevent DoS
- Validate result selection to prevent unauthorized navigation
- Escape special characters in search highlighting

### Privacy Protection
- Filter results based on user privacy settings
- Don't expose sensitive user information in search results
- Respect blocked user relationships
- Implement search result access control

### Data Protection
- Store recent searches with user-specific keys
- Encrypt sensitive data in localStorage if needed
- Implement secure session management for search history
- Provide user controls for search data deletion