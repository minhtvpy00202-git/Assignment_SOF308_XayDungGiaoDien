<template>
  <button 
    class="btn btn-sm"
    :class="isLiked ? 'btn-primary' : 'btn-outline-primary'"
    @click="handleToggleLike"
    :disabled="loading"
  >
    <span v-if="isLiked">❤️</span>
    <span v-else>🤍</span>
    {{ isLiked ? t('post.unlike') : t('post.like') }}
    <span v-if="count > 0" class="badge bg-secondary ms-1">{{ count }}</span>
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
