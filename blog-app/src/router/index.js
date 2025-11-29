import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import PostDetail from '@/views/PostDetail.vue'
import PostForm from '@/views/PostForm.vue'
import Profile from '@/views/Profile.vue'
import UserProfile from '@/views/UserProfile.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  { path: '/posts/:id', name: 'post-detail', component: PostDetail, props: true },
  { path: '/create', name: 'post-create', component: PostForm, meta: { requiresAuth: true } },
  { path: '/edit/:id', name: 'post-edit', component: PostForm, props: true, meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/user/:id', name: 'user-profile', component: UserProfile, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const user = JSON.parse(localStorage.getItem('authUser') || 'null')
  if (to.meta.requiresAuth && !user) return { name: 'login' }
})

export default router
