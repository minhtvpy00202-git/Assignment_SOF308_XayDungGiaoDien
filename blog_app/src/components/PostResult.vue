<template>
  <SearchResultItem
    :id="id"
    :result="result"
    :is-selected="isSelected"
    :query="query"
    type="post"
    :subtitle="postSubtitle"
    @select="handleSelect"
  >
    <template #icon>
      <div class="search-result-icon post-icon">
        <i class="bi bi-file-text"></i>
      </div>
    </template>
  </SearchResultItem>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../composables/useLocale'
import SearchResultItem from './SearchResultItem.vue'
import type { SearchResult } from '../types'

interface Props {
  id?: string
  result: SearchResult
  isSelected: boolean
  query: string
}

interface Emits {
  select: [result: SearchResult]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useLocale()

// Format post subtitle with author and date
const postSubtitle = computed(() => {
  if (!props.result.subtitle) {
    return t('search.unknownAuthor')
  }
  
  // The subtitle should already be formatted as "Author • Date" from useSearch
  return props.result.subtitle
})

const handleSelect = (result: SearchResult) => {
  emit('select', result)
}
</script>

<style scoped>
.search-result-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-right: 0.75rem;
  color: #666;
  font-size: 1.2rem;
}

.post-icon {
  color: #1877F2;
}

/* Responsive Design */
@media (max-width: 768px) {
  .search-result-icon {
    width: 32px;
    height: 32px;
    margin-right: 0.6rem;
    font-size: 1rem;
  }
}
</style>