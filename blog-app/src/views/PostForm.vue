<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const id = route.params.id;
const editing = !!id;

const user = JSON.parse(localStorage.getItem('authUser') || 'null');
const form = ref({ title: '', content: '', image: '' });
const err = ref('');

onMounted(async () => {
  if (editing) {
    const { data } = await api.getPost(id);
    form.value = data;
  }
});

const submit = async () => {
  try {
    if (!form.value.title || !form.value.content) throw new Error('Thiếu tiêu đề/nội dung');
    const payload = {
      ...form.value,
      userId: user.id,
      createdAt: form.value.createdAt || new Date().toISOString()
    };
    if (editing) await api.updatePost(id, payload);
    else await api.createPost(payload);
    router.push('/');
  } catch (e) { err.value = e.message; }
};
</script>

<template>
  <div class="post-form-wrapper">
    <div class="container py-5" style="max-width:720px">
      <div class="post-form-card card">
        <div class="card-body">
          <div class="form-header">
            <div class="form-icon">{{ editing ? '✏️' : '📝' }}</div>
            <h2 class="form-title">{{ editing ? 'Cập nhật bài viết' : 'Đăng bài viết mới' }}</h2>
            <p class="form-subtitle">{{ editing ? 'Chỉnh sửa nội dung bài viết của bạn' : 'Chia sẻ câu chuyện của bạn với mọi người' }}</p>
          </div>

          <div v-if="err" class="alert alert-danger alert-custom">
            <span class="alert-icon">⚠️</span>
            {{ err }}
          </div>

          <form @submit.prevent="submit">
            <div class="form-group mb-4">
              <label class="form-label-custom">
                <span class="label-icon">📌</span>
                Tiêu đề
              </label>
              <input 
                v-model="form.title" 
                class="form-control form-control-custom" 
                placeholder="Nhập tiêu đề bài viết..."
              >
            </div>

            <div class="form-group mb-4">
              <label class="form-label-custom">
                <span class="label-icon">📄</span>
                Nội dung
              </label>
              <textarea 
                v-model="form.content" 
                class="form-control form-control-custom content-textarea" 
                rows="10"
                placeholder="Viết nội dung bài viết của bạn..."
              ></textarea>
            </div>

            <div class="form-group mb-4">
              <label class="form-label-custom">
                <span class="label-icon">🖼️</span>
                Ảnh minh họa (URL)
              </label>
              <input 
                v-model="form.image" 
                class="form-control form-control-custom"
                placeholder="https://example.com/image.jpg"
              >
              <div v-if="form.image" class="image-preview">
                <img :src="form.image" alt="Preview" />
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-submit">
                <span class="btn-icon">{{ editing ? '💾' : '🚀' }}</span>
                <span class="btn-text">{{ editing ? 'Lưu thay đổi' : 'Đăng bài' }}</span>
              </button>
              <RouterLink to="/" class="btn btn-cancel">
                <span class="btn-icon">❌</span>
                <span class="btn-text">Hủy</span>
              </RouterLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-form-wrapper {
  min-height: calc(100vh - 80px);
  padding: 2rem 0;
}

.post-form-card {
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

.form-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.form-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.form-title {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.form-subtitle {
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

.content-textarea {
  min-height: 250px;
  line-height: 1.6;
  font-family: inherit;
}

.image-preview {
  margin-top: 1rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.image-preview img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f0f0f0;
}

.btn-submit {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
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

.btn-submit:hover {
  background: linear-gradient(135deg, #38ef7d 0%, #11998e 100%);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(17, 153, 142, 0.4);
}

.btn-cancel {
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

.btn-cancel:hover {
  background: #d0d0d0;
  color: #555;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.3rem;
}
</style>
