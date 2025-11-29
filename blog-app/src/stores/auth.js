// src/stores/auth.js
import { ref, computed } from 'vue';

const user = ref(JSON.parse(localStorage.getItem('authUser') || 'null'));

function setUser(u) {
  user.value = u;
  if (u) localStorage.setItem('authUser', JSON.stringify(u));
  else localStorage.removeItem('authUser');
}

function logout() {
  setUser(null);
}

const isAuth = computed(() => !!user.value);

// Đồng bộ khi mở nhiều tab (hoặc khi localStorage thay đổi vì lý do khác)
window.addEventListener('storage', () => {
  user.value = JSON.parse(localStorage.getItem('authUser') || 'null');
});

export function useAuth() {
  return { user, isAuth, setUser, logout };
}
