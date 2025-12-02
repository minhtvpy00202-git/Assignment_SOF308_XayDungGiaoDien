import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useLocale() {
  const { locale, t } = useI18n()

  const currentLocale = computed(() => locale.value)

  const availableLocales = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
  ]

  const setLocale = (newLocale: string) => {
    locale.value = newLocale
    localStorage.setItem('locale', newLocale)
  }

  const toggleLocale = () => {
    const newLocale = locale.value === 'en' ? 'vi' : 'en'
    setLocale(newLocale)
  }

  return {
    locale: currentLocale,
    availableLocales,
    setLocale,
    toggleLocale,
    t
  }
}
