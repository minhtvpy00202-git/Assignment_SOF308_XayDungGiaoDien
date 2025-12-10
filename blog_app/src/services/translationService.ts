interface TranslationResponse {
  translatedText: string
  detectedLanguage?: string
  confidence?: number
}

interface TranslationCache {
  [key: string]: {
    text: string
    timestamp: number
  }
}

class TranslationService {
  private cache: TranslationCache = {}
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly API_DELAY = 100 // Delay between API calls to avoid rate limiting

  constructor() {
    this.loadCache()
  }

  // Load cache from localStorage
  private loadCache() {
    try {
      const cached = localStorage.getItem('translation_cache')
      if (cached) {
        this.cache = JSON.parse(cached)
      }
    } catch (error) {
      console.error('Error loading translation cache:', error)
      this.cache = {}
    }
  }

  // Save cache to localStorage
  private saveCache() {
    try {
      localStorage.setItem('translation_cache', JSON.stringify(this.cache))
    } catch (error) {
      console.error('Error saving translation cache:', error)
    }
  }

  // Generate cache key
  private getCacheKey(text: string, targetLang: string): string {
    return `${targetLang}:${text.substring(0, 100)}`
  }

  // Check if cached translation is still valid
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  // Detect language using simple heuristics
  private detectLanguage(text: string): string {
    if (!text) return 'unknown'
    
    // Vietnamese detection
    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
    const vietnameseWords = /\b(và|của|trong|với|để|từ|về|cho|theo|như|khi|nếu|vì|nhưng|hoặc|hay|đã|sẽ|đang|được|có|là|này|đó|những|các|một|hai|ba|không|rất|nhiều|ít|lớn|nhỏ|tốt|xấu)\b/i
    
    if (vietnameseChars.test(text) || vietnameseWords.test(text)) {
      return 'vi'
    }
    
    // English detection (basic)
    const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|about|into|through|during|before|after|above|below|up|down|out|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|can|will|just|should|now)\b/i
    
    if (englishWords.test(text)) {
      return 'en'
    }
    
    return 'unknown'
  }

  // Free translation using MyMemory API
  private async translateWithMyMemory(text: string, targetLang: string): Promise<TranslationResponse> {
    try {
      const sourceLang = this.detectLanguage(text)
      const langPair = `${sourceLang}|${targetLang}`
      
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
      )
      
      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.responseStatus === 200) {
        return {
          translatedText: data.responseData.translatedText,
          detectedLanguage: sourceLang,
          confidence: data.responseData.match
        }
      } else {
        throw new Error(`Translation failed: ${data.responseDetails}`)
      }
    } catch (error) {
      console.error('MyMemory translation error:', error)
      throw error
    }
  }

  // Fallback translation using LibreTranslate (if available)
  private async translateWithLibreTranslate(text: string, targetLang: string): Promise<TranslationResponse> {
    try {
      const sourceLang = this.detectLanguage(text)
      
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang === 'unknown' ? 'auto' : sourceLang,
          target: targetLang,
          format: 'text'
        })
      })
      
      if (!response.ok) {
        throw new Error(`LibreTranslate API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        translatedText: data.translatedText,
        detectedLanguage: data.detectedLanguage?.language || sourceLang
      }
    } catch (error) {
      console.error('LibreTranslate error:', error)
      throw error
    }
  }

  // Simple rule-based translation for common phrases
  private simpleTranslate(text: string, targetLang: string): string | null {
    const translations: { [key: string]: { [key: string]: string } } = {
      vi: {
        'Hello': 'Xin chào',
        'Thank you': 'Cảm ơn',
        'Good morning': 'Chào buổi sáng',
        'Good evening': 'Chào buổi tối',
        'How are you?': 'Bạn khỏe không?',
        'Yes': 'Có',
        'No': 'Không',
        'Please': 'Xin vui lòng',
        'Sorry': 'Xin lỗi',
        'Excuse me': 'Xin lỗi'
      },
      en: {
        'Xin chào': 'Hello',
        'Cảm ơn': 'Thank you',
        'Chào buổi sáng': 'Good morning',
        'Chào buổi tối': 'Good evening',
        'Bạn khỏe không?': 'How are you?',
        'Có': 'Yes',
        'Không': 'No',
        'Xin vui lòng': 'Please',
        'Xin lỗi': 'Sorry'
      }
    }

    return translations[targetLang]?.[text] || null
  }

  // Main translation method
  async translateText(text: string, targetLang: string): Promise<string> {
    if (!text || !text.trim()) {
      return text
    }

    // Normalize input
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
      // Try simple translation first
      const simpleResult = this.simpleTranslate(normalizedText, targetLang)
      if (simpleResult) {
        this.cache[cacheKey] = {
          text: simpleResult,
          timestamp: Date.now()
        }
        this.saveCache()
        return simpleResult
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, this.API_DELAY))

      // Try MyMemory API first
      try {
        const result = await this.translateWithMyMemory(normalizedText, targetLang)
        
        // Cache the result
        this.cache[cacheKey] = {
          text: result.translatedText,
          timestamp: Date.now()
        }
        this.saveCache()
        
        return result.translatedText
      } catch (error) {
        console.warn('MyMemory translation failed, trying LibreTranslate:', error)
        
        // Fallback to LibreTranslate
        const result = await this.translateWithLibreTranslate(normalizedText, targetLang)
        
        // Cache the result
        this.cache[cacheKey] = {
          text: result.translatedText,
          timestamp: Date.now()
        }
        this.saveCache()
        
        return result.translatedText
      }
    } catch (error) {
      console.error('All translation methods failed:', error)
      
      // Return original text if all translation methods fail
      return normalizedText
    }
  }

  // Translate multiple texts in batch
  async translateBatch(texts: string[], targetLang: string): Promise<string[]> {
    const results: string[] = []
    
    for (const text of texts) {
      try {
        const translated = await this.translateText(text, targetLang)
        results.push(translated)
        
        // Add delay between requests
        if (texts.length > 1) {
          await new Promise(resolve => setTimeout(resolve, this.API_DELAY))
        }
      } catch (error) {
        console.error('Batch translation error for text:', text, error)
        results.push(text) // Return original text on error
      }
    }
    
    return results
  }

  // Clear translation cache
  clearCache() {
    this.cache = {}
    localStorage.removeItem('translation_cache')
  }

  // Get cache statistics
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

// Export singleton instance
export const translationService = new TranslationService()
export default translationService