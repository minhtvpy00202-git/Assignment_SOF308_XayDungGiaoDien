<template>
  <div class="message-input-container">
    <form @submit.prevent="handleSubmit" class="d-flex gap-2">
      <div class="flex-grow-1">
        <input
          v-model="messageContent"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': validationError }"
          placeholder="Type a message..."
          :disabled="sending"
          @input="clearError"
        />
        <div v-if="validationError" class="invalid-feedback d-block">
          {{ validationError }}
        </div>
      </div>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="sending || !messageContent.trim()"
      >
        <span v-if="sending" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        {{ sending ? 'Sending...' : 'Send' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  send: [content: string]
}>()

const messageContent = ref('')
const validationError = ref('')
const sending = ref(false)

const clearError = () => {
  validationError.value = ''
}

const handleSubmit = async () => {
  // Validate empty message
  if (!messageContent.value.trim()) {
    validationError.value = 'Message cannot be empty'
    return
  }

  sending.value = true
  validationError.value = ''

  try {
    emit('send', messageContent.value.trim())
    // Clear input after successful send
    messageContent.value = ''
  } catch (error) {
    validationError.value = 'Failed to send message. Please try again.'
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.message-input-container {
  padding: 1rem;
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.btn-primary {
  min-width: 80px;
}
</style>
