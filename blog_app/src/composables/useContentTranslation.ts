import { ref, computed, watch } from 'vue'
import { useLocale } from './useLocale'
import { translationService } from '../services/translationService'
import type { Post, Comment } from '../types'

interface TranslatedPost extends Post {
  originalTitle?: string
  originalContent?: string
  translatedTitle?: string
  translatedContent?: string
  isTranslated?: boolean
}

interface TranslatedComment extends Comment {
  originalContent?: string
  translatedContent?: string
  isTranslated?: boolean
}

export function useContentTranslation() {
  const { locale } = useLocale()
  const isTranslating = ref(false)
  const translationEnabled = ref(true)

  // Get translation enabled state from localStorage
  const loadTranslationPreference = () => {
    try {
      const saved = localStorage.getItem('translation_enabled')
      if (saved !== null) {
        translationEnabled.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading translation preference:', error)
    }
  }

  // Save translation preference to localStorage
  const saveTranslationPreference = () => {
    try {
      localStorage.setItem('translation_enabled', JSON.stringify(translationEnabled.value))
    } catch (error) {
      console.error('Error saving translation preference:', error)
    }
  }

  // Toggle translation on/off
  const toggleTranslation = () => {
    translationEnabled.value = !translationEnabled.value
    saveTranslationPreference()
  }

  // Translate a single post
  const translatePost = async (post: Post): Promise<TranslatedPost> => {
    if (!translationEnabled.value) {
      return post as TranslatedPost
    }

    const translatedPost: TranslatedPost = {
      ...post,
      originalTitle: post.title,
      originalContent: post.content,
      isTranslated: false
    }

    try {
      isTranslating.value = true

      // Translate title and content
      const [translatedTitle, translatedContent] = await translationService.translateBatch(
        [post.title, post.content],
        locale.value
      )

      // Only mark as translated if the content actually changed
      const titleChanged = translatedTitle !== post.title
      const contentChanged = translatedContent !== post.content

      if (titleChanged || contentChanged) {
        translatedPost.translatedTitle = translatedTitle
        translatedPost.translatedContent = translatedContent
        translatedPost.title = translatedTitle
        translatedPost.content = translatedContent
        translatedPost.isTranslated = true
      }

      return translatedPost
    } catch (error) {
      console.error('Error translating post:', error)
      return translatedPost
    } finally {
      isTranslating.value = false
    }
  }

  // Translate multiple posts
  const translatePosts = async (posts: Post[]): Promise<TranslatedPost[]> => {
    if (!translationEnabled.value || posts.length === 0) {
      return posts as TranslatedPost[]
    }

    try {
      isTranslating.value = true
      const translatedPosts: TranslatedPost[] = []

      // Process posts in batches to avoid overwhelming the API
      const batchSize = 3
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize)
        const batchPromises = batch.map(post => translatePost(post))
        const batchResults = await Promise.all(batchPromises)
        translatedPosts.push(...batchResults)

        // Add delay between batches
        if (i + batchSize < posts.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      return translatedPosts
    } catch (error) {
      console.error('Error translating posts:', error)
      return posts as TranslatedPost[]
    } finally {
      isTranslating.value = false
    }
  }

  // Translate a single comment
  const translateComment = async (comment: Comment): Promise<TranslatedComment> => {
    if (!translationEnabled.value) {
      return comment as TranslatedComment
    }

    const translatedComment: TranslatedComment = {
      ...comment,
      originalContent: comment.content,
      isTranslated: false
    }

    try {
      const translatedContent = await translationService.translateText(
        comment.content,
        locale.value
      )

      if (translatedContent !== comment.content) {
        translatedComment.translatedContent = translatedContent
        translatedComment.content = translatedContent
        translatedComment.isTranslated = true
      }

      return translatedComment
    } catch (error) {
      console.error('Error translating comment:', error)
      return translatedComment
    }
  }

  // Translate multiple comments
  const translateComments = async (comments: Comment[]): Promise<TranslatedComment[]> => {
    if (!translationEnabled.value || comments.length === 0) {
      return comments as TranslatedComment[]
    }

    try {
      const translatedComments: TranslatedComment[] = []

      // Process comments in smaller batches
      const batchSize = 5
      for (let i = 0; i < comments.length; i += batchSize) {
        const batch = comments.slice(i, i + batchSize)
        const batchPromises = batch.map(comment => translateComment(comment))
        const batchResults = await Promise.all(batchPromises)
        translatedComments.push(...batchResults)

        // Add delay between batches
        if (i + batchSize < comments.length) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      return translatedComments
    } catch (error) {
      console.error('Error translating comments:', error)
      return comments as TranslatedComment[]
    }
  }

  // Show original content
  const showOriginalPost = (post: TranslatedPost): TranslatedPost => {
    if (!post.isTranslated) return post

    return {
      ...post,
      title: post.originalTitle || post.title,
      content: post.originalContent || post.content,
      isTranslated: false
    }
  }

  // Show translated content
  const showTranslatedPost = (post: TranslatedPost): TranslatedPost => {
    if (!post.translatedTitle && !post.translatedContent) return post

    return {
      ...post,
      title: post.translatedTitle || post.title,
      content: post.translatedContent || post.content,
      isTranslated: true
    }
  }

  // Clear translation cache
  const clearTranslationCache = () => {
    translationService.clearCache()
  }

  // Get translation statistics
  const getTranslationStats = () => {
    return translationService.getCacheStats()
  }

  // Watch for locale changes and auto-translate if enabled
  watch(locale, () => {
    if (translationEnabled.value) {
      // Trigger re-translation when locale changes
      // This will be handled by components that use this composable
    }
  })

  // Load preferences on initialization
  loadTranslationPreference()

  return {
    // State
    isTranslating: computed(() => isTranslating.value),
    translationEnabled: computed(() => translationEnabled.value),
    
    // Methods
    toggleTranslation,
    translatePost,
    translatePosts,
    translateComment,
    translateComments,
    showOriginalPost,
    showTranslatedPost,
    clearTranslationCache,
    getTranslationStats
  }
}