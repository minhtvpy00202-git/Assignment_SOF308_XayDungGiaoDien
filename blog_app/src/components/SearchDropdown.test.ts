import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchDropdown from './SearchDropdown.vue'
import type { SearchResults } from '../types'

// Mock the useLocale composable
const mockT = (key: string, params?: any) => {
  const translations: Record<string, string> = {
    'search.resultsLabel': 'Search results',
    'search.loading': 'Loading...',
    'search.searching': 'Searching...',
    'search.recent': 'Recent searches',
    'search.clearAll': 'Clear all',
    'search.users': 'People',
    'search.posts': 'Posts',
    'search.noResults': `No results found for "${params?.query || ''}"`,
    'search.noResultsSuggestion': 'Try different keywords or check your spelling',
    'search.seeAllResults': `See all results for "${params?.query || ''}"`,
    'search.removeRecent': `Remove "${params?.query || ''}" from recent searches`
  }
  return translations[key] || key
}

vi.mock('../composables/useLocale', () => ({
  useLocale: () => ({
    t: mockT
  })
}))

describe('SearchDropdown', () => {
  const defaultProps = {
    isOpen: true,
    results: { users: [], posts: [], total: 0 } as SearchResults,
    recentSearches: [],
    loading: false,
    selectedIndex: -1,
    query: ''
  }

  it('renders when open', () => {
    const wrapper = mount(SearchDropdown, {
      props: defaultProps
    })
    
    expect(wrapper.find('.search-dropdown').exists()).toBe(true)
  })

  it('does not render when closed', () => {
    const wrapper = mount(SearchDropdown, {
      props: {
        ...defaultProps,
        isOpen: false
      }
    })
    
    expect(wrapper.find('.search-dropdown').exists()).toBe(false)
  })

  it('shows loading state', () => {
    const wrapper = mount(SearchDropdown, {
      props: {
        ...defaultProps,
        loading: true
      }
    })
    
    expect(wrapper.find('.search-loading').exists()).toBe(true)
    expect(wrapper.text()).toContain('Searching...')
  })

  it('shows recent searches when no query', () => {
    const wrapper = mount(SearchDropdown, {
      props: {
        ...defaultProps,
        recentSearches: ['test query', 'another search']
      }
    })
    
    expect(wrapper.find('.recent-search').exists()).toBe(true)
    expect(wrapper.text()).toContain('Recent searches')
    expect(wrapper.text()).toContain('test query')
  })

  it('shows search results with users and posts', () => {
    const mockResults: SearchResults = {
      users: [
        {
          id: '1',
          type: 'user',
          title: 'John Doe',
          subtitle: 'john@example.com',
          avatar: 'avatar.jpg',
          url: '/profile/1'
        }
      ],
      posts: [
        {
          id: '1',
          type: 'post',
          title: 'Test Post',
          subtitle: 'John Doe • 2023-01-01',
          url: '/post/1'
        }
      ],
      total: 2
    }

    const wrapper = mount(SearchDropdown, {
      props: {
        ...defaultProps,
        results: mockResults,
        query: 'test'
      }
    })
    
    expect(wrapper.text()).toContain('People')
    expect(wrapper.text()).toContain('Posts')
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Test Post')
  })

  it('shows no results message', () => {
    const wrapper = mount(SearchDropdown, {
      props: {
        ...defaultProps,
        query: 'nonexistent'
      }
    })
    
    expect(wrapper.find('.search-no-results').exists()).toBe(true)
    expect(wrapper.text()).toContain('No results found for "nonexistent"')
  })

  it('emits selectResult when user result is clicked', async () => {
    const mockResults: SearchResults = {
      users: [
        {
          id: '1',
          type: 'user',
          title: 'John Doe',
          subtitle: 'john@example.com',
          avatar: 'avatar.jpg',
          url: '/profile/1'
        }
      ],
      posts: [],
      total: 1
    }

    const wrapper = mount(SearchDropdown, {
      props: {
        ...defaultProps,
        results: mockResults,
        query: 'john'
      }
    })
    
    await wrapper.find('.user-result').trigger('click')
    
    expect(wrapper.emitted('selectResult')).toBeTruthy()
    expect(wrapper.emitted('selectResult')?.[0]).toEqual([mockResults.users[0]])
  })

  it('shows "See all results" link when there are many results', () => {
    const mockResults: SearchResults = {
      users: Array(5).fill(null).map((_, i) => ({
        id: `${i}`,
        type: 'user' as const,
        title: `User ${i}`,
        subtitle: `user${i}@example.com`,
        url: `/profile/${i}`
      })),
      posts: Array(5).fill(null).map((_, i) => ({
        id: `${i}`,
        type: 'post' as const,
        title: `Post ${i}`,
        subtitle: `Author • Date`,
        url: `/post/${i}`
      })),
      total: 10
    }

    const wrapper = mount(SearchDropdown, {
      props: {
        ...defaultProps,
        results: mockResults,
        query: 'test'
      }
    })
    
    expect(wrapper.find('.search-see-all-link').exists()).toBe(true)
    expect(wrapper.text()).toContain('See all results for "test"')
  })
})