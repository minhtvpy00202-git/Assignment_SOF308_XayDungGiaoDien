<template>
  <div
    v-if="isOpen"
    :id="id"
    class="search-dropdown"
    role="listbox"
    :aria-label="t('search.resultsLabel')"
    :aria-activedescendant="getActiveDescendantId()"
    @mousedown.prevent
  >
    <!-- Loading State -->
    <div v-if="loading" class="search-loading">
      <div class="spinner-border spinner-border-sm me-2" role="status">
        <span class="visually-hidden">{{ t('search.loading') }}</span>
      </div>
      {{ t('search.searching') }}
    </div>

    <!-- Recent Searches (when no query) -->
    <div v-else-if="!query.trim() && recentSearches.length > 0" class="search-section">
      <div class="search-section-header">
        <h6 class="search-section-title">{{ t('search.recent') }}</h6>
        <button
          @click="$emit('clearRecent')"
          class="btn-clear-recent"
          :aria-label="t('search.clearRecent')"
        >
          {{ t('search.clearAll') }}
        </button>
      </div>
      <div class="search-results">
        <div
          v-for="(recentQuery, index) in recentSearches"
          :key="`recent-${index}`"
          :id="`recent-search-${index}`"
          class="search-result-item recent-search"
          :class="{ 'selected': selectedIndex === index }"
          @click="$emit('selectRecent', recentQuery)"
          role="option"
          :aria-selected="selectedIndex === index"
        >
          <i class="bi bi-clock-history search-result-icon"></i>
          <span class="search-result-text">{{ recentQuery }}</span>
          <button
            @click.stop="removeRecentSearch()"
            class="btn-remove-recent"
            :aria-label="t('search.removeRecent', { query: recentQuery })"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div v-else-if="results.total > 0" class="search-results-container">
      <!-- Users Section -->
      <div v-if="results.users.length > 0" class="search-section">
        <h6 class="search-section-title">{{ t('search.users') }}</h6>
        <div class="search-results">
          <UserResult
            v-for="(user, index) in results.users"
            :key="`user-${user.id}`"
            :id="`user-result-${index}`"
            :result="user"
            :is-selected="selectedIndex === index"
            :query="query"
            :current-user-id="currentUserId"
            @select="$emit('selectResult', $event)"
          />
        </div>
      </div>

      <!-- Posts Section -->
      <div v-if="results.posts.length > 0" class="search-section">
        <h6 class="search-section-title">{{ t('search.posts') }}</h6>
        <div class="search-results">
          <PostResult
            v-for="(post, index) in results.posts"
            :key="`post-${post.id}`"
            :id="`post-result-${index}`"
            :result="post"
            :is-selected="selectedIndex === (results.users.length + index)"
            :query="query"
            @select="$emit('selectResult', $event)"
          />
        </div>
      </div>

      <!-- See All Results -->
      <div v-if="hasMoreResults" class="search-section">
        <div class="search-see-all">
          <router-link
            :to="`/search?q=${encodeURIComponent(query)}`"
            class="search-see-all-link"
            @click="$emit('close')"
          >
            <i class="bi bi-search me-2"></i>
            {{ t('search.seeAllResults', { query }) }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div v-else-if="query.trim() && !loading" class="search-no-results">
      <i class="bi bi-search search-no-results-icon"></i>
      <div class="search-no-results-text">
        {{ t('search.noResults', { query }) }}
      </div>
      <div class="search-no-results-suggestion">
        {{ t('search.noResultsSuggestion') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../composables/useLocale'
import UserResult from './UserResult.vue'
import PostResult from './PostResult.vue'
import type { SearchResults, SearchResult } from '../types'

interface Props {
  id?: string
  isOpen: boolean
  results: SearchResults
  recentSearches: string[]
  loading: boolean
  selectedIndex: number
  query: string
  currentUserId?: string
}

interface Emits {
  selectResult: [result: SearchResult]
  selectRecent: [query: string]
  clearRecent: []
  close: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useLocale()

// Check if there are more results than displayed (for "See all results" link)
const hasMoreResults = computed(() => {
  const maxResultsPerCategory = 5
  return props.results.users.length >= maxResultsPerCategory || 
         props.results.posts.length >= maxResultsPerCategory
})

// Remove a specific recent search
const removeRecentSearch = () => {
  // This would typically be handled by the parent component
  // For now, we'll emit a custom event to clear all recent searches
  emit('clearRecent') // Simplified - in real implementation, would remove specific item
}

// Generate active descendant ID for ARIA
const getActiveDescendantId = () => {
  if (props.selectedIndex < 0) return ''
  
  // For recent searches
  if (!props.query.trim() && props.recentSearches.length > 0) {
    return `recent-search-${props.selectedIndex}`
  }
  
  // For search results
  if (props.results.total > 0) {
    const userCount = props.results.users.length
    if (props.selectedIndex < userCount) {
      return `user-result-${props.selectedIndex}`
    } else {
      return `post-result-${props.selectedIndex - userCount}`
    }
  }
  
  return ''
}
</script>

<style scoped>
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 9999;
  margin-top: 8px;
  animation: slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Loading State */
.search-loading {
  padding: 1rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Section Headers */
.search-section {
  border-bottom: 1px solid #f0f0f0;
}

.search-section:last-child {
  border-bottom: none;
}

.search-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem 0.5rem;
}

.search-section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.btn-clear-recent {
  background: none;
  border: none;
  color: #1877F2;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.btn-clear-recent:hover {
  background-color: rgba(24, 119, 242, 0.1);
}

/* Results Container */
.search-results {
  padding: 0;
}

/* Individual Result Items - styles now handled by child components */

/* Recent Search Items */
.recent-search {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  position: relative;
}

.recent-search:hover,
.recent-search.selected {
  background-color: #f8f9fa;
}

.recent-search.selected {
  background-color: rgba(24, 119, 242, 0.1);
}

.recent-search .search-result-icon {
  color: #666;
  font-size: 1rem;
  margin-right: 0.75rem;
  width: 20px;
  text-align: center;
}

.recent-search .search-result-text {
  flex: 1;
  color: #333;
  font-size: 0.9rem;
}

.btn-remove-recent {
  background: none;
  border: none;
  color: #999;
  padding: 0.25rem;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
}

.recent-search:hover .btn-remove-recent {
  opacity: 1;
}

.btn-remove-recent:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: #666;
}

/* Result styles now handled by individual components */

/* See All Results */
.search-see-all {
  padding: 0.75rem 1rem;
}

.search-see-all-link {
  display: flex;
  align-items: center;
  color: #1877F2;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.search-see-all-link:hover {
  background-color: rgba(24, 119, 242, 0.1);
  color: #1877F2;
}

/* No Results */
.search-no-results {
  padding: 2rem 1rem;
  text-align: center;
  color: #666;
}

.search-no-results-icon {
  font-size: 2rem;
  color: #ccc;
  margin-bottom: 0.75rem;
}

.search-no-results-text {
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #333;
}

.search-no-results-suggestion {
  font-size: 0.85rem;
  color: #666;
}

/* Responsive Design */
@media (max-width: 768px) {
  .search-dropdown {
    max-height: 300px;
  }
  
  .recent-search {
    padding: 0.6rem 0.75rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .btn-clear-recent,
  .search-see-all-link {
    transition: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .search-dropdown {
    border-color: #000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .search-section {
    border-bottom-color: #666;
  }
}
</style>