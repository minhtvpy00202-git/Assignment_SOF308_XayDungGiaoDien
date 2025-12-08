<template>
  <div v-if="isOpen" class="chat-popup">
    <div class="chat-popup-header">
      <div class="d-flex align-items-center">
        <img :src="otherUser?.avatar" :alt="otherUser?.name" class="rounded-circle me-2" width="32" height="32">
        <div>
          <h6 class="mb-0">{{ otherUser?.name }}</h6>
          <small class="text-muted">{{ t('messages.active') }}</small>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button @click="minimize" class="btn btn-sm btn-link text-white p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
          </svg>
        </button>
        <button @click="close" class="btn btn-sm btn-link text-white p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="chat-popup-body" ref="messagesContainer">
      <div v-for="message in messages" :key="message.id" class="message-wrapper" :class="{ 'own-message': message.senderId === currentUser?.id }">
        <div class="message-bubble">
          {{ message.content }}
        </div>
      </div>
    </div>

    <div class="chat-popup-footer">
      <input 
        v-model="newMessage" 
        type="text" 
        class="form-control form-control-sm" 
        :placeholder="t('messages.typeMessage')"
        @keyup.enter="sendMessage"
      >
      <button @click="sendMessage" class="btn btn-primary btn-sm ms-2" :disabled="!newMessage.trim()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Message, User } from '../types'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'
import { useMessages } from '../composables/useMessages'

interface Props {
  otherUser: User | null
  conversationId: string
  initialMessages: Message[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  minimize: []
}>()

const { currentUser } = useAuth()
const { t } = useLocale()
const { sendMessage: sendMsg } = useMessages()

const isOpen = ref(true)
const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const messages = ref<Message[]>(props.initialMessages)

// Watch for new messages from parent
watch(() => props.initialMessages, (newMessages) => {
  messages.value = newMessages
  scrollToBottom()
}, { deep: true })

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !currentUser.value || !props.otherUser) return

  try {
    await sendMsg(props.otherUser.id, newMessage.value.trim())
    newMessage.value = ''
    scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}

const minimize = () => {
  emit('minimize')
}

const close = () => {
  emit('close')
}

// Scroll to bottom on mount
scrollToBottom()
</script>

<style scoped>
.chat-popup {
  position: fixed;
  bottom: 0;
  right: 80px;
  width: 328px;
  height: 455px;
  background: white;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.chat-popup-header {
  background: linear-gradient(135deg, #0084ff 0%, #0066cc 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-popup-header h6 {
  font-size: 14px;
  font-weight: 600;
}

.chat-popup-header small {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.chat-popup-header .btn-link {
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.chat-popup-header .btn-link:hover {
  opacity: 1;
}

.chat-popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f0f2f5;
}

.message-wrapper {
  display: flex;
  margin-bottom: 8px;
}

.message-wrapper.own-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 18px;
  background: #e4e6eb;
  color: #050505;
  font-size: 14px;
  word-wrap: break-word;
}

.own-message .message-bubble {
  background: #0084ff;
  color: white;
}

.chat-popup-footer {
  padding: 12px;
  border-top: 1px solid #e4e6eb;
  display: flex;
  align-items: center;
  background: white;
}

.chat-popup-footer input {
  border-radius: 20px;
  background: #f0f2f5;
  border: none;
  padding: 8px 12px;
}

.chat-popup-footer input:focus {
  background: #e4e6eb;
  box-shadow: none;
}

.chat-popup-footer button {
  border-radius: 50%;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rounded-circle {
  object-fit: cover;
}
</style>
