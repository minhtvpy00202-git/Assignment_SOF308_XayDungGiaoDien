<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { RouterLink } from 'vue-router';
import api from '@/api';
import { useAuth } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const userId = route.params.id;

const { user: currentUser } = useAuth();

const profileUser = ref(null);
const userPosts = ref([]);
const loading = ref(true);

// Check nếu đang xem profile của chính mình
const isOwnProfile = computed(() => {
  return currentUser.value && String(currentUser.value.id) === String(userId);
});

// Fetch thông tin user và bài viết của họ
const fetchUserProfile = async () => {
  loading.value = true;
  try {
    // Fetch user info
    const usersRes = await api.listUsers();
    const user = usersRes.data.find(u => String(u.id) === String(userId));
    
    if (!user) {
      router.push('/');
      return;
    }
    
    profileUser.value = user;
    
    // Fetch posts của user này
    const postsRes = await api.listPosts({
      _sort: 'createdAt',
      _order: 'desc'
    });
    
    userPosts.value = postsRes.data.filter(p => String(p.userId) === String(userId));
  } catch (e) {
    console.error('Lỗi khi tải profile:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUserProfile);
</script>

<template>
  <div class="user-profile-wrapper">
    <div class="container py-4">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải...</p>
      </div>

      <!-- Profile Content -->
      <div v-else-if="profileUser">
        <!-- Profile Header -->
        <div class="profile-header card mb-4">
          <div class="profile-cover"></div>
          <div class="profile-info">
            <div class="avatar-wrapper">
              <img 
                :src="profileUser.avatar || 'https://via.placeholder.com/150'" 
                class="profile-avatar"
                alt="avatar"
              />
              <div class="avatar-badge">
                <span v-if="isOwnProfile">👤</span>
                <span v-else>👥</span>
              </div>
            </div>
            
            <div class="user-details">
              <h1 class="user-name">{{ profileUser.name }}</h1>
              <p class="user-email">
                <span class="email-icon">📧</span>
                {{ profileUser.email }}
              </p>
              
              <div class="profile-stats">
                <div class="stat-item">
                  <span class="stat-number">{{ userPosts.length }}</span>
                  <span class="stat-label">Bài viết</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="profile-actions">
                <RouterLink 
                  v-if="isOwnProfile" 
                  to="/profile" 
                  class="btn btn-edit-profile"
                >
                  <span class="btn-icon">✏️</span>
                  Chỉnh sửa trang cá nhân
                </RouterLink>
                <RouterLink 
                  v-else 
                  to="/" 
                  class="btn btn-back"
                >
                  <span class="btn-icon">🏠</span>
                  Về trang chủ
                </RouterLink>
              </div>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div class="about-section card mb-4">
          <div class="card-body">
            <h3 class="section-title">
              <span class="title-icon">📝</span>
              Giới thiệu
            </h3>
            <p class="about-text">
              {{ profileUser.intro || 'Chưa có thông tin giới thiệu.' }}
            </p>
          </div>
        </div>

        <!-- Posts Section -->
        <div class="posts-section card">
          <div class="card-body">
            <h3 class="section-title">
              <span class="title-icon">📰</span>
              Bài viết của {{ profileUser.name }}
              <span class="post-count">({{ userPosts.length }})</span>
            </h3>

            <!-- Posts List -->
            <div v-if="userPosts.length > 0" class="posts-list">
              <div 
                v-for="post in userPosts" 
                :key="post.id"
                class="post-item"
              >
                <div class="post-header">
                  <h4 class="post-title">{{ post.title }}</h4>
                  <span class="post-date">
                    <span class="date-icon">🕒</span>
                    {{ new Date(post.createdAt).toLocaleDateString('vi-VN') }}
                  </span>
                </div>
                <p class="post-excerpt">
                  {{ post.content.slice(0, 150) }}{{ post.content.length > 150 ? '...' : '' }}
                </p>
                <RouterLink 
                  :to="`/posts/${post.id}`"
                  class="btn btn-read-more"
                >
                  Đọc tiếp →
                </RouterLink>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-posts">
              <span class="empty-icon">📭</span>
              <p>{{ profileUser.name }} chưa có bài viết nào.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-profile-wrapper {
  min-height: 100vh;
  animation: fadeIn 0.6s ease;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 100px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Profile Header */
.profile-header {
  border: none;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.profile-cover {
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.profile-cover::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(to top, rgba(255,255,255,1), transparent);
}

.profile-info {
  padding: 0 2rem 2rem;
  margin-top: -80px;
  position: relative;
  z-index: 2;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}

.profile-avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 5px solid white;
  object-fit: cover;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  background: white;
}

.avatar-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  border: 3px solid white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.user-details {
  margin-top: 1rem;
}

.user-name {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-email {
  color: #7f8c8d;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1.5rem;
}

.email-icon {
  font-size: 1.2rem;
}

/* Stats */
.profile-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 1.5rem;
  padding: 1rem 0;
  border-top: 2px solid #f0f0f0;
  border-bottom: 2px solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
}

/* Actions */
.profile-actions {
  display: flex;
  gap: 12px;
}

.btn-edit-profile {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-edit-profile:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  color: white;
}

.btn-back {
  background: #e0e0e0;
  color: #666;
  border: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #d0d0d0;
  color: #555;
}

.btn-icon {
  font-size: 1.2rem;
}

/* About Section */
.about-section {
  border: none;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.section-title {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 1.8rem;
}

.about-text {
  color: #5a6c7d;
  font-size: 1rem;
  line-height: 1.8;
  white-space: pre-wrap;
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #667eea;
  margin: 0;
}

/* Posts Section */
.posts-section {
  border: none;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.post-count {
  color: #7f8c8d;
  font-size: 1.2rem;
  font-weight: 500;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.post-item {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.post-item:hover {
  border-color: #667eea;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
  transform: translateY(-3px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  gap: 15px;
}

.post-title {
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
}

.post-date {
  color: #7f8c8d;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.date-icon {
  font-size: 1rem;
}

.post-excerpt {
  color: #5a6c7d;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.btn-read-more {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
}

.btn-read-more:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  color: white;
}

/* Empty State */
.empty-posts {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-info {
    padding: 0 1rem 1.5rem;
  }
  
  .user-name {
    font-size: 1.5rem;
  }
  
  .post-header {
    flex-direction: column;
  }
  
  .post-date {
    align-self: flex-start;
  }
}
</style>
