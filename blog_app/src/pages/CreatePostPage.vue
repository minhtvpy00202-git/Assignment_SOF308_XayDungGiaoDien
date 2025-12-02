<template>
  <div class="create-post-page">
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8 col-xl-7">
          <div class="card shadow-sm">
            <div class="card-header bg-white border-bottom py-3">
              <div class="d-flex align-items-center">
                <i class="bi bi-pencil-square text-primary fs-4 me-3"></i>
                <h2 class="mb-0 fw-bold">{{ t('post.createPost') }}</h2>
              </div>
            </div>
            <div class="card-body p-4">
              <PostForm
                ref="postFormRef"
                :submit-button-text="t('post.submit')"
                @submit="handleCreatePost"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PostForm from '../components/PostForm.vue'
import { usePosts } from '../composables/usePosts'
import { useLocale } from '../composables/useLocale'
import type { CreatePostData, UpdatePostData } from '../types'

const router = useRouter()
const { createPost } = usePosts()
const { t } = useLocale()
const postFormRef = ref<InstanceType<typeof PostForm> | null>(null)

const handleCreatePost = async (postData: CreatePostData | UpdatePostData) => {
  try {
    await createPost(postData as CreatePostData)
    
    // Redirect to home page on success
    router.push('/')
  } catch (error) {
    // Display error in the form
    if (postFormRef.value) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post'
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
.create-post-page {
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
