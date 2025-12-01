<template>
  <div class="edit-post-page">
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8 col-xl-7">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Loading post...</p>
          </div>

          <div v-else-if="error" class="alert alert-danger shadow-sm" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {{ error }}
            <div class="mt-3">
              <button class="btn btn-primary" @click="router.push('/')">
                <i class="bi bi-house-door me-2"></i>Go to Home
              </button>
            </div>
          </div>

          <div v-else-if="currentPost" class="card shadow-sm">
            <div class="card-header bg-white border-bottom py-3">
              <div class="d-flex align-items-center">
                <i class="bi bi-pencil-square text-primary fs-4 me-3"></i>
                <h2 class="mb-0 fw-bold">Edit Post</h2>
              </div>
            </div>
            <div class="card-body p-4">
              <PostForm
                ref="postFormRef"
                :initial-data="currentPost"
                submit-button-text="Update Post"
                @submit="handleUpdatePost"
                @cancel="handleCancel"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PostForm from '../components/PostForm.vue'
import { usePosts } from '../composables/usePosts'
import { useAuth } from '../composables/useAuth'
import type { UpdatePostData } from '../types'

const router = useRouter()
const route = useRoute()
const { currentPost, loading, error, fetchPostById, updatePost } = usePosts()
const { currentUser } = useAuth()
const postFormRef = ref<InstanceType<typeof PostForm> | null>(null)

const postId = route.params.id as string

onMounted(async () => {
  try {
    await fetchPostById(postId)
    
    // Check ownership after fetching the post
    if (currentPost.value && currentUser.value) {
      if (currentPost.value.userId !== currentUser.value.id) {
        // User doesn't own this post, redirect with error
        router.push('/')
      }
    }
  } catch (err) {
    // Error will be displayed in the template
    console.error('Failed to fetch post:', err)
  }
})

const handleUpdatePost = async (postData: UpdatePostData) => {
  try {
    await updatePost(postId, postData)
    
    // Redirect to home page on success
    router.push('/')
  } catch (error) {
    // Display error in the form
    if (postFormRef.value) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update post'
      postFormRef.value.setError(errorMessage)
    }
  } finally {
    if (postFormRef.value) {
      postFormRef.value.setSubmitting(false)
    }
  }
}

const handleCancel = () => {
  router.push('/')
}
</script>

<style scoped>
.edit-post-page {
  background-color: #f8f9fa;
  min-height: calc(100vh - 72px);
}

.card {
  border: none;
  border-radius: 12px;
}

.card-header {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

@media (min-width: 768px) {
  .card-body {
    padding: 2rem !important;
  }
}
</style>
