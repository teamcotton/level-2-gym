'use client'

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
import type { UIDataTypes, UIMessagePart, UITools } from 'ai'
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
  readonly onDrawerToggle: () => void
  readonly onErrorClose: () => void
  readonly onFileSelect: (file: File | null) => void
  readonly onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  readonly onNewChat: () => void
  readonly onSubmit: (e: React.FormEvent) => void
  readonly selectedFile: File | null
}

export function AIChatView({
  disabled,
  errorMessage,
  input,
  isLoading,
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
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
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
                    <CircularProgress size={24} />
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
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={onErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={onErrorClose} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Wrapper>
  )
}
