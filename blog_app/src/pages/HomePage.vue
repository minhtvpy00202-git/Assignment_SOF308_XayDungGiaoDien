<template>
  <div class="container-fluid mt-4">
    <div class="row">
      <!-- Left column: Messages sidebar (only for authenticated users) -->
      <div v-if="currentUser" class="col-md-3">
        <MessagesSidebar />
      </div>

      <!-- Center column: News feed -->
      <div :class="currentUser ? 'col-md-6' : 'col-md-9'">
        <!-- Loading indicator -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Loading posts...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="posts.length === 0" class="text-center py-5">
          <div class="card">
            <div class="card-body">
              <h5 class="text-muted">No posts available</h5>
              <p class="text-muted">Be the first to create a post!</p>
              <router-link v-if="currentUser" to="/posts/create" class="btn btn-primary">
                Create Post
              </router-link>
            </div>
          </div>
        </div>

        <!-- Posts list -->
        <div v-else>
          <PostCard
            v-for="post in postsWithAuthors"
            :key="post.id"
            :post="post"
            :author="postAuthors[post.userId]!"
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
import type { User } from '../types'

const router = useRouter()
const { posts, loading, fetchPosts, deletePost } = usePosts()
const { currentUser } = useAuth()

// Store authors for each post
const postAuthors = ref<Record<string, User>>({})

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

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.container-fluid {
  max-width: 1400px;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}
</style>
