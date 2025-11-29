<script setup>
import { ref, onMounted, watch } from 'vue';
import { RouterLink } from 'vue-router';
import api from '@/api';

const allPosts = ref([]);   // chứa TẤT CẢ bài
const posts = ref([]);      // chứa bài của trang hiện tại
const page = ref(1);
const totalPages = ref(1);
const limit = 5;            // 🔥 5 bài / trang

// Lấy toàn bộ post 1 lần
const fetchAllPosts = async () => {
  try {
    // Lấy posts và users song song
    const [postsRes, usersRes] = await Promise.all([
      api.listPosts({
        _sort: 'createdAt',
        _order: 'desc'
      }),
      api.listUsers()
    ]);

    // Tạo map userId -> user
    const usersById = {};
    for (const u of usersRes.data) {
      usersById[String(u.id)] = u;
    }

    // Gắn tên tác giả vào từng post
    allPosts.value = postsRes.data.map(post => ({
      ...post,
      author: usersById[String(post.userId)]?.name || 'Ẩn danh'
    }));

    totalPages.value = Math.max(1, Math.ceil(allPosts.value.length / limit));
    applyPage(); // cắt ra cho trang 1
  } catch (e) {
    console.error('Lỗi khi tải bài viết:', e);
  }
};

// Cắt bài theo trang hiện tại
const applyPage = () => {
  const start = (page.value - 1) * limit;
  const end = start + limit;
  posts.value = allPosts.value.slice(start, end);
};

const goPrev = () => {
  if (page.value > 1) page.value--;
};

const goNext = () => {
  if (page.value < totalPages.value) page.value++;
};

onMounted(fetchAllPosts);
watch(page, applyPage);
</script>

<template>
  <div class="post-list-container">
    <div class="posts-header mb-4">
      <h3 class="posts-title">
        <span class="title-icon">📰</span>
        Bài viết mới nhất
      </h3>
    </div>

    <div
      v-for="post in posts"
      :key="post.id"
      class="post-card card mb-3"
    >
      <div class="card-body">
        <div class="post-header">
          <h5 class="post-title">{{ post.title }}</h5>
          <span class="post-badge">Mới</span>
        </div>
        <p class="post-date">
          <span class="date-icon">🕒</span>
          {{ new Date(post.createdAt).toLocaleString('vi-VN') }}
          <span v-if="post.author" class="post-author">
            - 
            <RouterLink :to="`/user/${post.userId}`" class="author-link">
              {{ post.author }}
            </RouterLink>
          </span>
        </p>
        <p class="post-excerpt">
          {{ post.content.slice(0, 150) }}{{ post.content.length > 150 ? '…' : '' }}
        </p>
        <RouterLink
          class="btn btn-primary btn-sm read-more-btn"
          :to="`/posts/${post.id}`"
        >
          <span>Đọc tiếp</span>
          <span class="arrow">→</span>
        </RouterLink>
      </div>
    </div>

    <!-- Phân trang -->
    <nav class="pagination-wrapper">
      <button
        class="pagination-btn"
        :class="{ disabled: page === 1 }"
        :disabled="page === 1"
        @click="goPrev"
      >
        <span>← Trước</span>
      </button>

      <span class="page-info">
        <span class="current-page">{{ page }}</span>
        <span class="separator">/</span>
        <span class="total-pages">{{ totalPages }}</span>
      </span>

      <button
        class="pagination-btn"
        :class="{ disabled: page === totalPages }"
        :disabled="page === totalPages"
        @click="goNext"
      >
        <span>Sau →</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.post-list-container {
  animation: fadeIn 0.6s ease;
}

.posts-header {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.posts-title {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 1.8rem;
}

.post-card {
  border: none;
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.post-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.2);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.5rem;
}

.post-title {
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
}

.post-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.post-date {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.date-icon {
  font-size: 1rem;
}

.post-author {
  color: #667eea;
  font-weight: 600;
}

.author-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.3s ease;
  padding: 2px 8px;
  border-radius: 6px;
}

.author-link:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #764ba2;
  text-decoration: underline;
}

.post-excerpt {
  color: #34495e;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.read-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.read-more-btn:hover .arrow {
  transform: translateX(5px);
}

.arrow {
  transition: transform 0.3s ease;
  font-size: 1.2rem;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.pagination-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.pagination-btn.disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
  opacity: 0.6;
}

.page-info {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-page {
  color: #667eea;
  font-size: 1.3rem;
}

.separator {
  color: #bdc3c7;
}

.total-pages {
  color: #7f8c8d;
}
</style>
