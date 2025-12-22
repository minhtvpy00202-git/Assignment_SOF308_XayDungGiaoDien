import { ref, computed } from 'vue'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

// Detect current season based on date
const detectSeason = (): Season => {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12

  // Spring: March 1 - May 31
  if (month >= 3 && month <= 5) {
    return 'spring'
  }
  // Summer: June 1 - August 31
  if (month >= 6 && month <= 8) {
    return 'summer'
  }
  // Autumn: September 1 - November 30
  if (month >= 9 && month <= 11) {
    return 'autumn'
  }
  // Winter: December 1 - February 28/29
  return 'winter'
}

// Initialize from localStorage or defaults
const getInitialEnabled = (): boolean => {
  if (typeof window === 'undefined') return true
  const saved = localStorage.getItem('seasonalEffectsEnabled')
  return saved === null ? true : saved === 'true'
}

const getInitialSeason = (): Season => {
  if (typeof window === 'undefined') return detectSeason()
  const savedOverride = localStorage.getItem('manualSeasonOverride')
  if (savedOverride === 'true') {
    const savedSeason = localStorage.getItem('selectedSeason') as Season
    if (savedSeason) return savedSeason
  }
  return detectSeason()
}

const getInitialManualOverride = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('manualSeasonOverride') === 'true'
}

// Shared state
const isEnabled = ref(getInitialEnabled())
const currentSeason = ref<Season>(getInitialSeason())
const manualOverride = ref(getInitialManualOverride())

export function useSeasonalEffects() {
  const toggleEffects = () => {
    isEnabled.value = !isEnabled.value
    localStorage.setItem('seasonalEffectsEnabled', String(isEnabled.value))
  }

  const setSeason = (season: Season) => {
    currentSeason.value = season
    manualOverride.value = true
    localStorage.setItem('selectedSeason', season)
    localStorage.setItem('manualSeasonOverride', 'true')
  }

  const resetToAutoSeason = () => {
    manualOverride.value = false
    currentSeason.value = detectSeason()
    localStorage.removeItem('selectedSeason')
    localStorage.removeItem('manualSeasonOverride')
  }

  const seasonName = computed(() => {
    const names = {
      spring: 'Mùa Xuân',
      summer: 'Mùa Hè',
      autumn: 'Mùa Thu',
      winter: 'Mùa Đông'
    }
    return names[currentSeason.value]
  })

  const seasonEmoji = computed(() => {
    const emojis = {
      spring: '🌸',
      summer: '☀️',
      autumn: '🍂',
      winter: '❄️'
    }
    return emojis[currentSeason.value]
  })

  return {
    isEnabled,
    currentSeason,
    manualOverride,
    seasonName,
    seasonEmoji,
    toggleEffects,
    setSeason,
    resetToAutoSeason,
    detectSeason
  }
}
