<template>
  <div class="home-page">
    <div class="container-fluid mt-4">
    <div class="row">
      <!-- Left column: Messages sidebar (only for authenticated users) -->
      <div v-if="currentUser" class="col-md-3">
        <MessagesSidebar />
      </div>

      <!-- Center column: News feed -->
      <div :class="currentUser ? 'col-md-6' : 'col-md-9'">
        <!-- Create post bar (only for authenticated users) -->
        <div v-if="currentUser" class="mb-4">
          <PostCreatorBar 
            @click="showPostFormModal = true"
            @upload="handleUploadClick"
            @video-click="handleVideoClick"
            @emotion-click="handleEmotionClick"
          />
        </div>

        <!-- Loading indicator -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary loading-pulse" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted text-shadow">Loading posts...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="posts.length === 0" class="text-center py-5">
          <div class="card glass-effect border-radius-xl hover-lift">
            <div class="card-body">
              <h5 class="text-muted text-shadow">No posts available</h5>
              <p class="text-muted">Be the first to create a post!</p>
              <router-link v-if="currentUser" to="/posts/create" class="btn btn-primary glow-effect">
                Create Post
              </router-link>
            </div>
          </div>
        </div>

        <!-- Posts list -->
        <div v-else class="posts-container">
          <PostCard
            v-for="(post, index) in postsWithAuthors"
            :key="post.id"
            :post="post"
            :author="postAuthors[post.userId]!"
            :class="['magnetic-hover', index % 2 === 0 ? 'card-hover' : '']"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
      </div>

      <!-- Right column: Suggestions sidebar -->
      <div v-if="currentUser" class="col-md-3">
        <SuggestionsSidebar />
      </div>
    </div>

    <!-- Post Form Modal -->
    <PostFormModal
      v-model="showPostFormModal"
      ref="modalRef"
      @submit="handleCreatePost"
    />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePosts } from '../composables/usePosts'
import { useAuth } from '../composables/useAuth'
import { apiService } from '../services/apiService'
import PostCard from '../components/PostCard.vue'
import MessagesSidebar from '../components/MessagesSidebar.vue'
import SuggestionsSidebar from '../components/SuggestionsSidebar.vue'
import PostFormModal from '../components/PostFormModal.vue'
import PostCreatorBar from '../components/PostCreatorBar.vue'
import type { User, CreatePostData, UpdatePostData } from '../types'

const router = useRouter()
const { posts, loading, fetchPosts, deletePost, createPost } = usePosts()
const { currentUser } = useAuth()

// Store authors for each post
const postAuthors = ref<Record<string, User>>({})
const modalRef = ref<InstanceType<typeof PostFormModal> | null>(null)
const showPostFormModal = ref(false)
const formSubmitting = ref(false)

// Filter posts that have authors loaded
const postsWithAuthors = computed(() => {
  return posts.value.filter(post => postAuthors.value[post.userId])
})

// Load posts and their authors
const loadPosts = async () => {
  await fetchPosts()
  
  // Filter out posts with null or invalid userId
  const validPosts = posts.value.filter(post => post.userId && post.userId.trim() !== '')
  
  // Fetch authors for all valid posts
  const authorIds = new Set(validPosts.map(post => post.userId))
  
  // Fetch authors one by one and handle errors
  const authorsMap: Record<string, User> = {}
  for (const id of authorIds) {
    try {
      const author = await apiService.getUserById(id)
      authorsMap[author.id] = author
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error)
    }
  }
  
  postAuthors.value = authorsMap
}

// Handle edit post
const handleEdit = (postId: string) => {
  router.push(`/posts/${postId}/edit`)
}

// Handle delete post
const handleDelete = async (postId: string) => {
  if (confirm('Are you sure you want to delete this post? This will also delete all comments.')) {
    try {
      await deletePost(postId)
      // Reload posts after deletion
      await loadPosts()
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('Failed to delete post. Please try again.')
    }
  }
}

// Handle create post
const handleCreatePost = async (postData: CreatePostData | UpdatePostData) => {
  try {
    formSubmitting.value = true
    await createPost(postData as CreatePostData)
    
    // Reset form and reload posts
    showPostFormModal.value = false
    await loadPosts()
    
    // Show success message
    const success = document.createElement('div')
    success.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x'
    success.setAttribute('role', 'alert')
    success.style.zIndex = '9999'
    success.style.marginTop = '20px'
    success.innerHTML = '<i class="bi bi-check-circle me-2"></i>Post created successfully! <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
    document.body.appendChild(success)
    
    setTimeout(() => success.remove(), 4000)
  } catch (error) {
    if (modalRef.value) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post'
      modalRef.value.setError(errorMessage)
    }
  } finally {
    formSubmitting.value = false
  }
}

// Handle upload click
const handleUploadClick = () => {
  showPostFormModal.value = true
  // Focus on file input after form opens
  setTimeout(() => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fileInput?.click()
  }, 100)
}

// Handle video click
const handleVideoClick = () => {
  showPostFormModal.value = true
  // Trigger video input after modal opens
  setTimeout(() => {
    if (modalRef.value) {
      modalRef.value.triggerVideoInput()
    }
  }, 100)
}

// Handle emotion click
const handleEmotionClick = () => {
  showPostFormModal.value = true
  // Trigger emotion selector after modal opens
  setTimeout(() => {
    if (modalRef.value) {
      modalRef.value.triggerEmotionSelector()
    }
  }, 100)
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.container-fluid {
  max-width: 1400px;
  position: relative;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.posts-container {
  position: relative;
}

.posts-container .card {
  margin-bottom: 2rem;
  animation-duration: 8s;
}
  .home-page {
    background: transparent;
    min-height: 100vh;
  }

  @media (max-width: 576px) {
    .home-page {
      background: #fff;
    }
  }
</style>
