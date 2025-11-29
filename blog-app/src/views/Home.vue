<!-- src/views/Home.vue -->
<script setup>
import PostList from "@/components/PostList.vue";
import UserSidebar from "@/components/UserSidebar.vue";
</script>

<template>
  <div class="home-container">
    <div class="container py-4">
      <div class="hero-banner mb-4">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="hero-icon">📝</span>
            Chào mừng đến Blog App
          </h1>
          <p class="hero-subtitle">Viết & chia sẻ câu chuyện của bạn với thế giới</p>
          <div class="hero-decoration"></div>
        </div>
      </div>

      <div class="row">
        <!-- Cột thông tin chủ blog (bên trái) -->
        <div class="col-md-4 mb-4">
          <div class="sidebar-wrapper">
            <UserSidebar />
          </div>
        </div>

        <!-- Cột danh sách bài viết (bên phải) -->
        <div class="col-md-8 mb-4">
          <div class="posts-wrapper">
            <PostList />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
}

.hero-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
  animation: slideDown 0.6s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.hero-title {
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.hero-icon {
  font-size: 3rem;
  animation: rotate 3s infinite;
}

@keyframes rotate {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.2rem;
  margin-bottom: 0;
  font-weight: 300;
}

.hero-decoration {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  z-index: 1;
}

.hero-decoration::after {
  content: '';
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 250px;
  height: 250px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.sidebar-wrapper, .posts-wrapper {
  animation: fadeInUp 0.8s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
