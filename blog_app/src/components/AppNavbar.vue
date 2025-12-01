<template>
  <nav class="navbar navbar-expand-lg navbar-dark">
    <div class="container">
      <!-- Logo/Brand -->
      <router-link to="/" class="navbar-brand d-flex align-items-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="me-2">
          <rect width="32" height="32" rx="8" fill="white" fill-opacity="0.2"/>
          <path d="M8 12h16M8 16h16M8 20h10" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span class="fw-bold">Blog App</span>
      </router-link>

      <!-- Mobile toggle button -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Navigation links -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <!-- Guest links (not authenticated) -->
          <template v-if="!isAuthenticated">
            <li class="nav-item">
              <router-link to="/" class="nav-link">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/login" class="nav-link">Login</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/register" class="nav-link">Register</router-link>
            </li>
          </template>

          <!-- Authenticated user links -->
          <template v-else>
            <li class="nav-item">
              <router-link to="/" class="nav-link px-3">
                <i class="bi bi-house-door me-1"></i>Home
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/posts/create" class="nav-link px-3">
                <i class="bi bi-plus-circle me-1"></i>Create Post
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/profile" class="nav-link px-3">
                <i class="bi bi-person-circle me-1"></i>Profile
              </router-link>
            </li>
            <li class="nav-item">
              <button @click="handleLogout" class="btn btn-outline-light btn-sm ms-lg-2 mt-2 mt-lg-0">
                <i class="bi bi-box-arrow-right me-1"></i>Logout
              </button>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'

const { isAuthenticated, logout } = useAuth()
const router = useRouter()

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
}

.navbar-brand {
  font-size: 1.5rem;
  transition: transform 0.2s ease;
}

.navbar-brand:hover {
  transform: scale(1.05);
}

.nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 500;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 0.25rem 0;
}

.nav-link:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.2);
}

.btn-outline-light {
  border-width: 2px;
  font-weight: 600;
  padding: 0.5rem 1.5rem;
  transition: all 0.2s ease;
}

.btn-outline-light:hover {
  background-color: white;
  color: #667eea;
  transform: translateY(-1px);
}

/* Desktop specific */
@media (min-width: 992px) {
  .nav-link {
    margin: 0 0.25rem;
  }
  
  .navbar-nav {
    align-items: center;
  }
}

/* Mobile specific */
@media (max-width: 991px) {
  .navbar-collapse {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
  }
}
</style>
