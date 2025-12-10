/**
 * **Feature: search-functionality, Property 11: Result Display Format Consistency**
 * **Validates: Requirements 1.2, 2.2**
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import * as fc from 'fast-check'
import UserResult from './UserResult.vue'
import PostResult from './PostResult.vue'

// Mock composables
vi.mock('../composables/useLocale', () => ({
  useLocale: () => ({
    t: (key: string) => key
  })
}))

vi.mock('../composables/useFriends', () => ({
  useFriends: () => ({
    getMutualFriendsCount: () => 0
  })
}))

describe('Property 11: Result Display Format Consistency', () => {
  it('user results display required elements', () => {
    const userResult = {
      id: 'user-1',
      type: 'user' as const,
      title: 'Test User',
      subtitle: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg',
      url: '/profile/user-1'
    }

    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 20 }),
      (query) => {
        const wrapper = mount(UserResult, {
          props: {
            result: userResult,
            isSelected: false,
            query,
            currentUserId: 'current-user'
          }
        })

        // Check required elements exist
        expect(wrapper.find('.search-result-avatar').exists()).toBe(true)
        expect(wrapper.find('.search-result-title').exists()).toBe(true)
        expect(wrapper.find('.search-result-subtitle').exists()).toBe(true)
      }
    ), { numRuns: 10 })
  })

  it('post results display required elements', () => {
    const postResult = {
      id: 'post-1',
      type: 'post' as const,
      title: 'Test Post',
      subtitle: 'Author • Date',
      url: '/post/post-1'
    }

    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 20 }),
      (query) => {
        const wrapper = mount(PostResult, {
          props: {
            result: postResult,
            isSelected: false,
            query
          }
        })

        // Check required elements exist
        expect(wrapper.find('.search-result-icon').exists()).toBe(true)
        expect(wrapper.find('.search-result-title').exists()).toBe(true)
        expect(wrapper.find('.search-result-subtitle').exists()).toBe(true)
      }
    ), { numRuns: 10 })
  })
})