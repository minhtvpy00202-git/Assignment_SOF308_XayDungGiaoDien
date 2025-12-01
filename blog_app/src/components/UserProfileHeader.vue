<template>
  <div class="card mb-4">
    <div class="card-body">
      <div class="row align-items-center">
        <div class="col-auto">
          <img 
            :src="user.avatar" 
            :alt="user.name" 
            class="rounded-circle profile-avatar"
            width="120" 
            height="120"
          >
        </div>
        <div class="col">
          <h2 class="mb-2">{{ user.name }}</h2>
          <p class="text-muted mb-2" v-if="user.intro">{{ user.intro }}</p>
          <p class="text-muted mb-0">
            <strong>{{ postCount }}</strong> {{ postCount === 1 ? 'post' : 'posts' }}
          </p>
        </div>
        <div class="col-auto" v-if="$slots.actions">
          <slot name="actions"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '../types'

interface Props {
  user: User
  postCount: number
}

defineProps<Props>()
</script>

<style scoped>
.profile-avatar {
  object-fit: cover;
  border: 3px solid #f8f9fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

h2 {
  color: #2d3748;
  font-weight: 600;
}

.text-muted {
  color: #718096 !important;
}
</style>
