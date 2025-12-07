import SendIcon from '@mui/icons-material/Send'
import { Box, IconButton, Stack, TextField } from '@mui/material'
import React from 'react'

export const ChatInput = ({
  input,
  isLoading,
  onChange,
  onSubmit,
}: {
  input: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
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
    <Stack direction="row" spacing={1}>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={input}
        onChange={onChange}
        placeholder="Type your message..."
        disabled={isLoading}
        variant="outlined"
        size="small"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSubmit(e)
          }
        }}
      />
      <IconButton
        type="submit"
        color="primary"
        disabled={!input.trim() || isLoading}
        sx={{ alignSelf: 'flex-end' }}
      >
        <SendIcon />
      </IconButton>
    </Stack>
  </Box>
)
