<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api';

const user = ref(null);
const err = ref('');
const ok = ref('');

onMounted(() => { user.value = JSON.parse(localStorage.getItem('authUser') || 'null'); });

const save = async () => {
  try {
    const { data } = await api.updatePost; // placeholder to avoid tree-shake warnings
    const res = await fetch(`http://localhost:3000/users/${user.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user.value)
    });
    if (!res.ok) throw new Error('Cập nhật thất bại');
    const updated = await res.json();
    localStorage.setItem('authUser', JSON.stringify(updated));
    ok.value = 'Đã lưu thông tin.';
    err.value = '';
  } catch (e) { err.value = e.message; ok.value = ''; }
};
</script>

<template>
  <div class="profile-wrapper" v-if="user">
    <div class="container py-5" style="max-width:600px">
      <div class="profile-card card">
        <div class="card-body">
          <div class="profile-header">
            <div class="profile-icon">👤</div>
            <h2 class="profile-title">Thông tin cá nhân</h2>
            <p class="profile-subtitle">Quản lý thông tin tài khoản của bạn</p>
          </div>

          <div v-if="ok" class="alert alert-success alert-custom">
            <span class="alert-icon">✅</span>
            {{ ok }}
          </div>
          <div v-if="err" class="alert alert-danger alert-custom">
            <span class="alert-icon">⚠️</span>
            {{ err }}
          </div>

          <div class="avatar-preview" v-if="user.avatar">
            <img :src="user.avatar" alt="Avatar preview" class="preview-img" />
          </div>

          <form @submit.prevent="save">
            <div class="form-group mb-4">
              <label class="form-label-custom">
                <span class="label-icon">👤</span>
                Họ tên
              </label>
              <input 
                v-model="user.name" 
                class="form-control form-control-custom"
                placeholder="Tên của bạn"
              >
            </div>

            <div class="form-group mb-4">
              <label class="form-label-custom">
                <span class="label-icon">📧</span>
                Email
              </label>
              <input 
                v-model="user.email" 
                type="email" 
                class="form-control form-control-custom"
                placeholder="email@example.com"
              >
            </div>

            <div class="form-group mb-4">
              <label class="form-label-custom">
                <span class="label-icon">🔑</span>
                Mật khẩu
              </label>
              <input 
                v-model="user.password" 
                type="password" 
                class="form-control form-control-custom"
                placeholder="Nhập mật khẩu mới"
              >
            </div>

            <div class="form-group mb-4">
              <label class="form-label-custom">
                <span class="label-icon">🖼️</span>
                Ảnh đại diện (URL)
              </label>
              <input 
                v-model="user.avatar" 
                class="form-control form-control-custom"
                placeholder="https://example.com/avatar.jpg"
              >
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-save">
                <span class="btn-icon">💾</span>
                <span class="btn-text">Lưu thay đổi</span>
              </button>
              <RouterLink to="/" class="btn btn-back">
                <span class="btn-icon">🏠</span>
                <span class="btn-text">Về trang chủ</span>
              </RouterLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-wrapper {
  min-height: calc(100vh - 80px);
  padding: 2rem 0;
}

.profile-card {
  border: none;
  border-radius: 25px;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.6s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.profile-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.profile-title {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.profile-subtitle {
  color: #7f8c8d;
  font-size: 1rem;
  margin: 0;
}

.alert-custom {
  border-radius: 12px;
  border: none;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.5rem;
  animation: slideIn 0.5s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.alert-icon {
  font-size: 1.5rem;
}

.avatar-preview {
  text-align: center;
  margin-bottom: 2rem;
}

.preview-img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #667eea;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.preview-img:hover {
  transform: scale(1.05);
}

.form-label-custom {
  color: #2c3e50;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-icon {
  font-size: 1.3rem;
}

.form-control-custom {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control-custom:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  transform: translateY(-2px);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f0f0f0;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
}

.btn-save:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.btn-back {
  background: #e0e0e0;
  color: #666;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-back:hover {
  background: #d0d0d0;
  color: #555;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.3rem;
}
</style>
