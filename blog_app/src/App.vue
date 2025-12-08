<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import { useChatPopups } from './composables/useChatPopups'
import AppNavbar from './components/AppNavbar.vue'
import ChatPopup from './components/ChatPopup.vue'
import MessageNotificationListener from './components/MessageNotificationListener.vue'

const { checkAuth } = useAuth()
const { chatPopups, closeChatPopup, minimizeChatPopup } = useChatPopups()

// Check authentication status on app mount
onMounted(() => {
  checkAuth()
})
</script>

<template>
  <div id="app">
    <AppNavbar />
    <router-view />
    
    <!-- Message Notification Listener -->
    <MessageNotificationListener />
    
    <!-- Chat Popups -->
    <div class="chat-popups-container">
      <ChatPopup
        v-for="(popup, index) in chatPopups.filter(p => !p.isMinimized)"
        :key="popup.id"
        :other-user="popup.otherUser"
        :conversation-id="popup.conversationId"
        :initial-messages="popup.messages"
        :style="{ right: `${80 + index * 348}px` }"
        @close="closeChatPopup(popup.id)"
        @minimize="minimizeChatPopup(popup.id)"
      />
    </div>
  </div>
</template>

<style>
#app {
  min-height: 100vh;
}
</style>
