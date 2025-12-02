<template>
  <div class="register-page">
    <div class="container">
      <div class="row justify-content-center align-items-center min-vh-100 py-5">
        <div class="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
          <div class="card shadow-lg">
            <div class="card-body p-4 p-md-5">
              <div class="text-center mb-4">
                <h2 class="card-title fw-bold mb-2">{{ t('auth.registerTitle') }}</h2>
                <p class="text-muted">{{ t('auth.registerTitle') }}</p>
              </div>
            
            <form @submit.prevent="handleSubmit">
              <!-- Name Field -->
              <div class="mb-3">
                <label for="name" class="form-label">{{ t('auth.name') }}</label>
                <input
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': errors.name }"
                  id="name"
                  v-model="formData.name"
                  :placeholder="t('auth.name')"
                />
                <div v-if="errors.name" class="invalid-feedback">
                  {{ errors.name }}
                </div>
              </div>

              <!-- Email Field -->
              <div class="mb-3">
                <label for="email" class="form-label">{{ t('auth.email') }}</label>
                <input
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': errors.email }"
                  id="email"
                  v-model="formData.email"
                  :placeholder="t('auth.email')"
                />
                <div v-if="errors.email" class="invalid-feedback">
                  {{ errors.email }}
                </div>
              </div>

              <!-- Password Field -->
              <div class="mb-3">
                <label for="password" class="form-label">{{ t('auth.password') }}</label>
                <input
                  type="password"
                  class="form-control"
                  :class="{ 'is-invalid': errors.password }"
                  id="password"
                  v-model="formData.password"
                  :placeholder="t('auth.password')"
                />
                <div v-if="errors.password" class="invalid-feedback">
                  {{ errors.password }}
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="alert alert-danger" role="alert">
                {{ errorMessage }}
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn btn-primary w-100 py-2"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {{ t('common.loading') }}
                </span>
                <span v-else>{{ t('auth.registerButton') }}</span>
              </button>
            </form>

            <div class="text-center mt-4">
              <p class="mb-0 text-muted">
                {{ t('auth.alreadyHaveAccount') }}
                <a href="/login" class="text-primary fw-semibold">{{ t('auth.loginHere') }}</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'
import { validateRequired, validateEmail } from '../utils/validation'

const router = useRouter()
const { register } = useAuth()
const { t } = useLocale()

const formData = ref({
  name: '',
  email: '',
  password: ''
})

const errors = ref<Record<string, string>>({})
const errorMessage = ref('')
const isSubmitting = ref(false)

const validateForm = (): boolean => {
  errors.value = {}

  // Validate name
  if (!validateRequired(formData.value.name)) {
    errors.value.name = t('validation.required')
  }

  // Validate email
  if (!validateRequired(formData.value.email)) {
    errors.value.email = t('validation.required')
  } else if (!validateEmail(formData.value.email)) {
    errors.value.email = t('validation.emailInvalid')
  }

  // Validate password
  if (!validateRequired(formData.value.password)) {
    errors.value.password = t('validation.required')
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  errorMessage.value = ''

  // Validate form
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    await register(formData.value)
    // Registration successful, redirect to login page
    router.push('/login')
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Registration failed. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.register-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.card {
  border: none;
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.card-title {
  color: #2d3748;
  font-size: 1.75rem;
}

.form-label {
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.form-control {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 1rem;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.75rem;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.alert {
  border-radius: 8px;
  border: none;
}

/* Desktop specific styles */
@media (min-width: 768px) {
  .card {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }
  
  .card-body {
    padding: 3rem !important;
  }
}

/* Mobile specific styles */
@media (max-width: 576px) {
  .register-page {
    background: #fff;
  }
  
  .card {
    box-shadow: none;
  }
  
  .card-body {
    padding: 2rem !important;
  }
}
</style>
