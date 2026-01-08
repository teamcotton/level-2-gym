'use client'

import { AIChatView } from '@/view/client-components/AIChatView.js'
import { useAIChat } from '@/view/hooks/useAIChat.js'

/**
 * AI Chat page following DDD architecture.
 * This page is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export default function AIChatPage() {
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
  } = useAIChat()

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
      messages={messages}
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
