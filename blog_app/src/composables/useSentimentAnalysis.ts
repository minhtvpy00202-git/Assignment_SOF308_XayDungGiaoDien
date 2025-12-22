import { ref } from 'vue'
import { analyzeSentiment, updatePostSentiment } from '../services/sentimentAnalysis'
import type { Post } from '../types'

export function useSentimentAnalysis() {
  const isAnalyzing = ref(false)
  const error = ref<string | null>(null)

  /**
   * Phân tích cảm xúc cho một bài viết và cập nhật reactive state
   */
  const analyzePostSentiment = async (post: Post): Promise<boolean> => {
    if (isAnalyzing.value) return false

    isAnalyzing.value = true
    error.value = null

    try {
      // Kết hợp title và content để phân tích
      const textToAnalyze = `${post.title}\n\n${post.content}`
      
      const result = await analyzeSentiment(textToAnalyze)
      
      if ('error' in result) {
        error.value = result.error
        return false
      }

      // Cập nhật bài viết trong database
      await updatePostSentiment(post.id, result.sentiment, result.confidence)

      // Cập nhật post object trực tiếp (reactive update)
      post.sentiment = result.sentiment
      post.sentiment_score = result.confidence

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi phân tích cảm xúc'
      return false
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * Phân tích cảm xúc cho nhiều bài viết
   */
  const analyzeBatchSentiment = async (posts: Post[]): Promise<number> => {
    let successCount = 0
    
    for (const post of posts) {
      // Bỏ qua bài viết đã có sentiment
      if (post.sentiment) continue
      
      const success = await analyzePostSentiment(post)
      if (success) successCount++
      
      // Delay nhỏ để tránh rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    return successCount
  }

  return {
    isAnalyzing,
    error,
    analyzePostSentiment,
    analyzeBatchSentiment
  }
}