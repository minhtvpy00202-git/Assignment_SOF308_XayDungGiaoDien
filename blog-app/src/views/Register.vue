<script setup>
import { ref } from 'vue';
import api from '@/api';
import { useRouter } from 'vue-router';
import { useAuth } from '@/stores/auth';

const { setUser } = useAuth();
const router = useRouter();
const form = ref({ name: '', email: '', password: '', avatar: '' });
const err = ref('');

const submit = async () => {
  try {
    if (!form.value.name || !form.value.email || !form.value.password)
      throw new Error('Thiếu thông tin bắt buộc');
    const u = await api.register(form.value);
    setUser(u);                 // ✅ đăng ký xong đăng nhập luôn
    router.push('/');
  } catch (e) { err.value = e.message || 'Đăng ký thất bại'; }
};
</script>


<template>
  <div class="register-wrapper">
    <div class="container py-5" style="max-width:520px">
      <div class="register-card">
        <div class="register-header">
          <div class="register-icon">✨</div>
          <h2 class="register-title">Đăng ký</h2>
          <p class="register-subtitle">Tạo tài khoản mới để bắt đầu</p>
        </div>

        <div v-if="err" class="alert alert-danger alert-custom">
          <span class="alert-icon">⚠️</span>
          {{ err }}
        </div>

        <form @submit.prevent="submit">
          <div class="form-group mb-3">
            <label class="form-label-custom">
              <span class="label-icon">👤</span>
              Họ tên
            </label>
            <input 
              v-model="form.name" 
              class="form-control form-control-custom" 
              placeholder="Tên của bạn"
            >
          </div>

          <div class="form-group mb-3">
            <label class="form-label-custom">
              <span class="label-icon">📧</span>
              Email
            </label>
            <input 
              v-model="form.email" 
              type="email" 
              class="form-control form-control-custom" 
              placeholder="email@example.com"
            >
          </div>

          <div class="form-group mb-3">
            <label class="form-label-custom">
              <span class="label-icon">🔑</span>
              Mật khẩu
            </label>
            <input 
              v-model="form.password" 
              type="password" 
              class="form-control form-control-custom"
              placeholder="Nhập mật khẩu"
            >
          </div>

          <div class="form-group mb-4">
            <label class="form-label-custom">
              <span class="label-icon">🖼️</span>
              Ảnh đại diện (URL)
            </label>
            <input 
              v-model="form.avatar" 
              class="form-control form-control-custom"
              placeholder="https://example.com/avatar.jpg"
            >
          </div>

          <button type="submit" class="btn btn-register w-100">
            <span class="btn-text">Tạo tài khoản</span>
            <span class="btn-icon">🚀</span>
          </button>
        </form>

        <div class="register-footer">
          <p class="footer-text">
            Đã có tài khoản? 
            <RouterLink to="/login" class="footer-link">Đăng nhập ngay</RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-wrapper {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.register-card {
  background: white;
  border-radius: 25px;
  padding: 3rem 2.5rem;
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

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: rotate 3s infinite;
}

@keyframes rotate {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
}

.register-title {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.register-subtitle {
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
}

.alert-icon {
  font-size: 1.5rem;
}

.form-label-custom {
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-icon {
  font-size: 1.2rem;
}

.form-control-custom {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control-custom:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  transform: translateY(-2px);
}

.btn-register {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.btn-register:hover {
  background: linear-gradient(135deg, #38ef7d 0%, #11998e 100%);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(17, 153, 142, 0.4);
}

.btn-icon {
  font-size: 1.3rem;
  transition: transform 0.3s ease;
}

.btn-register:hover .btn-icon {
  transform: translateX(5px);
}

.register-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f0f0f0;
}

.footer-text {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.95rem;
}

.footer-link {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.footer-link:hover {
  color: #764ba2;
  text-decoration: underline;
}
</style>
