import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import RegisterPage from '../pages/RegisterPage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/HomePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: { guestOnly: true }
  },
  {
    path: '/profile/:userId',
    name: 'UserProfile',
    component: () => import('../pages/UserProfilePage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/profile',
    name: 'MyProfile',
    component: () => import('../pages/MyProfilePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/posts/create',
    name: 'CreatePost',
    component: () => import('../pages/CreatePostPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/posts/:id/edit',
    name: 'EditPost',
    component: () => import('../pages/EditPostPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../pages/ConversationsPage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for protected and guest-only routes
router.beforeEach((to, _from, next) => {
  // Check authentication status from localStorage
  const authToken = localStorage.getItem('authToken')
  const isAuthenticated = !!authToken

  // Handle protected routes (requiresAuth: true)
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect unauthenticated users to login
    next('/login')
  } 
  // Handle guest-only routes (guestOnly: true)
  else if (to.meta.guestOnly && isAuthenticated) {
    // Redirect authenticated users to home
    next('/')
  } 
  // Allow navigation
  else {
    next()
  }
})

export default router
