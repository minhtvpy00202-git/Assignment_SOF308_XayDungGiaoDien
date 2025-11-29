<!-- src/components/UserSidebar.vue -->
<script setup>
import { ref } from "vue";
import api from "@/api";

const user = ref(JSON.parse(localStorage.getItem("authUser") || "null"));

const isEditing = ref(false);
const introDraft = ref(user.value?.intro || "");
const saving = ref(false);
const error = ref("");

// Bắt đầu chỉnh sửa
const startEdit = () => {
  if (!user.value) return;
  introDraft.value = user.value.intro || "";
  isEditing.value = true;
  error.value = "";
};

// Lưu intro vào db.json
const saveIntro = async () => {
  if (!user.value) return;
  saving.value = true;
  error.value = "";

  try {
    const { data } = await api.updateUser(user.value.id, {
      intro: introDraft.value,
    });

    // Cập nhật lại user local
    user.value = data;
    localStorage.setItem("authUser", JSON.stringify(data));

    isEditing.value = false;
  } catch (e) {
    console.error(e);
    error.value = "Lưu thất bại, vui lòng thử lại.";
  } finally {
    saving.value = false;
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  error.value = "";
};
</script>

<template>
  <div class="user-sidebar-card card">
    <div class="card-body">
      <div class="user-profile-section">
        <div class="avatar-wrapper">
          <img
            :src="user?.avatar || 'https://via.placeholder.com/120'"
            class="user-avatar-img"
            alt="avatar"
          />
          <div class="avatar-badge">✨</div>
        </div>
        <h5 class="user-name">{{ user?.name || "Khách" }}</h5>
        <p class="user-role">{{ user ? "Tác giả" : "Khách viếng thăm" }}</p>
      </div>

      <!-- Hiển thị lỗi nếu có -->
      <div v-if="error" class="alert alert-danger alert-custom">
        <span class="alert-icon">⚠️</span>
        {{ error }}
      </div>

      <!-- Chế độ xem -->
      <div v-if="!isEditing" class="intro-section">
        <div class="intro-header">
          <span class="intro-icon">📝</span>
          <h6 class="intro-title">Giới thiệu</h6>
        </div>
        <p class="intro-text">
          {{ user?.intro || "Chưa có nội dung giới thiệu, hãy nhấn chỉnh sửa để thêm." }}
        </p>

        <!-- Chỉ hiện nút khi có user đăng nhập -->
        <button
          v-if="user"
          class="btn btn-edit w-100"
          @click="startEdit"
        >
          <span class="btn-icon">✏️</span>
          Chỉnh sửa giới thiệu
        </button>
      </div>

      <!-- Chế độ chỉnh sửa -->
      <div v-else class="edit-section">
        <textarea
          v-model="introDraft"
          class="form-control intro-textarea"
          rows="5"
          placeholder="Viết vài dòng giới thiệu về bản thân..."
        ></textarea>

        <div class="d-flex gap-2 mt-3">
          <button
            class="btn btn-save flex-fill"
            :disabled="saving"
            @click="saveIntro"
          >
            <span v-if="!saving">💾 Lưu</span>
            <span v-else>⏳ Đang lưu...</span>
          </button>
          <button
            class="btn btn-cancel flex-fill"
            :disabled="saving"
            @click="cancelEdit"
          >
            ❌ Hủy
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <div class="email-section">
        <div class="email-label">
          <span class="email-icon">📧</span>
          <strong>Email</strong>
        </div>
        <p class="email-text">{{ user?.email || "Chưa đăng nhập" }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-sidebar-card {
  border: none;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.user-profile-section {
  text-align: center;
  padding: 1.5rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: -1.25rem -1.25rem 1.5rem -1.25rem;
  position: relative;
}

.user-profile-section::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 20px solid #764ba2;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}

.user-avatar-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.user-avatar-img:hover {
  transform: scale(1.05);
}

.avatar-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  border: 3px solid white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.user-name {
  color: white;
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0.5rem 0 0.25rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-role {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  margin: 0;
  font-weight: 500;
}

.alert-custom {
  border-radius: 12px;
  border: none;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.alert-icon {
  font-size: 1.2rem;
}

.intro-section {
  margin-top: 2rem;
}

.intro-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1rem;
}

.intro-icon {
  font-size: 1.3rem;
}

.intro-title {
  margin: 0;
  color: #2c3e50;
  font-weight: 700;
  font-size: 1.1rem;
}

.intro-text {
  color: #5a6c7d;
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 12px;
  border-left: 4px solid #667eea;
  margin-bottom: 1rem;
}

.btn-edit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  font-size: 1.1rem;
}

.intro-textarea {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.intro-textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.btn-save {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(17, 153, 142, 0.4);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #e0e0e0;
  color: #666;
  border: none;
  padding: 10px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cancel:hover:not(:disabled) {
  background: #d0d0d0;
}

.divider {
  height: 2px;
  background: linear-gradient(to right, transparent, #e0e0e0, transparent);
  margin: 1.5rem 0;
}

.email-section {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 12px;
}

.email-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 600;
}

.email-icon {
  font-size: 1.2rem;
}

.email-text {
  color: #5a6c7d;
  font-size: 0.9rem;
  margin: 0;
  word-break: break-all;
}
</style>
