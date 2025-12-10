import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiService } from '../services/apiService'
import type { 
  SearchResult, 
  SearchResults, 
  SearchableUser, 
  SearchablePost, 
  SearchIndex,
  RecentSearch,
  User
} from '../types'

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

// In-memory cache for search index
let searchIndexCache: SearchIndex | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_RESULTS_PER_CATEGORY = 5
const MAX_RECENT_SEARCHES = 5
const DEBOUNCE_DELAY = 300

export function useSearch(currentUserId?: string): UseSearchReturn {
  const router = useRouter()
  
  // Reactive state
  const query = ref('')
  const results = ref<SearchResults>({ users: [], posts: [], total: 0 })
  const recentSearches = ref<string[]>([])
  const loading = ref(false)
  const selectedIndex = ref(-1)
  const isDropdownOpen = ref(false)
  
  // Debounce timer
  let debounceTimer: number | null = null
  
  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    try {
      const storageKey = `blog360_recent_searches_${currentUserId || 'guest'}`
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const recentData: RecentSearch[] = JSON.parse(stored)
        recentSearches.value = recentData
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_RECENT_SEARCHES)
          .map(item => item.query)
      }
    } catch (error) {
      console.error('Error loading recent searches:', error)
      recentSearches.value = []
    }
  }
  
  // Save recent searches to localStorage
  const saveRecentSearches = () => {
    try {
      const storageKey = `blog360_recent_searches_${currentUserId || 'guest'}`
      const recentData: RecentSearch[] = recentSearches.value.map(q => ({
        query: q,
        timestamp: Date.now(),
        userId: currentUserId
      }))
      localStorage.setItem(storageKey, JSON.stringify(recentData))
    } catch (error) {
      console.error('Error saving recent searches:', error)
    }
  }
  
  // Vietnamese text normalization
  const normalizeVietnameseText = (text: string): string => {
    if (!text) return ''
    
    // Convert to lowercase and remove diacritics
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .trim()
  }
  
  // Input sanitization
  const sanitizeInput = (input: string): string => {
    if (!input) return ''
    
    // Remove HTML tags and special characters that could be used for XSS
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .trim()
      .slice(0, 100) // Limit length to prevent DoS
  }
  
  // Build search index from API data
  const buildSearchIndex = async (): Promise<SearchIndex> => {
    try {
      const [users, posts] = await Promise.all([
        apiService.getUsers(),
        apiService.getPosts()
      ])
      
      // Create searchable users
      const searchableUsers: SearchableUser[] = users.map((user: User) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        searchableText: normalizeVietnameseText(`${user.name} ${user.email}`)
      }))
      
      // Create searchable posts with author names
      const searchablePosts: SearchablePost[] = []
      for (const post of posts) {
        const author = users.find(u => u.id === post.userId)
        searchablePosts.push({
          id: post.id,
          title: post.title,
          content: post.content,
          userId: post.userId,
          authorName: author?.name || 'Unknown',
          createdAt: post.createdAt,
          searchableText: normalizeVietnameseText(`${post.title} ${post.content}`)
        })
      }
      
      return {
        users: searchableUsers,
        posts: searchablePosts,
        lastUpdated: Date.now()
      }
    } catch (error) {
      console.error('Error building search index:', error)
      return { users: [], posts: [], lastUpdated: Date.now() }
    }
  }
  
  // Get or refresh search index
  const getSearchIndex = async (): Promise<SearchIndex> => {
    const now = Date.now()
    
    // Return cached index if still valid
    if (searchIndexCache && (now - searchIndexCache.lastUpdated) < CACHE_DURATION) {
      return searchIndexCache
    }
    
    // Build new index
    searchIndexCache = await buildSearchIndex()
    return searchIndexCache
  }
  
  // Perform search with ranking
  const performSearch = async (searchQuery: string): Promise<SearchResults> => {
    if (!searchQuery.trim()) {
      return { users: [], posts: [], total: 0 }
    }
    
    const sanitizedQuery = sanitizeInput(searchQuery)
    const normalizedQuery = normalizeVietnameseText(sanitizedQuery)
    
    if (!normalizedQuery) {
      return { users: [], posts: [], total: 0 }
    }
    
    const searchIndex = await getSearchIndex()
    
    // Search users
    const userResults: SearchResult[] = []
    for (const user of searchIndex.users) {
      const searchableText = user.searchableText
      const normalizedName = normalizeVietnameseText(user.name)
      
      let matchScore = 0
      let matchType = ''
      
      // Exact match (highest priority)
      if (normalizedName === normalizedQuery) {
        matchScore = 100
        matchType = 'exact'
      }
      // Prefix match
      else if (normalizedName.startsWith(normalizedQuery)) {
        matchScore = 80
        matchType = 'prefix'
      }
      // Contains match
      else if (searchableText.includes(normalizedQuery)) {
        matchScore = 60
        matchType = 'contains'
      }
      
      if (matchScore > 0) {
        userResults.push({
          id: user.id,
          type: 'user',
          title: user.name,
          subtitle: user.email,
          avatar: user.avatar,
          url: `/profile/${user.id}`,
          matchedText: matchType
        })
      }
    }
    
    // Search posts
    const postResults: SearchResult[] = []
    for (const post of searchIndex.posts) {
      const searchableText = post.searchableText
      const normalizedTitle = normalizeVietnameseText(post.title)
      
      let matchScore = 0
      let matchType = ''
      
      // Exact title match
      if (normalizedTitle === normalizedQuery) {
        matchScore = 100
        matchType = 'exact'
      }
      // Title prefix match
      else if (normalizedTitle.startsWith(normalizedQuery)) {
        matchScore = 80
        matchType = 'prefix'
      }
      // Title contains match
      else if (normalizedTitle.includes(normalizedQuery)) {
        matchScore = 70
        matchType = 'title'
      }
      // Content contains match
      else if (searchableText.includes(normalizedQuery)) {
        matchScore = 50
        matchType = 'content'
      }
      
      if (matchScore > 0) {
        postResults.push({
          id: post.id,
          type: 'post',
          title: post.title,
          subtitle: `${post.authorName} • ${new Date(post.createdAt).toLocaleDateString()}`,
          url: `/post/${post.id}`,
          matchedText: matchType
        })
      }
    }
    
    // Sort by match score (exact > prefix > contains)
    const sortByRelevance = (a: SearchResult, b: SearchResult) => {
      const scoreMap = { exact: 100, prefix: 80, title: 70, contains: 60, content: 50 }
      const scoreA = scoreMap[a.matchedText as keyof typeof scoreMap] || 0
      const scoreB = scoreMap[b.matchedText as keyof typeof scoreMap] || 0
      return scoreB - scoreA
    }
    
    userResults.sort(sortByRelevance)
    postResults.sort(sortByRelevance)
    
    // Limit results per category
    const limitedUsers = userResults.slice(0, MAX_RESULTS_PER_CATEGORY)
    const limitedPosts = postResults.slice(0, MAX_RESULTS_PER_CATEGORY)
    
    return {
      users: limitedUsers,
      posts: limitedPosts,
      total: limitedUsers.length + limitedPosts.length
    }
  }
  
  // Main search function with debouncing
  const search = async (searchQuery: string) => {
    query.value = searchQuery
    
    // Clear previous debounce timer
    if (debounceTimer) {
      window.clearTimeout(debounceTimer)
    }
    
    // Handle empty query
    if (!searchQuery.trim()) {
      results.value = { users: [], posts: [], total: 0 }
      isDropdownOpen.value = false
      selectedIndex.value = -1
      return
    }
    
    // Set loading state
    loading.value = true
    isDropdownOpen.value = true
    
    // Debounce the search
    debounceTimer = window.setTimeout(async () => {
      try {
        const searchResults = await performSearch(searchQuery)
        results.value = searchResults
        selectedIndex.value = -1
      } catch (error) {
        console.error('Search error:', error)
        results.value = { users: [], posts: [], total: 0 }
      } finally {
        loading.value = false
      }
    }, DEBOUNCE_DELAY)
  }
  
  // Clear search
  const clearSearch = () => {
    query.value = ''
    results.value = { users: [], posts: [], total: 0 }
    isDropdownOpen.value = false
    selectedIndex.value = -1
    loading.value = false
    
    if (debounceTimer) {
      window.clearTimeout(debounceTimer)
    }
  }
  
  // Select a search result
  const selectResult = (result: SearchResult) => {
    addToRecent(query.value)
    clearSearch()
    // Navigate after clearing search to ensure clean state
    router.push(result.url)
  }
  
  // Add query to recent searches
  const addToRecent = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const trimmedQuery = searchQuery.trim()
    
    // Remove if already exists
    const filtered = recentSearches.value.filter(q => q !== trimmedQuery)
    
    // Add to beginning
    recentSearches.value = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES)
    
    // Save to localStorage
    saveRecentSearches()
  }
  
  // Clear recent searches
  const clearRecent = () => {
    recentSearches.value = []
    try {
      const storageKey = `blog360_recent_searches_${currentUserId || 'guest'}`
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Error clearing recent searches:', error)
    }
  }
  
  // Keyboard navigation
  const handleKeyboard = (event: KeyboardEvent) => {
    if (!isDropdownOpen.value) return
    
    // Handle recent searches when no query
    if (!query.value.trim() && recentSearches.value.length > 0) {
      const maxIndex = recentSearches.value.length - 1
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          selectedIndex.value = selectedIndex.value >= maxIndex ? 0 : selectedIndex.value + 1
          break
          
        case 'ArrowUp':
          event.preventDefault()
          selectedIndex.value = selectedIndex.value <= 0 ? maxIndex : selectedIndex.value - 1
          break
          
        case 'Enter':
          event.preventDefault()
          if (selectedIndex.value >= 0 && selectedIndex.value <= maxIndex) {
            const selectedQuery = recentSearches.value[selectedIndex.value]
            if (selectedQuery) {
              query.value = selectedQuery
              search(selectedQuery)
            }
          }
          break
          
        case 'Escape':
          event.preventDefault()
          clearSearch()
          break
          
        case 'Tab':
          event.preventDefault()
          // Cycle through recent searches
          selectedIndex.value = selectedIndex.value >= maxIndex ? 0 : selectedIndex.value + 1
          break
      }
      return
    }
    
    // Handle search results navigation
    if (results.value.total === 0) return
    
    const allResults = [...results.value.users, ...results.value.posts]
    const maxIndex = allResults.length - 1
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        selectedIndex.value = selectedIndex.value >= maxIndex ? 0 : selectedIndex.value + 1
        break
        
      case 'ArrowUp':
        event.preventDefault()
        selectedIndex.value = selectedIndex.value <= 0 ? maxIndex : selectedIndex.value - 1
        break
        
      case 'Enter':
        event.preventDefault()
        if (selectedIndex.value >= 0 && selectedIndex.value <= maxIndex) {
          const selectedResult = allResults[selectedIndex.value]
          if (selectedResult) {
            selectResult(selectedResult)
          }
        }
        break
        
      case 'Escape':
        event.preventDefault()
        clearSearch()
        break
        
      case 'Tab':
        event.preventDefault()
        // Cycle through search results
        selectedIndex.value = selectedIndex.value >= maxIndex ? 0 : selectedIndex.value + 1
        break
    }
  }
  
  // Initialize recent searches
  loadRecentSearches()
  
  return {
    query,
    results,
    recentSearches,
    loading,
    selectedIndex,
    isDropdownOpen,
    search,
    clearSearch,
    selectResult,
    addToRecent,
    clearRecent,
    handleKeyboard
  }
}