import { ref } from 'vue'

const isChristmasEnabled = ref(true)

export function useChristmasTheme() {
  const load = () => {
    const saved = localStorage.getItem('christmas_enabled')
    if (saved === null) return
    isChristmasEnabled.value = saved === 'true'
  }

  const enable = () => {
    isChristmasEnabled.value = true
    localStorage.setItem('christmas_enabled', 'true')
  }

  const disable = () => {
    isChristmasEnabled.value = false
    localStorage.setItem('christmas_enabled', 'false')
  }

  const toggle = () => {
    isChristmasEnabled.value ? disable() : enable()
  }

  return {
    isChristmasEnabled,
    load,
    enable,
    disable,
    toggle
  }
}
