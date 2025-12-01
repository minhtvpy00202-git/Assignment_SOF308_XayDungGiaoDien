<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import AppNavbar from './components/AppNavbar.vue'

const { checkAuth } = useAuth()

// Check authentication status on app mount
onMounted(() => {
  checkAuth()
})
</script>

<template>
  <div id="app">
    <AppNavbar />
    <router-view />
  </div>
</template>

<style>
#app {
  min-height: 100vh;
}
</style>
