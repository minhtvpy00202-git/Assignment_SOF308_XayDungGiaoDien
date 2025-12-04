<template>
  <button 
    class="btn btn-sm btn-light share-button"
    @click="handleShare"
    :disabled="loading"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useShares } from '../composables/useShares'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'

interface Props {
  postId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  shareCreated: []
}>()

const { sharePost, getShareCount } = useShares()
const { currentUser } = useAuth()
const { t } = useLocale()

const count = ref(0)
const loading = ref(false)

const loadShareCount = async () => {
  try {
    count.value = await getShareCount(props.postId)
  } catch (error) {
    console.error('Failed to load share count:', error)
  }
}

const handleShare = async () => {
  if (!currentUser.value) {
    alert('Please login to share posts')
    return
  }

  loading.value = true
  try {
    await sharePost(props.postId)
    await loadShareCount()
    emit('shareCreated')
    alert('Post shared successfully!')
  } catch (error) {
    console.error('Failed to share post:', error)
    alert('Failed to share post')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadShareCount()
})
</script>

<style scoped>
.share-button {
  border: none;
  background-color: transparent;
  color: #65676b;
  transition: all 0.2s ease;
  padding: 0.375rem 0.75rem;
}

.share-button:hover {
  background-color: #f0f2f5;
}

.share-button svg {
  display: block;
}
</style>
