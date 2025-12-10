<template>
  <div
    :id="id"
    class="search-result-item"
    :class="[`${type}-result`, { 'selected': isSelected }]"
    @click="$emit('select', result)"
    role="option"
    :aria-selected="isSelected"
    tabindex="-1"
  >
    <slot name="icon">
      <!-- Default icon slot -->
    </slot>
    
    <div class="search-result-content">
      <div class="search-result-title" v-html="highlightedTitle"></div>
      <div class="search-result-subtitle">{{ subtitle }}</div>
    </div>
    
    <slot name="actions">
      <!-- Optional actions slot -->
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SearchResult } from '../types'

interface Props {
  id?: string
  result: SearchResult
  isSelected: boolean
  query: string
  type: 'user' | 'post'
  subtitle: string
}

interface Emits {
  select: [result: SearchResult]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Highlight matching text in search results
const highlightedTitle = computed(() => {
  if (!props.query.trim()) return props.result.title
  
  // Escape special regex characters in query
  const escapedQuery = props.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // Create case-insensitive regex
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  
  // Replace matches with highlighted version
  return props.result.title.replace(regex, '<mark class="search-highlight">$1</mark>')
})
</script>

<style scoped>
.search-result-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.search-result-item:hover,
.search-result-item.selected {
  background-color: #f8f9fa;
}

.search-result-item.selected {
  background-color: rgba(24, 119, 242, 0.1);
}

/* Result Content */
.search-result-content {
  flex: 1;
  min-width: 0;
}

.search-result-title {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
  line-height: 1.3;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-result-subtitle {
  color: #666;
  font-size: 0.8rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Search Highlighting */
:deep(.search-highlight) {
  background-color: #fff3cd;
  color: #856404;
  padding: 0.1em 0.2em;
  border-radius: 2px;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
  .search-result-item {
    padding: 0.6rem 0.75rem;
  }
  
  .search-result-title {
    font-size: 0.85rem;
  }
  
  .search-result-subtitle {
    font-size: 0.75rem;
  }
}

/* Focus indicators for keyboard navigation */
.search-result-item:focus-visible {
  outline: 2px solid #1877F2;
  outline-offset: -2px;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .search-result-item {
    transition: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .search-result-item.selected {
    background-color: #000;
    color: #fff;
  }
}
</style>