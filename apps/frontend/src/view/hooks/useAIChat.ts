import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRouter } from 'next/navigation.js'
import { useEffect, useRef, useState } from 'react'
import { uuidv7 } from 'uuidv7'

import { fileToDataURL } from '@/application/services/fileToDataURL.service.js'
import { createLogger } from '@/infrastructure/logging/logger.js'

const logger = createLogger({ prefix: 'useAIChat' })

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Allowed MIME types for file uploads (matching ChatInput accept attribute)
const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'text/markdown',
]

interface UseAIChatProps {
  id?: string
}

export function useAIChat({ id }: UseAIChatProps = {}) {
  const router = useRouter()

  const disabled = !id

  const handleNewChat = () => {
    const newId = uuidv7()
    router.push(`/ai/${newId}`)
  }

  const { messages, sendMessage, stop } = useChat({
    id: id,
    transport: new DefaultChatTransport({
      api: process.env.NEXT_PUBLIC_POST_AI_CALLBACK_URL,
    }),
    onError: (error) => {
      logger.error('Chat transport error', error)
    },
  })

  useEffect(() => {
    if (!disabled) return

    void stop().catch(console.error)
  }, [disabled, stop])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)

    try {
      const parts: Array<
        { type: 'text'; text: string } | { type: 'file'; mediaType: string; url: string }
      > = [
        {
          type: 'text',
          text: input,
        },
      ]

      if (selectedFile) {
        parts.push({
          type: 'file',
          mediaType: selectedFile.type,
          url: await fileToDataURL(selectedFile),
        })
      }

      await sendMessage({ parts })

      setInput('')
      setSelectedFile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (file: File | null) => {
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage('File too large. Maximum size is 10MB')
        setSelectedFile(null)
        return
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setErrorMessage(
          'Invalid file type. Please upload images, PDFs, Word documents, or text files only.'
        )
        setSelectedFile(null)
        return
      }
    }
    setSelectedFile(file)
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleErrorClose = () => {
    setErrorMessage('')
  }

  return {
    // State
    messages,
    input,
    isLoading,
    selectedFile,
    errorMessage,
    mobileOpen,
    messagesEndRef,
    disabled,

    // Handlers
    handleSubmit,
    handleFileSelect,
    handleDrawerToggle,
    handleNewChat,
    handleInputChange,
    handleErrorClose,
  }
}
