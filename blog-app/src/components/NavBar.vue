<script setup>
import { RouterLink, useRouter } from 'vue-router';
import { useAuth } from '@/stores/auth';

const router = useRouter();
const { user, isAuth, logout } = useAuth();

const onLogout = () => { logout(); router.push('/'); };
</script>

<style scoped>
.navbar-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
  border-bottom: 3px solid rgba(255, 255, 255, 0.2);
}

.brand-custom {
  font-size: 1.5rem;
  font-weight: 700;
  color: white !important;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: transform 0.3s ease;
}

.brand-custom:hover {
  transform: scale(1.05);
}

.brand-icon {
  font-size: 1.8rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.brand-text {
  background: linear-gradient(to right, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-link-custom {
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 500;
  padding: 8px 16px !important;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.nav-link-custom:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white !important;
  transform: translateY(-2px);
}

.nav-link-custom.router-link-active {
  background: rgba(255, 255, 255, 0.25);
  color: white !important;
}

.nav-icon {
  font-size: 1.1rem;
}

.user-info-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 16px;
  border-radius: 25px;
  backdrop-filter: blur(10px);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid white;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.user-name {
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-outline-light {
  border: 2px solid white;
  color: white;
  background: transparent;
}

.btn-outline-light:hover {
  background: white;
  color: #667eea;
  border-color: white;
}

.btn-light {
  background: white;
  color: #667eea;
  font-weight: 600;
}

.btn-light:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-danger {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  border: none;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
  transform: translateY(-2px);
}
</style>

<template>
  <nav class="navbar navbar-expand-lg navbar-custom">
    <div class="container-fluid px-4">
      <RouterLink class="navbar-brand brand-custom" to="/">
        <span class="brand-icon">✍️</span>
        <span class="brand-text">Blog App</span>
      </RouterLink>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="nav" class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <RouterLink class="nav-link nav-link-custom" to="/">
              <span class="nav-icon">🏠</span> Trang chủ
            </RouterLink>
          </li>
          <li class="nav-item" v-if="isAuth">
            <RouterLink class="nav-link nav-link-custom" to="/create">
              <span class="nav-icon">✏️</span> Đăng bài
            </RouterLink>
          </li>
        </ul>

        <!-- Chưa đăng nhập -->
        <div v-if="!isAuth" class="d-flex gap-2">
          <RouterLink class="btn btn-outline-light btn-sm" to="/login">Đăng nhập</RouterLink>
          <RouterLink class="btn btn-light btn-sm" to="/register">Đăng ký</RouterLink>
        </div>

        <!-- Đã đăng nhập -->
        <div v-else class="d-flex align-items-center gap-3">
          <div class="user-info-wrapper">
            <img
              :src="user?.avatar || 'https://via.placeholder.com/64x64.png?text=Avatar'"
              class="user-avatar"
              alt="avatar">
            <span class="user-name">{{ user?.name }}</span>
          </div>
          <RouterLink class="btn btn-outline-light btn-sm" to="/profile">
            <span class="nav-icon">👤</span> Trang cá nhân
          </RouterLink>
          <button class="btn btn-danger btn-sm" @click="onLogout">
            <span class="nav-icon">🚪</span> Thoát
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>
