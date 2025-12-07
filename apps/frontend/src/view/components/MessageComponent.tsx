import { Box } from '@mui/material'
import type { UIDataTypes, UIMessagePart, UITools } from 'ai'
import { Streamdown } from 'streamdown'

export const Message = ({
  parts,
  role,
}: {
  role: string
  parts: UIMessagePart<UIDataTypes, UITools>[]
}) => {
  const prefix = role === 'user' ? 'User: ' : 'AI: '

  const text = parts
    .map((part) => {
      if (part.type === 'text') {
        return part.text
      }
      return ''
    })
    .join('')
  return (
    <Box
      sx={{
        color: 'rgba(0, 0, 0, 0.87) !important',
        '& p': { color: 'rgba(0, 0, 0, 0.87) !important' },
        '& div': { color: 'rgba(0, 0, 0, 0.87) !important' },
        '& *': { color: 'rgba(0, 0, 0, 0.87) !important' },
      }}
    >
      <Streamdown>{prefix + text}</Streamdown>
    </Box>
  )
}
