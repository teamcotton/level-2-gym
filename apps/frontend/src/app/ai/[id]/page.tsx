'use client'

import type { UIDataTypes, UIMessagePart, UITools } from 'ai'
import { use } from 'react'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { AIChatView } from '@/view/client-components/AIChatView.js'
import { useAIChat } from '@/view/hooks/useAIChat.js'
import { useFetchChat } from '@/view/hooks/useFetchChat.js'

const logger = createLogger({ prefix: 'AIChatPage' })

interface MessageType {
  id: string
  parts: UIMessagePart<UIDataTypes, UITools>[]
  role: string
}

/**
 * AI Chat page following DDD architecture.
 * This page is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export default function AIChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  logger.info('Rendering AIChatPage with ID:', id)

  // Fetch the chat data from the backend
  const { data: chatData, isError: isFetchError, isLoading: isFetchingChat } = useFetchChat(id)

  logger.info('isLoading', isFetchingChat)
  logger.info('isFetchError', isFetchError)
  logger.info('Chat data:', chatData?.messages)

  const {
    chats,
    currentChatId,
    disabled,
    errorMessage,
    handleDrawerToggle,
    handleErrorClose,
    handleFileSelect,
    handleInputChange,
    handleNewChat,
    handleSubmit,
    input,
    isChatsError,
    isLoading,
    isLoadingChats,
    messages,
    messagesEndRef,
    mobileOpen,
    selectedFile,
  } = useAIChat({ id })

  logger.info('Rendering AIChatPage with messages:', messages)

  return (
    <AIChatView
      chats={chats}
      currentChatId={currentChatId}
      disabled={disabled}
      errorMessage={errorMessage}
      input={input}
      isChatsError={isChatsError}
      isLoading={isLoading}
      isLoadingChats={isLoadingChats}
      messages={(chatData?.messages as MessageType[]) ?? []}
      messagesEndRef={messagesEndRef}
      mobileOpen={mobileOpen}
      onDrawerToggle={handleDrawerToggle}
      onErrorClose={handleErrorClose}
      onFileSelect={handleFileSelect}
      onInputChange={handleInputChange}
      onNewChat={handleNewChat}
      onSubmit={handleSubmit}
      selectedFile={selectedFile}
    />
  )
}
