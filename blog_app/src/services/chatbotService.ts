// ChatBot Service - Tích hợp OpenAI API
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatbotResponse {
  message: string
  error?: string
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// System prompt để định hướng chatbot hỗ trợ người dùng
const SYSTEM_PROMPT = `Bạn là trợ lý ảo thân thiện của mạng xã hội này. Nhiệm vụ của bạn là:
- Hỗ trợ người dùng sử dụng các tính năng của mạng xã hội
- Trả lời câu hỏi về cách đăng bài, kết bạn, nhắn tin, bình luận, thích bài viết
- Giải đáp thắc mắc về quyền riêng tư và cài đặt tài khoản
- Hướng dẫn cách tìm kiếm bạn bè và bài viết
- Luôn trả lời ngắn gọn, thân thiện và hữu ích
- Nếu không biết câu trả lời, hãy thành thật nói rằng bạn không chắc chắn
- Trả lời bằng tiếng Việt nếu người dùng hỏi bằng tiếng Việt, tiếng Anh nếu hỏi bằng tiếng Anh`

class ChatbotService {
  private apiKey: string
  private conversationHistory: ChatMessage[] = []

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
    this.resetConversation()
  }

  resetConversation() {
    this.conversationHistory = [
      { role: 'system', content: SYSTEM_PROMPT }
    ]
  }

  async sendMessage(userMessage: string): Promise<ChatbotResponse> {
    if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
      return {
        message: '',
        error: 'OpenAI API key chưa được cấu hình. Vui lòng thêm VITE_OPENAI_API_KEY vào file .env'
      }
    }

    // Thêm tin nhắn người dùng vào lịch sử
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    })

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: this.conversationHistory,
          max_tokens: 500,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage = data.choices[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này.'

      // Thêm phản hồi của assistant vào lịch sử
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      })

      // Giới hạn lịch sử để tránh token quá nhiều (giữ 20 tin nhắn gần nhất + system prompt)
      if (this.conversationHistory.length > 21) {
        const systemPrompt = this.conversationHistory[0]
        if (systemPrompt) {
          this.conversationHistory = [
            systemPrompt,
            ...this.conversationHistory.slice(-20)
          ]
        }
      }

      return { message: assistantMessage }
    } catch (error) {
      // Xóa tin nhắn user vừa thêm nếu có lỗi
      this.conversationHistory.pop()
      
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định'
      return {
        message: '',
        error: errorMessage
      }
    }
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory.filter(msg => msg.role !== 'system')
  }
}

export const chatbotService = new ChatbotService()
