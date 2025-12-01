<template>
  <div class="container mt-4">
    <!-- Loading indicator -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Loading profile...</p>
    </div>

    <!-- Profile content -->
    <div v-else-if="profileUser">
      <!-- User Profile Header -->
      <UserProfileHeader :user="profileUser" :post-count="postCount">
        <template #actions>
          <!-- Show "Send Message" button for other users' profiles -->
          <button 
            v-if="currentUser && currentUser.id !== profileUser.id"
            class="btn btn-primary"
            @click="handleSendMessage"
          >
            Send Message
          </button>
          <!-- Show "Edit Profile" button for own profile -->
          <router-link
            v-if="currentUser && currentUser.id === profileUser.id"
            to="/profile"
            class="btn btn-primary"
          >
            Edit Profile
          </router-link>
        </template>
      </UserProfileHeader>

      <!-- Posts section -->
      <div class="row">
        <div class="col-12">
          <h4 class="mb-3">Posts</h4>

          <!-- Loading posts -->
          <div v-if="postsLoading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading posts...</span>
            </div>
          </div>

          <!-- No posts message -->
          <div v-else-if="posts.length === 0" class="text-center py-4">
            <div class="card">
              <div class="card-body">
                <p class="text-muted mb-0">No posts yet</p>
              </div>
            </div>
          </div>

          <!-- Posts list -->
          <div v-else>
            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
              :author="profileUser"
              @edit="handleEdit"
              @delete="handleDelete"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else class="text-center py-5">
      <div class="alert alert-danger">
        <h5>User not found</h5>
        <p class="mb-0">The requested user profile could not be found.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUser } from '../composables/useUser'
import { usePosts } from '../composables/usePosts'
import { useAuth } from '../composables/useAuth'
import PostCard from '../components/PostCard.vue'
import UserProfileHeader from '../components/UserProfileHeader.vue'

const route = useRoute()
const router = useRouter()
const { user: profileUser, loading, fetchUserById } = useUser()
const { posts, loading: postsLoading, fetchPostsByUserId, deletePost } = usePosts()
const { currentUser } = useAuth()

// Compute post count
const postCount = computed(() => posts.value.length)

// Load user profile and their posts
const loadProfile = async () => {
  const userId = route.params.userId as string
  
  if (!userId) {
    return
  }

  try {
    // Fetch user profile
    await fetchUserById(userId)
    
    // Fetch posts by this user (sorted by timestamp descending per Requirement 13.3)
    await fetchPostsByUserId(userId)
  } catch (error) {
    console.error('Failed to load profile:', error)
  }
}

// Handle send message button click
const handleSendMessage = () => {
  if (profileUser.value) {
    router.push(`/messages/${profileUser.value.id}`)
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
      if (profileUser.value) {
        await fetchPostsByUserId(profileUser.value.id)
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('Failed to delete post. Please try again.')
    }
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.container {
  max-width: 900px;
}
</style>
