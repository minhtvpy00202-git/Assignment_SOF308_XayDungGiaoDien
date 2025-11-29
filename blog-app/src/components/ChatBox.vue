<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import api from '@/api';
import { useAuth } from '@/stores/auth';

const { user, isAuth } = useAuth();

const isOpen = ref(false);
const showUserList = ref(true);
const selectedUser = ref(null);
const allUsers = ref([]);
const messages = ref([]);
const newMessage = ref('');
const messagesContainer = ref(null);
const allMessages = ref([]); // Lưu TẤT CẢ tin nhắn
const lastMessageCount = ref(0); // Số tin nhắn lần trước

// Computed: Lọc users (loại bỏ user hiện tại)
const users = computed(() => {
  if (!user.value || !allUsers.value.length) return [];
  
  const currentUserId = String(user.value.id);
  return allUsers.value.filter(u => String(u.id) !== currentUserId);
});

// Load viewed message IDs từ localStorage
const loadViewedMessageIds = () => {
  if (!user.value) return new Set();
  
  const key = `viewedMessages_${user.value.id}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      const arr = JSON.parse(stored);
      return new Set(arr);
    } catch (e) {
      return new Set();
    }
  }
  
  return new Set();
};

// Save viewed message IDs vào localStorage
const saveViewedMessageIds = () => {
  if (!user.value) return;
  
  const key = `viewedMessages_${user.value.id}`;
  const arr = Array.from(viewedMessageIds.value);
  localStorage.setItem(key, JSON.stringify(arr));
};

// Lưu ID tin nhắn đã xem
const viewedMessageIds = ref(loadViewedMessageIds());

// Computed: Đếm tin nhắn chưa đọc
const unreadCount = computed(() => {
  if (!user.value || !allMessages.value.length) return 0;
  
  // Đếm tin nhắn mà user hiện tại là người nhận và chưa xem
  const unread = allMessages.value.filter(msg => {
    const isForMe = String(msg.receiverId) === String(user.value.id);
    const notViewed = !viewedMessageIds.value.has(msg.id);
    return isForMe && notViewed;
  });
  
  return unread.length;
});

// Phát âm thanh thông báo
const playNotificationSound = () => {
  try {
    // Tạo âm thanh đơn giản bằng Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Tần số cao
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Không thể phát âm thanh:', e);
  }
};

// Lấy danh sách users
const fetchUsers = async () => {
  if (!user.value) {
    console.error('User chưa đăng nhập');
    return;
  }
  
  try {
    const res = await api.listUsers();
    allUsers.value = res.data;
    
    console.log('=== DEBUG CHAT ===');
    console.log('Current user:', user.value.name, 'ID:', user.value.id, 'Type:', typeof user.value.id);
    console.log('All users:', res.data.map(u => `${u.name} (${u.id}, ${typeof u.id})`));
    console.log('Filtered users:', users.value.map(u => `${u.name} (${u.id})`));
    console.log('==================');
  } catch (e) {
    console.error('Lỗi khi tải users:', e);
  }
};

// Lấy TẤT CẢ tin nhắn (để đếm unread)
const fetchAllMessages = async () => {
  if (!user.value) return;
  
  try {
    const res = await api.listMessages();
    const previousCount = allMessages.value.length;
    allMessages.value = res.data;
    
    // Kiểm tra có tin nhắn mới không
    if (previousCount > 0 && res.data.length > previousCount) {
      // Có tin nhắn mới
      const newMessages = res.data.slice(previousCount);
      const hasNewMessageForMe = newMessages.some(msg => 
        String(msg.receiverId) === String(user.value.id)
      );
      
      if (hasNewMessageForMe) {
        playNotificationSound();
        
        // Hiển thị browser notification nếu được phép
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Tin nhắn mới', {
            body: 'Bạn có tin nhắn mới từ Messenger',
            icon: '/favicon.ico'
          });
        }
      }
    }
  } catch (e) {
    console.error('Lỗi khi tải tin nhắn:', e);
  }
};

// Lấy tin nhắn giữa 2 users
const fetchMessages = async () => {
  if (!selectedUser.value || !user.value) return;
  
  try {
    const res = await api.listMessages();
    // Lọc tin nhắn giữa 2 users
    messages.value = res.data.filter(msg => 
      (String(msg.senderId) === String(user.value.id) && String(msg.receiverId) === String(selectedUser.value.id)) ||
      (String(msg.senderId) === String(selectedUser.value.id) && String(msg.receiverId) === String(user.value.id))
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Scroll xuống cuối
    await nextTick();
    scrollToBottom();
  } catch (e) {
    console.error('Lỗi khi tải tin nhắn:', e);
  }
};

// Gửi tin nhắn
const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedUser.value || !user.value) return;
  
  try {
    await api.createMessage({
      senderId: user.value.id,
      receiverId: selectedUser.value.id,
      content: newMessage.value,
      createdAt: new Date().toISOString()
    });
    
    newMessage.value = '';
    await fetchMessages();
  } catch (e) {
    console.error('Lỗi khi gửi tin nhắn:', e);
  }
};

// Chọn user để chat
const selectUser = (u) => {
  selectedUser.value = u;
  showUserList.value = false;
  fetchMessages();
  
  // Đánh dấu tất cả tin nhắn từ user này là đã xem
  allMessages.value.forEach(msg => {
    if (String(msg.senderId) === String(u.id) && String(msg.receiverId) === String(user.value.id)) {
      viewedMessageIds.value.add(msg.id);
    }
  });
  
  // Lưu vào localStorage
  saveViewedMessageIds();
};

// Quay lại danh sách users
const backToUserList = () => {
  selectedUser.value = null;
  showUserList.value = true;
  messages.value = [];
};

// Toggle chat box
const toggleChat = () => {
  if (!isAuth.value) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value && allUsers.value.length === 0) {
    fetchUsers();
  }
};

// Scroll xuống cuối
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// Auto refresh messages mỗi 3 giây
let refreshInterval = null;
let globalRefreshInterval = null;

watch(selectedUser, (newVal) => {
  if (refreshInterval) clearInterval(refreshInterval);
  
  if (newVal) {
    refreshInterval = setInterval(() => {
      fetchMessages();
    }, 3000);
  }
});

// Request notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

onMounted(() => {
  if (isAuth.value) {
    // Load viewed messages từ localStorage
    viewedMessageIds.value = loadViewedMessageIds();
    
    fetchUsers();
    fetchAllMessages();
    requestNotificationPermission();
    
    // Auto refresh tất cả tin nhắn mỗi 5 giây để cập nhật unread count
    globalRefreshInterval = setInterval(() => {
      fetchAllMessages();
    }, 5000);
  }
});

// Cleanup khi component unmount
import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
  if (globalRefreshInterval) clearInterval(globalRefreshInterval);
});
</script>

<template>
  <!-- Chat Button -->
  <div v-if="isAuth" class="chat-button" @click="toggleChat">
    <span class="chat-icon">💬</span>
    <span class="chat-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
  </div>

  <!-- Chat Box -->
  <div v-if="isAuth && isOpen" class="chat-box">
    <!-- Header -->
    <div class="chat-header">
      <div class="header-left">
        <button v-if="!showUserList" class="back-btn" @click="backToUserList">
          ←
        </button>
        <h3 class="chat-title">
          {{ showUserList ? 'Messenger' : selectedUser?.name }}
        </h3>
      </div>
      <button class="close-btn" @click="toggleChat">✕</button>
    </div>

    <!-- User List -->
    <div v-if="showUserList" class="user-list">
      <div class="user-search">
        <input type="text" placeholder="🔍 Tìm kiếm..." class="search-input" />
      </div>
      <div class="users-container">
        <div 
          v-for="u in users" 
          :key="u.id"
          class="user-item"
          @click="selectUser(u)"
        >
          <img :src="u.avatar || 'https://via.placeholder.com/40'" class="user-avatar" />
          <div class="user-info">
            <div class="user-name">{{ u.name }}</div>
            <div class="user-status">Nhấn để chat</div>
          </div>
        </div>
        <div v-if="users.length === 0" class="empty-state">
          Không có người dùng nào
        </div>
      </div>
    </div>

    <!-- Chat Messages -->
    <div v-else class="chat-content">
      <div class="messages-container" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-messages">
          <span class="empty-icon">💬</span>
          <p>Chưa có tin nhắn nào</p>
          <p class="empty-hint">Gửi tin nhắn đầu tiên!</p>
        </div>
        
        <div 
          v-for="msg in messages" 
          :key="msg.id"
          :class="['message', String(msg.senderId) === String(user?.id) ? 'message-sent' : 'message-received']"
        >
          <div class="message-bubble">
            {{ msg.content }}
          </div>
          <div class="message-time">
            {{ new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }}
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="chat-input">
        <input 
          v-model="newMessage"
          type="text" 
          placeholder="Aa" 
          class="message-input"
          @keyup.enter="sendMessage"
        />
        <button class="send-btn" @click="sendMessage" :disabled="!newMessage.trim()">
          <span class="send-icon">➤</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Chat Button */
.chat-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #0084ff 0%, #0066cc 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 132, 255, 0.4);
  transition: all 0.3s ease;
  z-index: 999;
}

.chat-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(0, 132, 255, 0.6);
}

.chat-icon {
  font-size: 1.8rem;
}

.chat-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4444;
  color: white;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  border: 2px solid white;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 0 6px rgba(255, 68, 68, 0);
  }
}

/* Chat Box */
.chat-box {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 360px;
  height: 500px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 998;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.chat-header {
  background: linear-gradient(135deg, #0084ff 0%, #0066cc 100%);
  color: white;
  padding: 15px;
  border-radius: 15px 15px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* User List */
.user-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-search {
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border: none;
  background: #f0f2f5;
  border-radius: 20px;
  font-size: 0.9rem;
  outline: none;
}

.users-container {
  flex: 1;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-item:hover {
  background: #f0f2f5;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #0084ff;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #050505;
  font-size: 0.95rem;
}

.user-status {
  color: #65676b;
  font-size: 0.85rem;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #65676b;
}

/* Chat Content */
.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: #f0f2f5;
}

.empty-messages {
  text-align: center;
  padding: 60px 20px;
  color: #65676b;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 10px;
}

.empty-hint {
  font-size: 0.85rem;
  margin-top: 5px;
}

/* Messages */
.message {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.message-sent {
  align-items: flex-end;
}

.message-received {
  align-items: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 18px;
  word-wrap: break-word;
  font-size: 0.95rem;
  line-height: 1.4;
}

.message-sent .message-bubble {
  background: linear-gradient(135deg, #0084ff 0%, #0066cc 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-received .message-bubble {
  background: #e4e6eb;
  color: #050505;
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 0.75rem;
  color: #65676b;
  margin-top: 4px;
  padding: 0 5px;
}

/* Chat Input */
.chat-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.message-input {
  flex: 1;
  padding: 10px 15px;
  border: none;
  background: #f0f2f5;
  border-radius: 20px;
  font-size: 0.95rem;
  outline: none;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #0084ff 0%, #0066cc 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(0, 132, 255, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-icon {
  font-size: 1rem;
}

/* Scrollbar */
.users-container::-webkit-scrollbar,
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.users-container::-webkit-scrollbar-track,
.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.users-container::-webkit-scrollbar-thumb,
.messages-container::-webkit-scrollbar-thumb {
  background: #c4c4c4;
  border-radius: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .chat-box {
    width: calc(100vw - 40px);
    right: 20px;
  }
}
</style>
