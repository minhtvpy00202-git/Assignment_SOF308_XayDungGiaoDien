<template>
  <SearchResultItem
    :id="id"
    :result="result"
    :is-selected="isSelected"
    :query="query"
    type="user"
    :subtitle="userSubtitle"
    @select="handleSelect"
  >
    <template #icon>
      <img
        :src="result.avatar || 'https://via.placeholder.com/40'"
        :alt="result.title"
        class="search-result-avatar"
        @error="handleImageError"
      />
    </template>
  </SearchResultItem>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocale } from '../composables/useLocale'
import { useFriends } from '../composables/useFriends'
import SearchResultItem from './SearchResultItem.vue'
import type { SearchResult } from '../types'

interface Props {
  id?: string
  result: SearchResult
  isSelected: boolean
  query: string
  currentUserId?: string
}

interface Emits {
  select: [result: SearchResult]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useLocale()
const { getMutualFriendsCount } = useFriends()

const imageError = ref(false)

// Calculate mutual friends count
const mutualFriendsCount = computed(() => {
  if (!props.currentUserId || props.currentUserId === props.result.id) {
    return 0
  }
  return getMutualFriendsCount(props.currentUserId, props.result.id)
})

// Create user subtitle with email and mutual friends info
const userSubtitle = computed(() => {
  const parts = []
  
  // Add email if available
  if (props.result.subtitle) {
    parts.push(props.result.subtitle)
  }
  
  // Add mutual friends count if available and > 0
  if (mutualFriendsCount.value > 0) {
    const friendsText = mutualFriendsCount.value === 1 
      ? t('search.mutualFriend', { count: mutualFriendsCount.value })
      : t('search.mutualFriends', { count: mutualFriendsCount.value })
    parts.push(friendsText)
  }
  
  return parts.join(' • ')
})

const handleSelect = (result: SearchResult) => {
  emit('select', result)
}

const handleImageError = () => {
  imageError.value = true
}
</script>

<style scoped>
.search-result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.75rem;
  border: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

/* Responsive Design */
@media (max-width: 768px) {
  .search-result-avatar {
    width: 32px;
    height: 32px;
    margin-right: 0.6rem;
  }
}
</style>