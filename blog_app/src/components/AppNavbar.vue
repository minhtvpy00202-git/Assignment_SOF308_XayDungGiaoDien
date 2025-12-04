<template>
  <nav class="navbar navbar-expand-lg navbar-dark">
    <div class="container">
      <!-- Logo/Brand -->
      <router-link to="/" class="navbar-brand d-flex align-items-center">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="me-2 brand-logo">
          <!-- Background circle -->
          <circle cx="20" cy="20" r="18" fill="white" fill-opacity="0.95"/>
          
          <!-- Blog icon - Document -->
          <rect x="12" y="10" width="16" height="20" rx="2" fill="#1877F2"/>
          
          <!-- Text lines -->
          <rect x="14" y="13" width="12" height="1.5" rx="0.75" fill="white"/>
          <rect x="14" y="16.5" width="12" height="1.5" rx="0.75" fill="white"/>
          <rect x="14" y="20" width="9" height="1.5" rx="0.75" fill="white"/>
          <rect x="14" y="23.5" width="10" height="1.5" rx="0.75" fill="white"/>
          
          <!-- Pen icon -->
          <circle cx="26" cy="26" r="5" fill="white"/>
          <path d="M24 26L26 28L28 26L26 24L24 26Z" fill="#1877F2"/>
        </svg>
        <span class="fw-bold brand-text">Blog360</span>
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
              <router-link to="/" class="nav-link">{{ t('navbar.home') }}</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/login" class="nav-link">{{ t('navbar.login') }}</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/register" class="nav-link">{{ t('navbar.register') }}</router-link>
            </li>
          </template>

          <!-- Authenticated user links -->
          <template v-else>
            <li class="nav-item">
              <router-link to="/" class="nav-link px-3">
                <i class="bi bi-house-door me-1"></i>{{ t('navbar.home') }}
              </router-link>
            </li>
            
            <!-- Language Toggle -->
            <li class="nav-item dropdown">
              <a
                class="nav-link dropdown-toggle px-3"
                href="#"
                id="languageDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="bi bi-translate me-1"></i>{{ locale === 'vi' ? '🇻🇳' : '🇬🇧' }}
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="languageDropdown">
                <li>
                  <button @click="setLocale('en')" class="dropdown-item" :class="{ active: locale === 'en' }">
                    🇬🇧 {{ t('language.english') }}
                  </button>
                </li>
                <li>
                  <button @click="setLocale('vi')" class="dropdown-item" :class="{ active: locale === 'vi' }">
                    🇻🇳 {{ t('language.vietnamese') }}
                  </button>
                </li>
              </ul>
            </li>
            
            <!-- User Avatar Dropdown -->
            <li class="nav-item dropdown">
              <a
                class="nav-link dropdown-toggle p-0 ms-lg-3"
                href="#"
                id="userDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  :src="currentUser?.avatar || 'https://via.placeholder.com/40'"
                  :alt="currentUser?.name || 'User'"
                  class="user-avatar"
                />
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li>
                  <router-link to="/posts/create" class="dropdown-item">
                    <i class="bi bi-plus-circle me-2"></i>{{ t('navbar.createPost') }}
                  </router-link>
                </li>
                <li>
                  <router-link to="/profile" class="dropdown-item">
                    <i class="bi bi-person-circle me-2"></i>{{ t('navbar.profile') }}
                  </router-link>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <button @click="handleLogout" class="dropdown-item">
                    <i class="bi bi-box-arrow-right me-2"></i>{{ t('navbar.logout') }}
                  </button>
                </li>
              </ul>
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
import { useLocale } from '../composables/useLocale'

const { isAuthenticated, currentUser, logout } = useAuth()
const router = useRouter()
const { locale, setLocale, t } = useLocale()

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background: #1877F2 !important;
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

.brand-logo {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: transform 0.2s ease;
}

.navbar-brand:hover .brand-logo {
  transform: rotate(-5deg) scale(1.1);
}

.brand-text {
  font-size: 1.5rem;
  letter-spacing: -0.5px;
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
  color: #1877F2;
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

/* User Avatar */
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-avatar:hover {
  border-color: white;
  transform: scale(1.05);
}

/* Dropdown Menu */
.dropdown-menu {
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  margin-top: 0.5rem;
  min-width: 200px;
}

.dropdown-item {
  padding: 0.75rem 1.25rem;
  transition: all 0.2s ease;
  color: #333;
  font-weight: 500;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  color: #1877F2;
  padding-left: 1.5rem;
}

.dropdown-item.active {
  background-color: #1877F2;
  color: white;
}

.dropdown-item i {
  width: 20px;
}

.dropdown-divider {
  margin: 0.5rem 0;
}

/* Mobile specific */
@media (max-width: 991px) {
  .navbar-collapse {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
  }
  
  .user-avatar {
    margin: 0.5rem 0;
  }
  
  .dropdown-menu {
    background-color: rgba(255, 255, 255, 0.95);
  }
}
</style>
