import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import RegisterPage from '../RegisterPage.vue'
import LoginPage from '../LoginPage.vue'

describe('Authentication Pages', () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', component: RegisterPage },
      { path: '/login', component: LoginPage }
    ]
  })

  it('RegisterPage renders with all required fields', () => {
    const wrapper = mount(RegisterPage, {
      global: {
        plugins: [router]
      }
    })

    // Check that all form fields are present
    expect(wrapper.find('input#name').exists()).toBe(true)
    expect(wrapper.find('input#email').exists()).toBe(true)
    expect(wrapper.find('input#password').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('LoginPage renders with all required fields', () => {
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [router]
      }
    })

    // Check that all form fields are present
    expect(wrapper.find('input#email').exists()).toBe(true)
    expect(wrapper.find('input#password').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('RegisterPage shows validation errors for empty fields', async () => {
    const wrapper = mount(RegisterPage, {
      global: {
        plugins: [router]
      }
    })

    // Submit form without filling fields
    await wrapper.find('form').trigger('submit.prevent')

    // Wait for validation to run
    await wrapper.vm.$nextTick()

    // Check that validation errors are displayed
    const invalidFeedbacks = wrapper.findAll('.invalid-feedback')
    expect(invalidFeedbacks.length).toBeGreaterThan(0)
  })

  it('LoginPage shows validation errors for empty fields', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [router]
      }
    })

    // Submit form without filling fields
    await wrapper.find('form').trigger('submit.prevent')

    // Wait for validation to run
    await wrapper.vm.$nextTick()

    // Check that validation errors are displayed
    const invalidFeedbacks = wrapper.findAll('.invalid-feedback')
    expect(invalidFeedbacks.length).toBeGreaterThan(0)
  })

  it('RegisterPage validates email format', async () => {
    const wrapper = mount(RegisterPage, {
      global: {
        plugins: [router]
      }
    })

    // Fill in fields with invalid email
    await wrapper.find('input#name').setValue('John Doe')
    await wrapper.find('input#email').setValue('invalid-email')
    await wrapper.find('input#password').setValue('password123')

    // Submit form
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    // Check that email validation error is displayed
    const emailError = wrapper.find('input#email + .invalid-feedback')
    expect(emailError.exists()).toBe(true)
    expect(emailError.text()).toContain('valid email')
  })

  it('LoginPage validates email format', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [router]
      }
    })

    // Fill in fields with invalid email
    await wrapper.find('input#email').setValue('invalid-email')
    await wrapper.find('input#password').setValue('password123')

    // Submit form
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    // Check that email validation error is displayed
    const emailError = wrapper.find('input#email + .invalid-feedback')
    expect(emailError.exists()).toBe(true)
    expect(emailError.text()).toContain('valid email')
  })
})
