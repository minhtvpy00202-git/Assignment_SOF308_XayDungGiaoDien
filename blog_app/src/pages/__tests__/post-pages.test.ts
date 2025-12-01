import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import CreatePostPage from '../CreatePostPage.vue'
import EditPostPage from '../EditPostPage.vue'

// Mock the composables
vi.mock('../../composables/usePosts', () => ({
  usePosts: () => ({
    createPost: vi.fn(),
    updatePost: vi.fn(),
    fetchPostById: vi.fn(),
    currentPost: { value: { id: '1', userId: 'user1', title: 'Test', content: 'Content', image: '', createdAt: '2024-01-01' } },
    loading: { value: false },
    error: { value: null }
  })
}))

vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({
    currentUser: { value: { id: 'user1', name: 'Test User', email: 'test@test.com', password: 'pass', avatar: '', intro: '' } },
    isAuthenticated: { value: true }
  })
}))

describe('CreatePostPage', () => {
  it('renders the create post form', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/posts/create', component: CreatePostPage }]
    })

    const wrapper = mount(CreatePostPage, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('h2').text()).toBe('Create New Post')
    expect(wrapper.find('input#title').exists()).toBe(true)
    expect(wrapper.find('textarea#content').exists()).toBe(true)
  })
})

describe('EditPostPage', () => {
  it('renders the edit post form', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/posts/:id/edit', component: EditPostPage }]
    })

    await router.push('/posts/1/edit')

    const wrapper = mount(EditPostPage, {
      global: {
        plugins: [router]
      }
    })

    // Wait for component to mount
    await wrapper.vm.$nextTick()

    expect(wrapper.find('h2').text()).toBe('Edit Post')
  })
})
