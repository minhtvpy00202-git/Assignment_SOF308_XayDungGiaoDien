import { createI18n } from 'vue-i18n'
import en from './en'
import vi from './vi'

// Get saved locale from localStorage or default to Vietnamese
const savedLocale = localStorage.getItem('locale') || 'vi'

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    vi
  }
})

export default i18n
