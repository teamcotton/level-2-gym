import { Box } from '@mui/material'
import type { UIDataTypes, UIMessagePart, UITools } from 'ai'
import { Streamdown } from 'streamdown'

interface ToolInput {
  path?: string
  pattern?: string
  content?: string
}

interface ToolConfig {
  emoji: string
  label: string
  backgroundColor: string
  borderColor: string
  titleColor: string
  textColor: string
  displayField: 'path' | 'pattern'
  extraFields?: (input: ToolInput) => string[]
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  'tool-writeFile': {
    emoji: '📝',
    label: 'Wrote to file',
    backgroundColor: 'rgba(30, 58, 138, 0.2)',
    borderColor: '#1d4ed8',
    titleColor: '#93c5fd',
    textColor: '#bfdbfe',
    displayField: 'path',
    extraFields: (input: ToolInput) => [
      `Content length: ${input?.content?.length || 0} characters`,
    ],
  },
  'tool-readFile': {
    emoji: '📖',
    label: 'Read file',
    backgroundColor: 'rgba(20, 83, 45, 0.2)',
    borderColor: '#15803d',
    titleColor: '#86efac',
    textColor: '#bbf7d0',
    displayField: 'path',
  },
  'tool-deletePath': {
    emoji: '🗑️',
    label: 'Deleted path',
    backgroundColor: 'rgba(127, 29, 29, 0.2)',
    borderColor: '#b91c1c',
    titleColor: '#fca5a5',
    textColor: '#fecaca',
    displayField: 'path',
  },
  'tool-listDirectory': {
    emoji: '📁',
    label: 'Listed directory',
    backgroundColor: 'rgba(113, 63, 18, 0.2)',
    borderColor: '#a16207',
    titleColor: '#fde047',
    textColor: '#fef08a',
    displayField: 'path',
  },
  'tool-createDirectory': {
    emoji: '📂',
    label: 'Created directory',
    backgroundColor: 'rgba(88, 28, 135, 0.2)',
    borderColor: '#7e22ce',
    titleColor: '#d8b4fe',
    textColor: '#e9d5ff',
    displayField: 'path',
  },
  'tool-exists': {
    emoji: '🔍',
    label: 'Checked existence',
    backgroundColor: 'rgba(22, 78, 99, 0.2)',
    borderColor: '#0e7490',
    titleColor: '#67e8f9',
    textColor: '#a5f3fc',
    displayField: 'path',
  },
  'tool-searchFiles': {
    emoji: '🔎',
    label: 'Searched files',
    backgroundColor: 'rgba(124, 45, 18, 0.2)',
    borderColor: '#c2410c',
    titleColor: '#fdba74',
    textColor: '#fed7aa',
    displayField: 'pattern',
  },
}

const renderToolPart = (part: UIMessagePart<UIDataTypes, UITools>, index: number) => {
  const config = TOOL_CONFIGS[part.type]
  if (!config) return null

  const input = part.input as ToolInput
  const displayValue =
    config.displayField === 'path' ? input.path || 'Unknown' : input.pattern || 'Unknown'

  return (
    <Box
      key={index}
      sx={{
        backgroundColor: config.backgroundColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: 1,
        padding: 1.5,
        fontSize: '0.875rem',
      }}
    >
      <Box sx={{ fontWeight: 600, color: config.titleColor, marginBottom: 0.5 }}>
        {config.emoji} {config.label}
      </Box>
      <Box sx={{ color: config.textColor }}>
        {config.displayField === 'path' ? 'Path' : 'Pattern'}: {displayValue}
      </Box>
      {config.extraFields &&
        config.extraFields(input).map((field, i) => (
          <Box key={i} sx={{ color: config.textColor }}>
            {field}
          </Box>
        ))}
    </Box>
  )
}

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
      {parts.map((part, index) => renderToolPart(part, index))}
    </Box>
  )
}
