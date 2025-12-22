/**
 * Sentiment Analysis Service - TypeScript version
 * Phân tích cảm xúc bài viết sử dụng OpenAI API
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
}

export interface SentimentError {
  error: string
}

export interface SentimentDisplay {
  icon: string
  label: string
  color: string
  bgColor: string
}

/**
 * Phân tích cảm xúc của văn bản
 */
export async function analyzeSentiment(text: string): Promise<SentimentResult | SentimentError> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return { error: 'Chưa cấu hình OpenAI API key' }
  }

  if (!text || text.trim().length === 0) {
    return { error: 'Nội dung văn bản không được để trống' }
  }

  const truncatedText = text.length > 3000 ? text.substring(0, 3000) + '...' : text
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'Analyze sentiment and return only JSON: {"sentiment": "positive", "confidence": 0.85}. Sentiment must be positive/neutral/negative.' 
          },
          { 
            role: 'user', 
            content: `Analyze sentiment: "${truncatedText}"` 
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content?.trim()

    if (!aiResponse) {
      throw new Error('Không nhận được phản hồi từ OpenAI API')
    }

    const result = JSON.parse(aiResponse) as SentimentResult
    
    // Validate
    const validSentiments = ['positive', 'neutral', 'negative']
    if (!validSentiments.includes(result.sentiment) || 
        typeof result.confidence !== 'number' ||
        result.confidence < 0 || result.confidence > 1) {
      throw new Error('Định dạng phản hồi không hợp lệ')
    }
    
    return result

  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Lỗi không xác định' 
    }
  }
}

/**
 * Lấy thông tin hiển thị cho sentiment
 */
export function getSentimentDisplay(sentiment?: string): SentimentDisplay | null {
  const displays: Record<string, SentimentDisplay> = {
    positive: { icon: '😊', label: 'Tích cực', color: '#22c55e', bgColor: '#dcfce7' },
    negative: { icon: '😡', label: 'Tiêu cực', color: '#ef4444', bgColor: '#fee2e2' },
    neutral: { icon: '😐', label: 'Trung tính', color: '#6b7280', bgColor: '#f3f4f6' }
  }
  return sentiment ? displays[sentiment] || null : null
}

/**
 * Cập nhật sentiment cho bài viết trong database
 */
export async function updatePostSentiment(
  postId: string, 
  sentiment: string, 
  confidence: number
): Promise<any> {
  const response = await fetch(`http://localhost:3000/posts/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sentiment, 
      sentiment_score: confidence 
    })
  })
  
  if (!response.ok) {
    throw new Error(`Lỗi cập nhật: ${response.status}`)
  }
  
  return response.json()
}