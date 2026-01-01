'use client'
import { useChat } from '@ai-sdk/react'
import AddIcon from '@mui/icons-material/Add'
import MenuIcon from '@mui/icons-material/Menu'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
} from '@mui/material'
import { DefaultChatTransport } from 'ai'
import { useRouter } from 'next/navigation.js'
import React, { use, useEffect, useRef, useState } from 'react'
import { uuidv7 } from 'uuidv7'

import { createLogger } from '@/adapters/secondary/services/logger.service.js'
import { fileToDataURL } from '@/application/services/fileToDataURL.service.js'
import { ChatInput } from '@/view/client-components/ChatInputComponent.js'
import { IntroComponent } from '@/view/client-components/IntroComponent.js'
import { Message } from '@/view/client-components/MessageComponent.js'
import { MessageIntroComponent } from '@/view/client-components/MessageIntroComponent.js'
import { Wrapper } from '@/view/client-components/WrapperComponent.js'

const logger = createLogger({ prefix: 'AIChatPage' })

const DRAWER_WIDTH = 280

export default function AIChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  logger.debug('id', id)

  logger.debug(
    'process.env.NEXT_PUBLIC_POST_AI_CALLBACK_URL',
    process.env.NEXT_PUBLIC_POST_AI_CALLBACK_URL
  )

  const { messages, sendMessage } = useChat({
    id: id ?? uuidv7(),
    transport: new DefaultChatTransport({
      api: process.env.NEXT_PUBLIC_POST_AI_CALLBACK_URL,
    }),
    onError: (error) => {
      logger.error('Chat transport error', error)
    },
  })

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true) // Set to true when starting

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
      setIsLoading(false) // Always set to false when done
    }
  }

  const handleFileSelect = (file: File | null) => {
    if (file) {
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
      if (file.size > MAX_FILE_SIZE) {
        // Show error to user
        setErrorMessage('File too large. Maximum size is 10MB')
        return
      }
    }
    setSelectedFile(file)
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={() => router.push('/ai')}
          sx={{
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            },
          }}
        >
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>
          <ListItemText primary="New Chat" />
        </ListItemButton>
      </Box>

      <Divider />

      <Box sx={{ overflow: 'auto', flex: 1 }}>
        <List>
          <ListItem>
            <ListItemText
              secondary="Previous chats will appear here"
              sx={{ textAlign: 'center', color: 'text.secondary' }}
            />
          </ListItem>
          {/* TODO: Replace with API-fetched chat sessions */}
          {/* Example structure:
          <ListItemButton
            selected={session.id === id}
            onClick={() => router.push(`/ai/${session.id}`)}
          >
            <ListItemIcon>
              <ChatIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={<Typography variant="body2" noWrap>Chat Title</Typography>}
              secondary={<Typography variant="caption" noWrap>Last message preview...</Typography>}
            />
          </ListItemButton>
          */}
        </List>
      </Box>
    </Box>
  )

  return (
    <Wrapper>
      <IntroComponent />

      <Box sx={{ display: 'flex', flex: 1, mb: 2, gap: 2 }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Main content */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Mobile menu button */}
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
              p: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <IconButton onClick={handleDrawerToggle}>
              <MenuIcon />
            </IconButton>
          </Box>

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
                data-testid="chat-text-output-empty"
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
            enableFileUpload={true}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        </Paper>
      </Box>
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMessage('')} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Wrapper>
  )
}
