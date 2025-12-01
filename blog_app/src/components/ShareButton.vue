<template>
  <button 
    class="btn btn-sm btn-outline-success"
    @click="handleShare"
    :disabled="loading"
  >
    🔄 Share
    <span v-if="count > 0" class="badge bg-secondary ms-1">{{ count }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useShares } from '../composables/useShares'
import { useAuth } from '../composables/useAuth'

interface Props {
  postId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  shareCreated: []
}>()

const { sharePost, getShareCount } = useShares()
const { currentUser } = useAuth()

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
