<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api';

const route = useRoute();
const router = useRouter();
const id = route.params.id;  

const post = ref(null);
const comments = ref([]);
const newComment = ref('');
const replyingTo = ref(null); // Comment đang được reply
const replyContent = ref(''); // Nội dung reply
const user = JSON.parse(localStorage.getItem('authUser') || 'null');

const canEdit = computed(() => user && post.value && user.id === post.value.userId);

// Computed: Tổ chức comments thành cây (parent-child)
const organizedComments = computed(() => {
  if (!comments.value.length) return [];
  
  // Tạo map để tra cứu nhanh
  const commentsMap = {};
  comments.value.forEach(c => {
    commentsMap[c.id] = { ...c, replies: [] };
  });
  
  // Tổ chức thành cây
  const rootComments = [];
  comments.value.forEach(c => {
    if (c.parentId && commentsMap[c.parentId]) {
      // Là reply, thêm vào parent
      commentsMap[c.parentId].replies.push(commentsMap[c.id]);
    } else {
      // Là comment gốc
      rootComments.push(commentsMap[c.id]);
    }
  });
  
  return rootComments;
});

const fetchAll = async () => {
  try {
    // Lấy post, comments, users song song
    const [postRes, cmtRes, userRes] = await Promise.all([
      api.getPost(id),
      api.listComments(id),
      api.listUsers()
    ]);

    // Tạo map userId -> user
    const usersById = {};
    for (const u of userRes.data) {
      usersById[String(u.id)] = u;
    }

    // Gắn tên tác giả vào post
    post.value = {
      ...postRes.data,
      author: usersById[String(postRes.data.userId)]?.name || 'Ẩn danh'
    };

    // Gắn user tương ứng vào từng comment
    comments.value = cmtRes.data.map(c => ({
      ...c,
      user: usersById[String(c.userId)] || null
    }));
  } catch (e) {
    console.error(e);
  }
};


const addComment = async () => {
  if (!user) return router.push({ name: 'login' });
  if (!newComment.value.trim()) return;
  await api.createComment({
    postId: id,                 
    userId: user.id,
    content: newComment.value,
    parentId: null, // Comment gốc
    createdAt: new Date().toISOString()
  });
  newComment.value = '';
  fetchAll();
};

// Bắt đầu reply comment
const startReply = (comment) => {
  replyingTo.value = comment;
  replyContent.value = '';
};

// Hủy reply
const cancelReply = () => {
  replyingTo.value = null;
  replyContent.value = '';
};

// Gửi reply
const sendReply = async () => {
  if (!user) return router.push({ name: 'login' });
  if (!replyContent.value.trim() || !replyingTo.value) return;
  
  await api.createComment({
    postId: id,
    userId: user.id,
    content: replyContent.value,
    parentId: replyingTo.value.id, // ID của comment cha
    createdAt: new Date().toISOString()
  });
  
  cancelReply();
  fetchAll();
};


const removePost = async () => {
  if (confirm('Xóa bài viết này?')) {
    await api.deletePost(id);
    router.push('/');
  }
};

onMounted(fetchAll);
</script>

<template>
  <div class="post-detail-wrapper" v-if="post">
    <div class="container py-4">
      <div class="post-content-card card mb-4">
        <div class="card-body">
          <h1 class="post-title">{{ post.title }}</h1>
          
          <div class="post-meta">
            <span class="meta-icon">🕒</span>
            <span class="meta-date">{{ new Date(post.createdAt).toLocaleString('vi-VN') }}</span>
            <span class="meta-separator">-</span>
            <RouterLink :to="`/user/${post.userId}`" class="meta-author-link">
              {{ post.author }}
            </RouterLink>
          </div>
          
          <img 
            v-if="post.image" 
            :src="post.image" 
            class="post-image" 
            alt="Post image" 
          />
          
          <div class="post-content">
            {{ post.content }}
          </div>

          <div class="post-actions" v-if="canEdit">
            <RouterLink class="btn btn-edit" :to="`/edit/${post.id}`">
              <span class="btn-icon">✏️</span>
              Sửa bài
            </RouterLink>
            <button class="btn btn-delete" @click="removePost">
              <span class="btn-icon">🗑️</span>
              Xóa bài
            </button>
          </div>
        </div>
      </div>

      <div class="comments-section card">
        <div class="card-body">
          <div class="comments-header">
            <h5 class="comments-title">
              <span class="title-icon">💬</span>
              Bình luận
              <span class="comment-count">({{ comments.length }})</span>
            </h5>
          </div>

          <div class="comment-form mb-4">
            <textarea 
              v-model="newComment" 
              class="form-control comment-textarea" 
              rows="3" 
              placeholder="Viết bình luận của bạn..."
            ></textarea>
            <button class="btn btn-submit-comment" @click="addComment">
              <span class="btn-icon">📤</span>
              Gửi bình luận
            </button>
          </div>

          <div class="comments-list">
            <!-- Comment gốc -->
            <div class="comment-item" v-for="c in organizedComments" :key="c.id">
              <div class="comment-header">
                <div class="comment-user-info">
                  <img
                    :src="c.user?.avatar || 'https://via.placeholder.com/32x32.png?text=U'"
                    class="comment-avatar"
                    alt="avatar"
                  />
                  <div class="comment-meta">
                    <strong class="comment-author">{{ c.user?.name || ('User #' + c.userId) }}</strong>
                    <div class="comment-date">
                      <span class="date-icon">🕒</span>
                      {{ new Date(c.createdAt).toLocaleString('vi-VN') }}
                    </div>
                  </div>
                </div>
                <span class="comment-badge">#{{ c.id }}</span>
              </div>
              <p class="comment-content">{{ c.content }}</p>
              
              <!-- Nút Reply -->
              <div class="comment-actions">
                <button 
                  class="btn-reply" 
                  @click="startReply(c)"
                  v-if="user"
                >
                  <span class="reply-icon">↩️</span>
                  Trả lời
                </button>
                <span class="reply-count" v-if="c.replies.length > 0">
                  {{ c.replies.length }} phản hồi
                </span>
              </div>

              <!-- Form Reply -->
              <div class="reply-form" v-if="replyingTo?.id === c.id">
                <div class="reply-form-header">
                  <span class="reply-to-text">Trả lời <strong>{{ c.user?.name }}</strong></span>
                  <button class="btn-cancel-reply" @click="cancelReply">✕</button>
                </div>
                <textarea 
                  v-model="replyContent"
                  class="form-control reply-textarea"
                  rows="2"
                  placeholder="Viết phản hồi..."
                  @keyup.ctrl.enter="sendReply"
                ></textarea>
                <div class="reply-form-actions">
                  <button class="btn btn-send-reply" @click="sendReply">
                    <span class="btn-icon">📤</span>
                    Gửi
                  </button>
                  <button class="btn btn-cancel" @click="cancelReply">Hủy</button>
                </div>
              </div>

              <!-- Replies (nested comments) -->
              <div class="replies-list" v-if="c.replies.length > 0">
                <div class="reply-item" v-for="reply in c.replies" :key="reply.id">
                  <div class="reply-header">
                    <div class="reply-user-info">
                      <img
                        :src="reply.user?.avatar || 'https://via.placeholder.com/32x32.png?text=U'"
                        class="reply-avatar"
                        alt="avatar"
                      />
                      <div class="reply-meta">
                        <strong class="reply-author">{{ reply.user?.name || ('User #' + reply.userId) }}</strong>
                        <div class="reply-date">
                          <span class="date-icon">🕒</span>
                          {{ new Date(reply.createdAt).toLocaleString('vi-VN') }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p class="reply-content">{{ reply.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-detail-wrapper {
  min-height: 100vh;
  animation: fadeIn 0.6s ease;
}

.post-content-card {
  border: none;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.post-title {
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.3;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1.5rem;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 10px;
  font-size: 0.95rem;
}

.meta-icon {
  font-size: 1.1rem;
}

.meta-date {
  color: #5a6c7d;
  font-weight: 500;
}

.meta-separator {
  color: #bdc3c7;
  font-weight: 600;
}

.meta-author-link {
  color: #667eea;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  padding: 4px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.meta-author-link:hover {
  background: rgba(102, 126, 234, 0.15);
  color: #764ba2;
  text-decoration: underline;
}

.post-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 15px;
  margin: 1.5rem 0;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.post-content {
  color: #34495e;
  font-size: 1.1rem;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.post-actions {
  display: flex;
  gap: 12px;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f0f0f0;
}

.btn-edit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-delete {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.btn-icon {
  font-size: 1.1rem;
}

.comments-section {
  border: none;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.comments-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.comments-title {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 1.8rem;
}

.comment-count {
  color: #7f8c8d;
  font-size: 1.2rem;
  font-weight: 500;
}

.comment-form {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 15px;
}

.comment-textarea {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.comment-textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.btn-submit-comment {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-submit-comment:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 15px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.comment-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
  transform: translateX(5px);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.comment-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #667eea;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comment-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-author {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
}

.comment-date {
  color: #7f8c8d;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-icon {
  font-size: 0.9rem;
}

.comment-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.comment-content {
  color: #34495e;
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0 0 1rem 0;
  padding-left: 52px;
}

/* Comment Actions */
.comment-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-left: 52px;
  margin-top: 0.5rem;
}

.btn-reply {
  background: transparent;
  border: none;
  color: #667eea;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-reply:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(3px);
}

.reply-icon {
  font-size: 1rem;
}

.reply-count {
  color: #7f8c8d;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Reply Form */
.reply-form {
  margin-top: 1rem;
  margin-left: 52px;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 3px solid #667eea;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reply-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.reply-to-text {
  color: #5a6c7d;
  font-size: 0.9rem;
}

.btn-cancel-reply {
  background: transparent;
  border: none;
  color: #7f8c8d;
  font-size: 1.2rem;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-cancel-reply:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #e74c3c;
}

.reply-textarea {
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
}

.reply-textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.15);
}

.reply-form-actions {
  display: flex;
  gap: 10px;
}

.btn-send-reply {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-send-reply:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-cancel {
  background: #e0e0e0;
  color: #666;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #d0d0d0;
}

/* Replies List */
.replies-list {
  margin-top: 1rem;
  margin-left: 52px;
  padding-left: 20px;
  border-left: 3px solid #e0e0e0;
}

.reply-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
}

.reply-item:hover {
  background: #f0f2f5;
  transform: translateX(5px);
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
}

.reply-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reply-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #667eea;
  object-fit: cover;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.reply-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.reply-author {
  color: #2c3e50;
  font-size: 0.95rem;
  font-weight: 600;
}

.reply-date {
  color: #7f8c8d;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reply-content {
  color: #34495e;
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
}
</style>
