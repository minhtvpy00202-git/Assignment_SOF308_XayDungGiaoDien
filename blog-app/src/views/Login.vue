<script setup>
import { ref } from 'vue';
import api from '@/api';
import { useRouter } from 'vue-router';
import { useAuth } from '@/stores/auth';

const { setUser } = useAuth();
const router = useRouter();
const form = ref({ email: '', password: '' });
const err = ref('');

const submit = async () => {
  try {
    const u = await api.login(form.value.email, form.value.password);
    setUser(u);               
    router.push('/');           
  } catch (e) { err.value = e.message || 'Đăng nhập thất bại'; }
};
</script>


<template>
  <div class="login-wrapper">
    <div class="container py-5" style="max-width:480px">
      <div class="login-card">
        <div class="login-header">
          <div class="login-icon">🔐</div>
          <h2 class="login-title">Đăng nhập</h2>
          <p class="login-subtitle">Chào mừng bạn quay trở lại!</p>
        </div>

        <div v-if="err" class="alert alert-danger alert-custom">
          <span class="alert-icon">⚠️</span>
          {{ err }}
        </div>

        <form @submit.prevent="submit">
          <div class="form-group mb-4">
            <label class="form-label-custom">
              <span class="label-icon">📧</span>
              Email
            </label>
            <input 
              v-model="form.email" 
              type="email" 
              class="form-control form-control-custom" 
              placeholder="email@example.com"
              @keyup.enter="submit"
            >
          </div>

          <div class="form-group mb-4">
            <label class="form-label-custom">
              <span class="label-icon">🔑</span>
              Mật khẩu
            </label>
            <input 
              v-model="form.password" 
              type="password" 
              class="form-control form-control-custom" 
              placeholder="Nhập mật khẩu"
              @keyup.enter="submit"
            >
          </div>

          <button type="submit" class="btn btn-login w-100">
            <span class="btn-text">Đăng nhập</span>
            <span class="btn-arrow">→</span>
          </button>
        </form>

        <div class="login-footer">
          <p class="footer-text">
            Chưa có tài khoản? 
            <RouterLink to="/register" class="footer-link">Đăng ký ngay</RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.login-card {
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

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.login-title {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.login-subtitle {
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
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
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
  padding: 14px 18px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control-custom:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  transform: translateY(-2px);
}

.btn-login {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  margin-top: 1.5rem;
}

.btn-login:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.btn-arrow {
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.btn-login:hover .btn-arrow {
  transform: translateX(5px);
}

.login-footer {
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
