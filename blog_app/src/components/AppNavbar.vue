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

      <!-- Search Bar (Desktop) -->
      <div class="search-container d-none d-lg-flex" v-if="isAuthenticated">
        <div class="search-input-wrapper position-relative">
          <i class="bi bi-search search-icon"></i>
          <input
            type="text"
            class="form-control search-input"
            :placeholder="t('search.placeholder')"
            v-model="searchQuery"
            @input="handleSearchInput"
            @focus="handleSearchFocusEnhanced"
            @blur="handleSearchBlur"
            @keydown="handleKeyboard"
            ref="searchInputRef"
            role="combobox"
            :aria-expanded="isDropdownOpen"
            :aria-haspopup="true"
            :aria-owns="isDropdownOpen ? 'search-dropdown' : undefined"
            :aria-activedescendant="getActiveDescendantId()"
            autocomplete="off"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="btn-clear-search"
            type="button"
            :aria-label="t('search.clear')"
          >
            <i class="bi bi-x"></i>
          </button>
          
          <!-- Search Dropdown -->
          <SearchDropdown
            id="search-dropdown"
            :is-open="isDropdownOpen"
            :results="searchResults"
            :recent-searches="recentSearches"
            :loading="searchLoading"
            :selected-index="selectedIndex"
            :query="searchQuery"
            :current-user-id="currentUser?.id"
            @select-result="handleSelectResult"
            @select-recent="handleSelectRecent"
            @clear-recent="clearRecentSearches"
            @close="handleCloseDropdown"
          />
        </div>
      </div>

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
        <!-- Mobile Search Bar -->
        <div class="search-container-mobile d-lg-none mb-3" v-if="isAuthenticated">
          <div class="search-input-wrapper position-relative">
            <i class="bi bi-search search-icon"></i>
            <input
              type="text"
              class="form-control search-input"
              :placeholder="t('search.placeholder')"
              v-model="searchQuery"
              @input="handleSearchInput"
              @focus="handleSearchFocusEnhanced"
              @blur="handleSearchBlur"
              @keydown="handleKeyboard"
              role="combobox"
              :aria-expanded="isDropdownOpen"
              :aria-haspopup="true"
              :aria-owns="isDropdownOpen ? 'search-dropdown-mobile' : undefined"
              :aria-activedescendant="getActiveDescendantId()"
              autocomplete="off"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="btn-clear-search"
              type="button"
              :aria-label="t('search.clear')"
            >
              <i class="bi bi-x"></i>
            </button>
            
            <!-- Mobile Search Dropdown -->
            <SearchDropdown
              id="search-dropdown-mobile"
              :is-open="isDropdownOpen"
              :results="searchResults"
              :recent-searches="recentSearches"
              :loading="searchLoading"
              :selected-index="selectedIndex"
              :query="searchQuery"
              :current-user-id="currentUser?.id"
              @select-result="handleSelectResult"
              @select-recent="handleSelectRecent"
              @clear-recent="clearRecentSearches"
              @close="handleCloseDropdown"
            />
          </div>
        </div>
        
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
              <router-link to="/newsfeed" class="nav-link px-3">
                <i class="bi bi-house-door me-1"></i>{{ t('navbar.home') }}
              </router-link>
            </li>
            
            <li class="nav-item">
              <router-link to="/messages" class="nav-link px-3">
                <i class="bi bi-chat-dots me-1"></i>{{ t('messages.messages') }}
              </router-link>
            </li>
            
            <!-- Language & Translation Toggle -->
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
                <li><hr class="dropdown-divider"></li>
                <li>
                  <button @click="toggleTranslation" class="dropdown-item d-flex align-items-center justify-content-between">
                    <span>
                      <i class="bi bi-robot me-2"></i>
                      {{ t('translation.autoTranslate') }}
                    </span>
                    <i class="bi" :class="translationEnabled ? 'bi-toggle-on text-success' : 'bi-toggle-off text-muted'"></i>
                  </button>
                </li>

              </ul>
            </li>
            
            <!-- Notification Bell -->
            <li class="nav-item d-flex align-items-center">
              <NotificationBell />
            </li>
            
            <!-- User Avatar Dropdown -->
            <li class="nav-item dropdown">
              <a
                class="nav-link dropdown-toggle d-flex align-items-center px-2 ms-lg-3"
                href="#"
                id="userDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  :src="currentUser?.avatar || 'https://via.placeholder.com/40'"
                  :alt="currentUser?.name || 'User'"
                  class="user-avatar me-2"
                />
                <span class="user-name d-none d-lg-inline">{{ currentUser?.name || 'User' }}</span>
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
import { ref, nextTick } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'
import { useLocale } from '../composables/useLocale'
import { useContentTranslation } from '../composables/useContentTranslation'

import { useSearch } from '../composables/useSearch'
import SearchDropdown from './SearchDropdown.vue'
import NotificationBell from './NotificationBell.vue'
import type { SearchResult } from '../types'

const { isAuthenticated, currentUser, logout } = useAuth()
const router = useRouter()
const { locale, setLocale, t } = useLocale()
const { translationEnabled, toggleTranslation } = useContentTranslation()


// Search functionality
const {
  query: searchQuery,
  results: searchResults,
  recentSearches,
  loading: searchLoading,
  selectedIndex,
  isDropdownOpen,
  search,
  clearSearch: clearSearchComposable,
  selectResult,
  clearRecent,
  handleKeyboard
} = useSearch(currentUser.value?.id)

const searchInputRef = ref<HTMLInputElement>()

// Handle search input changes
const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  search(target.value)
}

// Handle search blur with delay to allow for dropdown interactions
const handleSearchBlur = () => {
  // Add small delay to allow dropdown clicks to register
  setTimeout(() => {
    isDropdownOpen.value = false
  }, 150)
}

// Clear search and focus input
const clearSearch = () => {
  clearSearchComposable()
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

// Reset selection when dropdown opens/closes
const handleSearchFocusEnhanced = () => {
  // Always show dropdown on focus if there's content to show
  if (searchQuery.value.trim() || recentSearches.value.length > 0) {
    isDropdownOpen.value = true
  }
  // Reset selection when focusing
  selectedIndex.value = -1
}

// Handle search result selection
const handleSelectResult = (result: SearchResult) => {
  selectResult(result)
  // Force close dropdown and reset focus
  isDropdownOpen.value = false
  searchInputRef.value?.blur()
}

// Handle recent search selection
const handleSelectRecent = (query: string) => {
  searchQuery.value = query
  search(query)
}

// Clear recent searches
const clearRecentSearches = () => {
  clearRecent()
}

// Handle dropdown close
const handleCloseDropdown = () => {
  isDropdownOpen.value = false
}

// Get active descendant ID for ARIA
const getActiveDescendantId = () => {
  if (selectedIndex.value < 0 || !isDropdownOpen.value) return ''
  
  // For recent searches
  if (!searchQuery.value.trim() && recentSearches.value.length > 0) {
    return `recent-search-${selectedIndex.value}`
  }
  
  // For search results
  if (searchResults.value.total > 0) {
    const userCount = searchResults.value.users.length
    if (selectedIndex.value < userCount) {
      return `user-result-${selectedIndex.value}`
    } else {
      return `post-result-${selectedIndex.value - userCount}`
    }
  }
  
  return ''
}

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #1877F2 0%, #42A5F5 100%) !important;
  box-shadow: 0 8px 32px rgba(24, 119, 242, 0.3);
  padding: 1rem 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1030;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.navbar-brand {
  font-size: 1.5rem;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
}

.navbar-brand:hover {
  transform: scale(1.05) translateY(-2px);
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
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
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 12px;
  margin: 0.25rem 0;
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.nav-link:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link.router-link-active {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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

/* User Name */
.user-name {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 0.95rem;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-toggle.d-flex:hover .user-name {
  color: white;
}

/* Enhanced 3D Dropdown Menu */
.dropdown-menu {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  margin-top: 0.5rem;
  min-width: 220px;
  padding: 0.5rem;
  animation: dropdownSlide 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dropdown-item {
  padding: 0.75rem 1.25rem;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  color: #333;
  font-weight: 500;
  border-radius: 12px;
  margin: 0.25rem 0;
  position: relative;
  overflow: hidden;
}

.dropdown-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(24, 119, 242, 0.1), transparent);
  transition: left 0.5s;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, rgba(24, 119, 242, 0.1), rgba(66, 165, 245, 0.1));
  color: #1877F2;
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(24, 119, 242, 0.2);
}

.dropdown-item:hover::before {
  left: 100%;
}

.dropdown-item.active {
  background: linear-gradient(135deg, #1877F2, #42A5F5);
  color: white;
  box-shadow: 0 4px 12px rgba(24, 119, 242, 0.4);
}

.dropdown-item i {
  width: 20px;
}

.dropdown-divider {
  margin: 0.5rem 0;
}

/* Search Bar Styles */
.search-container {
  max-width: 320px;
  width: 100%;
}

.search-container-mobile {
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  z-index: 1000;
}

.search-input {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  color: white;
  padding: 12px 45px 12px 45px;
  font-size: 0.9rem;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  outline: none;
  color: white;
  transform: translateY(-2px);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  pointer-events: none;
  z-index: 2;
}

.btn-clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 4px;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 2;
}

.btn-clear-search:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-clear-search i {
  font-size: 0.8rem;
}

/* Desktop search positioning */
@media (min-width: 992px) {
  .search-container {
    margin-left: 2rem;
    margin-right: auto;
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
  
  .user-avatar {
    margin: 0.5rem 0;
  }
  
  .dropdown-menu {
    background-color: rgba(255, 255, 255, 0.95);
  }
  
  .search-input {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .search-input:focus {
    background-color: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

:global(.christmas-mode .navbar) {
  background: linear-gradient(
    135deg,
    #b11226,
    #c41e3a
  ) !important;

  box-shadow:
    0 4px 20px rgba(196, 30, 58, 0.6),
    inset 0 -2px 0 rgba(255, 215, 0, 0.7);

  border-bottom: none;
}

</style>
