<template>
  <div class="chatbot-widget">
    <!-- Toggle Button -->
    <button 
      class="chatbot-toggle-btn"
      @click="toggleChat"
      :class="{ 'has-unread': hasUnread }"
    >
      <svg v-if="!isOpen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
      </svg>
    </button>

    <!-- Chat Window -->
    <Transition name="slide-up">
      <div v-if="isOpen" class="chatbot-window">
        <div class="chatbot-header">
          <div class="d-flex align-items-center">
            <div class="bot-avatar me-2">🤖</div>
            <div>
              <h6 class="mb-0">{{ t('chatbot.title') }}</h6>
              <small>{{ t('chatbot.subtitle') }}</small>
            </div>
          </div>
          <button @click="toggleChat" class="btn btn-sm btn-link text-white p-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
          </button>
        </div>

        <div class="chatbot-body" ref="messagesContainer">
          <!-- Welcome message -->
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="bot-avatar-large">🤖</div>
            <p>{{ t('chatbot.welcome') }}</p>
            <div class="quick-actions">
              <button 
                v-for="action in quickActions" 
                :key="action.key"
                @click="sendQuickAction(action.message)"
                class="quick-action-btn"
              >
                {{ t(action.key) }}
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            class="message-wrapper"
            :class="{ 'user-message': msg.role === 'user' }"
          >
            <div class="message-bubble">
              <span v-if="msg.role === 'assistant'" class="bot-icon">🤖</span>
              {{ msg.content }}
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="isLoading" class="message-wrapper">
            <div class="message-bubble typing">
              <span class="bot-icon">🤖</span>
              <span class="typing-dots">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </div>

        <div class="chatbot-footer">
          <input 
            v-model="inputMessage" 
            type="text" 
            class="form-control form-control-sm" 
            :placeholder="t('chatbot.placeholder')"
            @keyup.enter="sendMessage"
            :disabled="isLoading"
          >
          <button 
            @click="sendMessage" 
            class="btn btn-primary btn-sm ms-2" 
            :disabled="!inputMessage.trim() || isLoading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useLocale } from '../composables/useLocale'
import { chatbotService, type ChatMessage } from '../services/chatbotService'

const { t } = useLocale()

const isOpen = ref(false)
const inputMessage = ref('')
const messages = ref<ChatMessage[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const hasUnread = ref(false)

const quickActions = [
  { key: 'chatbot.quickPost', message: 'Làm sao để đăng bài viết mới?' },
  { key: 'chatbot.quickFriend', message: 'Làm sao để kết bạn với người khác?' },
  { key: 'chatbot.quickMessage', message: 'Làm sao để nhắn tin cho bạn bè?' },
  { key: 'chatbot.quickPrivacy', message: 'Làm sao để thay đổi quyền riêng tư bài viết?' }
]

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    hasUnread.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendQuickAction = (message: string) => {
  inputMessage.value = message
  sendMessage()
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''
  errorMessage.value = ''

  // Add user message
  messages.value.push({
    role: 'user',
    content: userMessage
  })
  scrollToBottom()

  // Send to API
  isLoading.value = true
  try {
    const response = await chatbotService.sendMessage(userMessage)
    
    if (response.error) {
      errorMessage.value = response.error
    } else {
      messages.value.push({
        role: 'assistant',
        content: response.message
      })
    }
  } catch (error) {
    errorMessage.value = 'Đã xảy ra lỗi. Vui lòng thử lại.'
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.chatbot-widget {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1001;
}

.chatbot-toggle-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chatbot-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.chatbot-toggle-btn.has-unread::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #ff4757;
  border-radius: 50%;
  border: 2px solid white;
}

.chatbot-window {
  position: absolute;
  bottom: 70px;
  left: 0;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chatbot-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chatbot-header h6 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.chatbot-header small {
  font-size: 11px;
  opacity: 0.9;
}

.bot-avatar {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.chatbot-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
}

.welcome-message {
  text-align: center;
  padding: 20px;
}

.bot-avatar-large {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 auto 16px;
}

.welcome-message p {
  color: #495057;
  font-size: 14px;
  margin-bottom: 16px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.quick-action-btn {
  background: white;
  border: 1px solid #667eea;
  color: #667eea;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action-btn:hover {
  background: #667eea;
  color: white;
}

.message-wrapper {
  display: flex;
  margin-bottom: 12px;
}

.message-wrapper.user-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  background: white;
  color: #212529;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.user-message .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.bot-icon {
  margin-right: 6px;
}

.typing {
  display: flex;
  align-items: center;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #667eea;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

.error-message {
  background: #fff5f5;
  color: #c53030;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 8px;
}

.chatbot-footer {
  padding: 12px 16px;
  border-top: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  background: white;
}

.chatbot-footer input {
  border-radius: 20px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 10px 14px;
  font-size: 14px;
}

.chatbot-footer input:focus {
  background: white;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chatbot-footer button {
  border-radius: 50%;
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.chatbot-footer button:disabled {
  opacity: 0.5;
}

/* Slide up animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
