<template>
  <button 
    class="btn btn-sm btn-light like-button"
    :class="{ 'liked': isLiked }"
    @click="handleToggleLike"
    :disabled="loading"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path v-if="isLiked" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
      <path v-else d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLikes } from '../composables/useLikes'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'

interface Props {
  postId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  likeToggled: []
}>()

const { toggleLike, getLikeCount, isLikedByUser } = useLikes()
const { currentUser } = useAuth()
const { t } = useLocale()

const isLiked = ref(false)
const count = ref(0)
const loading = ref(false)

const loadLikeStatus = async () => {
  try {
    count.value = await getLikeCount(props.postId)
    
    if (currentUser.value) {
      isLiked.value = await isLikedByUser(props.postId, currentUser.value.id)
    }
  } catch (error) {
    console.error('Failed to load like status:', error)
  }
}

const handleToggleLike = async () => {
  if (!currentUser.value) {
    alert('Please login to like posts')
    return
  }

  loading.value = true
  try {
    await toggleLike(props.postId)
    await loadLikeStatus()
    emit('likeToggled')
  } catch (error) {
    console.error('Failed to toggle like:', error)
    alert('Failed to toggle like')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLikeStatus()
})
</script>

<style scoped>
.like-button {
  border: none;
  background-color: transparent;
  color: #65676b;
  transition: all 0.2s ease;
  padding: 0.375rem 0.75rem;
}

.like-button:hover {
  background-color: #f0f2f5;
}

.like-button.liked {
  color: #e4405f;
}

.like-button svg {
  display: block;
}
</style>
