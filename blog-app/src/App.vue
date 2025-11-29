<template>
  <div class="app-wrapper">
    <NavBar />
    <router-view />
    <ChatBox />
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import ChatBox from '@/components/ChatBox.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  background-attachment: fixed;
}

.app-wrapper {
  min-height: 100vh;
  background: rgba(255, 255, 255, 0.05);
}

/* Smooth transitions */
* {
  transition: all 0.3s ease;
}

/* Card improvements */
.card {
  border: none;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: white;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

/* Button improvements */
.btn {
  border-radius: 25px;
  padding: 8px 24px;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-dark {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.btn-dark:hover {
  background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
  transform: translateY(-2px);
}

.btn-outline-primary {
  border: 2px solid #667eea;
  color: #667eea;
  background: transparent;
}

.btn-outline-primary:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* Form improvements */
.form-control, .form-select {
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

.form-control:focus, .form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

/* Container improvements */
.container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  margin-top: 20px;
  margin-bottom: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card, .container {
  animation: fadeIn 0.5s ease;
}
</style>
