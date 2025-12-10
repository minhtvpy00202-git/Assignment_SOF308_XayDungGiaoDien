// Simple event system for instant message notifications
class MessageEventBus {
  private listeners: { [key: string]: Function[] } = {}

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
  }

  emit(event: string, data?: any) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(callback => callback(data))
  }
}

export const messageEventBus = new MessageEventBus()

// Event types
export const MESSAGE_EVENTS = {
  NEW_MESSAGE_SENT: 'newMessageSent',
  NEW_MESSAGE_RECEIVED: 'newMessageReceived'
} as const