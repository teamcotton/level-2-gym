'use client'

import AddIcon from '@mui/icons-material/Add'
import ChatIcon from '@mui/icons-material/Chat'
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
  Stack,
  Typography,
} from '@mui/material'
import type { UIDataTypes, UIMessagePart, UITools } from 'ai'
import { useRouter } from 'next/navigation.js'
import React from 'react'

import { ChatInput } from '@/view/client-components/ChatInputComponent.js'
import { IntroComponent } from '@/view/client-components/IntroComponent.js'
import { Message } from '@/view/client-components/MessageComponent.js'
import { MessageIntroComponent } from '@/view/client-components/MessageIntroComponent.js'
import { Wrapper } from '@/view/client-components/WrapperComponent.js'

const DRAWER_WIDTH = 280

interface MessageType {
  id: string
  parts: UIMessagePart<UIDataTypes, UITools>[]
  role: string
}

interface AIChatViewProps {
  readonly errorMessage: string
  readonly input: string
  readonly isLoading: boolean
  readonly messages: MessageType[]
  readonly messagesEndRef: React.RefObject<HTMLDivElement | null>
  readonly disabled: boolean
  readonly mobileOpen: boolean
  readonly currentChatId?: string
  readonly chats: string[] | undefined
  readonly isChatsError: boolean
  readonly isLoadingChats: boolean
  readonly onDrawerToggle: () => void
  readonly onErrorClose: () => void
  readonly onFileSelect: (file: File | null) => void
  readonly onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  readonly onNewChat: () => void
  readonly onSubmit: (e: React.FormEvent) => void
  readonly selectedFile: File | null
}

export function AIChatView({
  chats,
  currentChatId,
  disabled,
  errorMessage,
  input,
  isChatsError,
  isLoading,
  isLoadingChats,
  messages,
  messagesEndRef,
  mobileOpen,
  onDrawerToggle,
  onErrorClose,
  onFileSelect,
  onInputChange,
  onNewChat,
  onSubmit,
  selectedFile,
}: AIChatViewProps) {
  const router = useRouter()
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <ListItemButton
          onClick={onNewChat}
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

      <Divider sx={{ flexShrink: 0 }} />

      <Box
        sx={{
          overflow: 'auto',
          flex: 1,
          minHeight: 0, // Important for flex overflow
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.8)',
            },
          },
        }}
      >
        <List sx={{ py: 0 }}>
          {isLoadingChats ? (
            <ListItem>
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 2 }}>
                <CircularProgress size={24} aria-label="Loading chat history" />
              </Box>
            </ListItem>
          ) : isChatsError ? (
            <ListItem>
              <Box sx={{ width: '100%', p: 2 }}>
                <Alert severity="error">
                  Unable to retrieve your chat history. Please try again.
                </Alert>
              </Box>
            </ListItem>
          ) : chats && chats.length > 0 ? (
            chats.map((chatId) => (
              <ListItemButton
                key={chatId}
                selected={currentChatId === chatId}
                onClick={() => router.push(`/ai/${chatId}`)}
              >
                <ListItemIcon>
                  <ChatIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" noWrap>
                      {/* TODO: will add full metadata at a later date */}
                      Chat {chatId.slice(0, 8)}...
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" noWrap color="text.secondary">
                      {currentChatId === chatId ? 'Active' : 'Previous chat'}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))
          ) : (
            <ListItem>
              <ListItemText
                secondary="No previous chats yet"
                sx={{ textAlign: 'center', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </Box>
    </Box>
  )

  return (
    <Wrapper>
      <IntroComponent />

      <Box sx={{ display: 'flex', flex: 1, mb: 2, gap: 2, minHeight: 0, overflow: 'hidden' }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onDrawerToggle}
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
            <IconButton onClick={onDrawerToggle} aria-label="Open navigation menu">
              <MenuIcon />
            </IconButton>
          </Box>

          {errorMessage && (
            <Alert severity="error" onClose={onErrorClose} sx={{ m: 2 }} data-testid="error-alert">
              {errorMessage}
            </Alert>
          )}

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
                {messages.map((message) => (
                  <Box
                    key={message.id}
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
                    <CircularProgress size={24} aria-label="Loading chat history" />
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Stack>
            )}
          </Box>
          <ChatInput
            disabled={disabled}
            input={input}
            onChange={onInputChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
            enableFileUpload={true}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
          />
        </Paper>
      </Box>
    </Wrapper>
  )
}
