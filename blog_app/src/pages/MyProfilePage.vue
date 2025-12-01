<template>
  <div class="container mt-4">
    <div class="row">
      <!-- Profile Edit Form -->
      <div class="col-12 col-lg-4 mb-4">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">
              <i class="bi bi-person-circle me-2"></i>Edit Profile
            </h5>
          </div>
          <div class="card-body">
            <!-- Success message -->
            <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
              <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
              <button type="button" class="btn-close" @click="successMessage = ''" aria-label="Close"></button>
            </div>

            <!-- Error message -->
            <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ errorMessage }}
              <button type="button" class="btn-close" @click="errorMessage = ''" aria-label="Close"></button>
            </div>

            <form @submit.prevent="handleUpdateProfile">
              <div class="mb-3">
                <label for="name" class="form-label fw-semibold">Name</label>
                <input
                  id="name"
                  v-model="formData.name"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': errors.name }"
                  placeholder="Your name"
                />
                <div v-if="errors.name" class="invalid-feedback">
                  {{ errors.name }}
                </div>
              </div>

              <div class="mb-3">
                <label for="email" class="form-label fw-semibold">Email</label>
                <input
                  id="email"
                  v-model="formData.email"
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': errors.email }"
                  placeholder="your.email@example.com"
                />
                <div v-if="errors.email" class="invalid-feedback">
                  {{ errors.email }}
                </div>
              </div>

              <div class="mb-3">
                <label for="password" class="form-label fw-semibold">
                  Password <span class="text-muted fw-normal">(leave blank to keep current)</span>
                </label>
                <input
                  id="password"
                  v-model="formData.password"
                  type="password"
                  class="form-control"
                  :class="{ 'is-invalid': errors.password }"
                  placeholder="New password"
                />
                <div v-if="errors.password" class="invalid-feedback">
                  {{ errors.password }}
                </div>
              </div>

              <div class="mb-3">
                <label for="avatar" class="form-label fw-semibold">Avatar URL</label>
                <input
                  id="avatar"
                  v-model="formData.avatar"
                  type="text"
                  class="form-control"
                  placeholder="https://example.com/avatar.jpg"
                />
                <small class="form-text text-muted">Enter a URL for your profile picture</small>
              </div>

              <div class="mb-3">
                <label for="intro" class="form-label fw-semibold">Intro</label>
                <textarea
                  id="intro"
                  v-model="formData.intro"
                  class="form-control"
                  rows="3"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>

              <button
                type="submit"
                class="btn btn-primary w-100"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                <i v-else class="bi bi-save me-2"></i>
                Update Profile
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Posts Section -->
      <div class="col-12 col-lg-8">
        <div class="card mb-3">
          <div class="card-header bg-white border-bottom">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="bi bi-file-text me-2"></i>My Posts
              </h5>
              <span class="badge bg-primary">{{ posts.length }} {{ posts.length === 1 ? 'post' : 'posts' }}</span>
            </div>
          </div>
        </div>

        <!-- Loading posts -->
        <div v-if="postsLoading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading posts...</span>
          </div>
          <p class="mt-2 text-muted">Loading your posts...</p>
        </div>

        <!-- No posts message -->
        <div v-else-if="posts.length === 0" class="text-center py-4">
          <div class="card">
            <div class="card-body">
              <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
              <p class="text-muted mb-3 mt-2">You haven't created any posts yet</p>
              <router-link to="/posts/create" class="btn btn-primary">
                <i class="bi bi-plus-circle me-2"></i>Create Your First Post
              </router-link>
            </div>
          </div>
        </div>

        <!-- Posts list -->
        <div v-else>
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            :author="currentUser!"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useUser } from '../composables/useUser'
import { usePosts } from '../composables/usePosts'
import PostCard from '../components/PostCard.vue'
import type { UpdateUserData } from '../types'

const router = useRouter()
const { currentUser, checkAuth } = useAuth()
const { updateUser } = useUser()
const { posts, loading: postsLoading, fetchPostsByUserId, deletePost } = usePosts()

const formData = reactive({
  name: '',
  email: '',
  password: '',
  avatar: '',
  intro: ''
})

const errors = reactive({
  name: '',
  email: '',
  password: ''
})

const successMessage = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

// Initialize form with current user data
const initializeForm = () => {
  if (currentUser.value) {
    formData.name = currentUser.value.name
    formData.email = currentUser.value.email
    formData.password = '' // Don't populate password
    formData.avatar = currentUser.value.avatar
    formData.intro = currentUser.value.intro
  }
}

// Load user's posts
const loadPosts = async () => {
  if (currentUser.value) {
    try {
      await fetchPostsByUserId(currentUser.value.id)
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
  }
}

// Validate form
const validateForm = (): boolean => {
  let isValid = true
  
  // Reset errors
  errors.name = ''
  errors.email = ''
  errors.password = ''
  errorMessage.value = ''

  // Validate name
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Name is required'
    isValid = false
  }

  // Validate email
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email is required'
    isValid = false
  } else {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
      isValid = false
    }
  }

  // Validate password (only if provided)
  if (formData.password && !formData.password.trim()) {
    errors.password = 'Password cannot be empty or whitespace only'
    isValid = false
  }

  return isValid
}

// Handle profile update
const handleUpdateProfile = async () => {
  if (!validateForm()) {
    return
  }

  if (!currentUser.value) {
    errorMessage.value = 'You must be logged in to update your profile'
    return
  }

  isSubmitting.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    // Build update data (only include fields that have values)
    const updateData: UpdateUserData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      avatar: formData.avatar.trim() || undefined,
      intro: formData.intro.trim() || undefined
    }

    // Only include password if it was changed
    if (formData.password && formData.password.trim()) {
      updateData.password = formData.password.trim()
    }

    await updateUser(currentUser.value.id, updateData)
    
    // Refresh auth state to get updated user data
    checkAuth()
    
    // Show success message
    successMessage.value = 'Profile updated successfully!'
    
    // Clear password field
    formData.password = ''
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to update profile'
  } finally {
    isSubmitting.value = false
  }
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
      
      // Show success message
      successMessage.value = 'Post deleted successfully!'
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to delete post'
    }
  }
}

onMounted(() => {
  // Check authentication
  checkAuth()
  
  // Redirect to login if not authenticated
  if (!currentUser.value) {
    router.push('/login')
    return
  }
  
  // Initialize form and load posts
  initializeForm()
  loadPosts()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
}

.card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-header {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.form-label {
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.form-control {
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.alert {
  border-radius: 6px;
  border: none;
}

.badge {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
}

@media (max-width: 991px) {
  .col-12.col-lg-4 {
    order: 2;
  }
  
  .col-12.col-lg-8 {
    order: 1;
  }
}
</style>
