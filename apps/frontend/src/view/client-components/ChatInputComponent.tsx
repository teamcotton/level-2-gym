import AttachFileIcon from '@mui/icons-material/AttachFile'
import SendIcon from '@mui/icons-material/Send'
import { Box, Chip, IconButton, Stack, TextField } from '@mui/material'
import React from 'react'

export const ChatInput = ({
  disabled,
  enableFileUpload = false,
  input,
  isLoading,
  onChange,
  onFileSelect,
  onSubmit,
  selectedFile,
}: {
  enableFileUpload?: boolean
  input: string
  isLoading: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileSelect?: (file: File | null) => void
  onSubmit: (e: React.FormEvent) => void
  selectedFile?: File | null
  disabled: boolean
}) => (
  <Box
    component="form"
    onSubmit={onSubmit}
    sx={{
      p: 2,
      borderTop: 1,
      borderColor: 'divider',
      bgcolor: 'background.paper',
    }}
  >
    {enableFileUpload && selectedFile && (
      <Box sx={{ mb: 1 }}>
        <Chip
          label={`${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`}
          size="small"
          onDelete={() => {
            if (onFileSelect) {
              onFileSelect(null)
            }
          }}
        />
      </Box>
    )}
    <Stack direction="row" spacing={1}>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={input}
        onChange={onChange}
        placeholder="Type your message..."
        disabled={isLoading || disabled}
        variant="outlined"
        size="small"
        data-testid="chat-text-input"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSubmit(e)
          }
        }}
      />
      {enableFileUpload && onFileSelect && (
        <IconButton
          component="label"
          color="default"
          disabled={isLoading || disabled}
          sx={{ alignSelf: 'flex-end' }}
        >
          <AttachFileIcon />
          <input
            type="file"
            hidden
            onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </IconButton>
      )}
      <IconButton
        type="submit"
        color="primary"
        disabled={!input.trim() || isLoading || disabled}
        sx={{ alignSelf: 'flex-end' }}
      >
        <SendIcon />
      </IconButton>
    </Stack>
  </Box>
)
