'use client'
import { useChat } from '@ai-sdk/react'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import { Avatar, Box, CircularProgress, Paper, Stack } from '@mui/material'
import { DefaultChatTransport } from 'ai'
import React, { useEffect, useRef, useState } from 'react'

import { ChatInput } from '@/view/components/ChatInputComponent.js'
import { IntroComponent } from '@/view/components/IntroComponent.js'
import { Message } from '@/view/components/MessageComponent.js'
import { MessageIntroComponent } from '@/view/components/MessageIntroComponent.js'
import { Wrapper } from '@/view/components/WrapperComponent.js'

export default function AIChatPage() {
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: process.env.NEXT_PUBLIC_POST_AI_CALLBACK_URL,
    }),
    onError: console.error,
  })

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
    /* console.log('Sending message:', userMessage)*/
    sendMessage({
      text: input,
    })
    /*    console.log('messages', messages)
    console.log('Sent message:', userMessage)
    console.log('Status:', status)*/
    setInput('')
    setIsLoading(false)
  }

  return (
    <Wrapper>
      <IntroComponent />

      <Paper
        elevation={3}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          mb: 2,
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: 'grey.50',
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageIntroComponent />
            </Box>
          ) : (
            <Stack spacing={2}>
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'flex-start',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                      color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    {message.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                  </Avatar>
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      bgcolor: message.role === 'user' ? 'primary.light' : 'white',
                      color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Box sx={{ whiteSpace: 'pre-wrap' }}>
                      <Message key={message.id} role={message.role} parts={message.parts} />
                    </Box>
                  </Paper>
                </Box>
              ))}
              {isLoading && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', color: 'text.primary' }}>
                    <SmartToyIcon />
                  </Avatar>
                  <CircularProgress size={24} />
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>
        <ChatInput
          input={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </Paper>
    </Wrapper>
  )
}
