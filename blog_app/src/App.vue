<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import { useChatPopups } from './composables/useChatPopups'
import { useOnlineStatus } from './composables/useOnlineStatus'

import AppNavbar from './components/AppNavbar.vue'
import ChatPopup from './components/ChatPopup.vue'
import ChatBotWidget from './components/ChatBotWidget.vue'
import MessageNotificationListener from './components/MessageNotificationListener.vue'
import ChristmasEffects from './components/ChristmasEffects.vue'
import WinterBackground from './components/WinterBackground.vue'


const { checkAuth } = useAuth()
const { chatPopups, closeChatPopup, minimizeChatPopup } = useChatPopups()

// Initialize online status tracking
useOnlineStatus()

onMounted(() => {
  checkAuth()
})
</script>

<template>
  <div id="app" class="christmas-mode">
    <WinterBackground />
    <ChristmasEffects />
    <AppNavbar />
    <router-view />

    <MessageNotificationListener />

    <div class="chat-popups-container">
      <ChatPopup
        v-for="(popup, index) in chatPopups.filter(p => !p.isMinimized)"
        :key="`${popup.id}-${popup.messages.length}`"
        :other-user="popup.otherUser"
        :conversation-id="popup.conversationId"
        :initial-messages="popup.messages"
        :style="{ right: `${80 + index * 348}px` }"
        @close="closeChatPopup(popup.id)"
        @minimize="minimizeChatPopup(popup.id)"
      />
    </div>

    <!-- ChatBot Widget -->
    <ChatBotWidget />
  </div>
</template>

<style>
#app {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

</style>
