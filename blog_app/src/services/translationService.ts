interface TranslationResponse {
  translatedText: string
  detectedLanguage?: string
}

interface TranslationCache {
  [key: string]: {
    text: string
    timestamp: number
  }
}

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string
      detectedSourceLanguage?: string
    }>
  }
}

class TranslationService {
  private cache: TranslationCache = {}
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly CACHE_VERSION = 3
  private readonly API_KEY: string

  constructor() {
    // Get API key from environment variable
    this.API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || ''
    
    if (!this.API_KEY) {
      console.warn('Google Translate API key not found. Translation will not work.')
    }
    
    this.loadCache()
  }

  private loadCache() {
    try {
      const cacheVersion = localStorage.getItem('translation_cache_version')
      if (cacheVersion !== String(this.CACHE_VERSION)) {
        localStorage.removeItem('translation_cache')
        localStorage.setItem('translation_cache_version', String(this.CACHE_VERSION))
        this.cache = {}
        return
      }

      const cached = localStorage.getItem('translation_cache')
      if (cached) {
        this.cache = JSON.parse(cached)
      }
    } catch (error) {
      console.error('Error loading translation cache:', error)
      this.cache = {}
    }
  }

  private saveCache() {
    try {
      localStorage.setItem('translation_cache', JSON.stringify(this.cache))
    } catch (error) {
      console.error('Error saving translation cache:', error)
    }
  }

  private getCacheKey(text: string, targetLang: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `${targetLang}:${hash}:${text.length}`
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  private detectLanguage(text: string): string {
    if (!text) return 'unknown'

    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
    const vietnameseWords = /\b(và|của|trong|với|để|từ|về|cho|theo|như|khi|nếu|vì|nhưng|hoặc|hay|đã|sẽ|đang|được|có|là|này|đó|những|các|một|hai|ba|không|rất|nhiều)\b/i

    if (vietnameseChars.test(text) || vietnameseWords.test(text)) {
      return 'vi'
    }

    const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|about|into|through|during|before|after|above|below|up|down|out|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|can|will|just|should|now)\b/i

    if (englishWords.test(text)) {
      return 'en'
    }

    return 'auto'
  }

  // Google Cloud Translation API v2
  private async translateWithGoogleCloud(
    text: string,
    targetLang: string
  ): Promise<TranslationResponse> {
    if (!this.API_KEY) {
      throw new Error('Google Translate API key not configured')
    }

    const sourceLang = this.detectLanguage(text)
    
    const url = `https://translation.googleapis.com/language/translate/v2?key=${this.API_KEY}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang === 'auto' ? undefined : sourceLang,
        target: targetLang,
        format: 'text'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Google Translate API error: ${error.error?.message || response.status}`)
    }

    const data: GoogleTranslateResponse = await response.json()

    if (!data.data?.translations?.[0]) {
      throw new Error('No translation returned')
    }

    return {
      translatedText: data.data.translations[0].translatedText,
      detectedLanguage: data.data.translations[0].detectedSourceLanguage || sourceLang
    }
  }

  async translateText(text: string, targetLang: string): Promise<string> {
    if (!text || !text.trim()) {
      return text
    }

    const normalizedText = text.trim()
    const detectedLang = this.detectLanguage(normalizedText)

    // If already in target language, return as is
    if (detectedLang === targetLang) {
      return normalizedText
    }

    // Check cache first
    const cacheKey = this.getCacheKey(normalizedText, targetLang)
    const cached = this.cache[cacheKey]

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.text
    }

    try {
      const result = await this.translateWithGoogleCloud(normalizedText, targetLang)

      // Cache the result
      this.cache[cacheKey] = {
        text: result.translatedText,
        timestamp: Date.now()
      }
      this.saveCache()

      return result.translatedText
    } catch (error) {
      console.error('Translation failed:', error)
      return normalizedText
    }
  }

  async translateBatch(texts: string[], targetLang: string): Promise<string[]> {
    const results: string[] = []

    for (const text of texts) {
      try {
        const translated = await this.translateText(text, targetLang)
        results.push(translated)
      } catch (error) {
        console.error('Batch translation error:', error)
        results.push(text)
      }
    }

    return results
  }

  clearCache() {
    this.cache = {}
    localStorage.removeItem('translation_cache')
  }

  getCacheStats() {
    const entries = Object.keys(this.cache).length
    const validEntries = Object.values(this.cache).filter(
      entry => this.isCacheValid(entry.timestamp)
    ).length

    return {
      totalEntries: entries,
      validEntries,
      expiredEntries: entries - validEntries
    }
  }
}

export const translationService = new TranslationService()
export default translationService
