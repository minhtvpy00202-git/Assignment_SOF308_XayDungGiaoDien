<template>
  <div class="comment-form">
    <form @submit.prevent="handleSubmit">
      <div class="d-flex gap-2">
        <input
          v-model="commentContent"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': error }"
          :placeholder="t('post.writeComment')"
          :disabled="loading"
        />
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading || !commentContent.trim()"
        >
          {{ loading ? t('common.loading') : t('post.postComment') }}
        </button>
      </div>
      <div v-if="error" class="invalid-feedback d-block">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useComments } from '../composables/useComments'
import { useLocale } from '../composables/useLocale'

interface Props {
  postId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  commentCreated: []
}>()

const { createComment } = useComments()
const { t } = useLocale()

const commentContent = ref('')
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!commentContent.value.trim()) {
    error.value = t('validation.required')
    return
  }

  loading.value = true
  error.value = ''

  try {
    await createComment({
      postId: props.postId,
      content: commentContent.value.trim()
    })

    // Clear the input on success
    commentContent.value = ''
    
    // Emit event to parent to refresh comments
    emit('commentCreated')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to post comment'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.comment-form {
  margin-top: 1rem;
}

.gap-2 {
  gap: 0.5rem;
}
</style>
