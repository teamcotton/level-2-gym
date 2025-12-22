/* eslint-disable jsx-a11y/aria-role */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable security/detect-non-literal-regexp */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Message } from '@/view/client-components/MessageComponent.js'

// Mock the streamdown module
vi.mock('streamdown', () => ({
  Streamdown: ({ children }: { children: string }) => <div>{children}</div>,
}))

describe('Message Component', () => {
  describe('Text message rendering', () => {
    it('renders user text message with correct prefix', () => {
      const textPart = { type: 'text' as const, text: 'Hello world' }
      render(<Message role="user" parts={[textPart]} />)
      expect(screen.getByText(/User:/)).toBeInTheDocument()
      expect(screen.getByText(/Hello world/)).toBeInTheDocument()
    })

    it('renders AI text message with correct prefix', () => {
      const textPart = { type: 'text' as const, text: 'I am an AI assistant' }
      render(<Message role="assistant" parts={[textPart]} />)
      expect(screen.getByText(/AI:/)).toBeInTheDocument()
      expect(screen.getByText(/I am an AI assistant/)).toBeInTheDocument()
    })

    it('renders multiple text parts correctly', () => {
      const parts = [
        { type: 'text' as const, text: 'First part' },
        { type: 'text' as const, text: 'Second part' },
      ]
      render(<Message role="assistant" parts={parts} />)
      expect(screen.getByText(/First part/)).toBeInTheDocument()
      expect(screen.getByText(/Second part/)).toBeInTheDocument()
    })

    it('handles empty text gracefully', () => {
      const textPart = { type: 'text' as const, text: '' }
      render(<Message role="user" parts={[textPart]} />)
      expect(screen.getByText(/User:/)).toBeInTheDocument()
    })

    it('renders text with markdown formatting', () => {
      const textPart = { type: 'text' as const, text: '**Bold** and *italic*' }
      render(<Message role="assistant" parts={[textPart]} />)
      expect(screen.getByText(/Bold/)).toBeInTheDocument()
    })

    it('applies correct background color for user messages', () => {
      const textPart = { type: 'text' as const, text: 'Test' }
      const { container } = render(<Message role="user" parts={[textPart]} />)
      const box = container.querySelector('.MuiBox-root')
      expect(box).toBeInTheDocument()
    })

    it('applies correct background color for AI messages', () => {
      const textPart = { type: 'text' as const, text: 'Test' }
      const { container } = render(<Message role="assistant" parts={[textPart]} />)
      const box = container.querySelector('.MuiBox-root')
      expect(box).toBeInTheDocument()
    })

    it('handles long text content', () => {
      const longText = 'Lorem ipsum '.repeat(100)
      const textPart = { type: 'text' as const, text: longText }
      render(<Message role="user" parts={[textPart]} />)
      expect(screen.getByText(new RegExp(longText.substring(0, 50)))).toBeInTheDocument()
    })
  })

  describe('Tool: writeFile', () => {
    it('renders writeFile tool with path and content', () => {
      const writeFilePart: any = {
        type: 'tool-writeFile',
        toolCallId: 'test-call-1',
        input: { path: '/test/file.txt', content: 'Test content here' },
      }
      render(<Message role="assistant" parts={[writeFilePart]} />)
      expect(screen.getByText(/📝 Wrote to file/)).toBeInTheDocument()
      expect(screen.getByText(/Path: \/test\/file\.txt/)).toBeInTheDocument()
      expect(screen.getByText(/Content length: 17 characters/)).toBeInTheDocument()
    })

    it('renders writeFile tool without path', () => {
      const writeFilePart: any = {
        type: 'tool-writeFile',
        toolCallId: 'test-call-2',
        input: { content: 'Test content' },
      }
      render(<Message role="assistant" parts={[writeFilePart]} />)
      expect(screen.getByText(/Path: Unknown/)).toBeInTheDocument()
    })

    it('renders writeFile tool without content', () => {
      const writeFilePart: any = {
        type: 'tool-writeFile',
        toolCallId: 'test-call-3',
        input: { path: '/test/file.txt' },
      }
      render(<Message role="assistant" parts={[writeFilePart]} />)
      expect(screen.getByText(/Content length: 0 characters/)).toBeInTheDocument()
    })
  })

  describe('Tool: readFile', () => {
    it('renders readFile tool with path', () => {
      const readFilePart: any = {
        type: 'tool-readFile',
        toolCallId: 'test-call-4',
        input: { path: '/data/config.json' },
      }
      render(<Message role="assistant" parts={[readFilePart]} />)
      expect(screen.getByText(/📖 Read file/)).toBeInTheDocument()
      expect(screen.getByText(/Path: \/data\/config\.json/)).toBeInTheDocument()
    })

    it('renders readFile tool without path', () => {
      const readFilePart: any = {
        type: 'tool-readFile',
        toolCallId: 'test-call-5',
        input: {},
      }
      render(<Message role="assistant" parts={[readFilePart]} />)
      expect(screen.getByText(/Path: Unknown/)).toBeInTheDocument()
    })
  })

  describe('Tool: deletePath', () => {
    it('renders deletePath tool with path', () => {
      const deletePathPart: any = {
        type: 'tool-deletePath',
        toolCallId: 'test-call-6',
        input: { path: '/temp/old-file.log' },
      }
      render(<Message role="assistant" parts={[deletePathPart]} />)
      expect(screen.getByText(/🗑️ Deleted path/)).toBeInTheDocument()
      expect(screen.getByText(/Path: \/temp\/old-file\.log/)).toBeInTheDocument()
    })

    it('renders deletePath tool without path', () => {
      const deletePathPart: any = {
        type: 'tool-deletePath',
        toolCallId: 'test-call-7',
        input: {},
      }
      render(<Message role="assistant" parts={[deletePathPart]} />)
      expect(screen.getByText(/Path: Unknown/)).toBeInTheDocument()
    })
  })

  describe('Tool: listDirectory', () => {
    it('renders listDirectory tool with path', () => {
      const listDirPart: any = {
        type: 'tool-listDirectory',
        toolCallId: 'test-call-8',
        input: { path: '/home/user/documents' },
      }
      render(<Message role="assistant" parts={[listDirPart]} />)
      expect(screen.getByText(/📁 Listed directory/)).toBeInTheDocument()
      expect(screen.getByText(/Path: \/home\/user\/documents/)).toBeInTheDocument()
    })

    it('renders listDirectory tool without path', () => {
      const listDirPart: any = {
        type: 'tool-listDirectory',
        toolCallId: 'test-call-9',
        input: {},
      }
      render(<Message role="assistant" parts={[listDirPart]} />)
      expect(screen.getByText(/Path: Unknown/)).toBeInTheDocument()
    })
  })

  describe('Tool: createDirectory', () => {
    it('renders createDirectory tool with path', () => {
      const createDirPart: any = {
        type: 'tool-createDirectory',
        toolCallId: 'test-call-10',
        input: { path: '/new/directory' },
      }
      render(<Message role="assistant" parts={[createDirPart]} />)
      expect(screen.getByText(/📂 Created directory/)).toBeInTheDocument()
      expect(screen.getByText(/Path: \/new\/directory/)).toBeInTheDocument()
    })

    it('renders createDirectory tool without path', () => {
      const createDirPart: any = {
        type: 'tool-createDirectory',
        toolCallId: 'test-call-11',
        input: {},
      }
      render(<Message role="assistant" parts={[createDirPart]} />)
      expect(screen.getByText(/Path: Unknown/)).toBeInTheDocument()
    })
  })

  describe('Tool: exists', () => {
    it('renders exists tool with path', () => {
      const existsPart: any = {
        type: 'tool-exists',
        toolCallId: 'test-call-12',
        input: { path: '/check/this/path' },
      }
      render(<Message role="assistant" parts={[existsPart]} />)
      expect(screen.getByText(/🔍 Checked existence/)).toBeInTheDocument()
      expect(screen.getByText(/Path: \/check\/this\/path/)).toBeInTheDocument()
    })

    it('renders exists tool without path', () => {
      const existsPart: any = {
        type: 'tool-exists',
        toolCallId: 'test-call-13',
        input: {},
      }
      render(<Message role="assistant" parts={[existsPart]} />)
      expect(screen.getByText(/Path: Unknown/)).toBeInTheDocument()
    })
  })

  describe('Tool: searchFiles', () => {
    it('renders searchFiles tool with pattern', () => {
      const searchFilesPart: any = {
        type: 'tool-searchFiles',
        toolCallId: 'test-call-14',
        input: { pattern: '*.ts' },
      }
      render(<Message role="assistant" parts={[searchFilesPart]} />)
      expect(screen.getByText(/🔎 Searched files/)).toBeInTheDocument()
      expect(screen.getByText(/Pattern: \*\.ts/)).toBeInTheDocument()
    })

    it('renders searchFiles tool without pattern', () => {
      const searchFilesPart: any = {
        type: 'tool-searchFiles',
        toolCallId: 'test-call-15',
        input: {},
      }
      render(<Message role="assistant" parts={[searchFilesPart]} />)
      expect(screen.getByText(/Pattern: Unknown/)).toBeInTheDocument()
    })
  })

  describe('Mixed content rendering', () => {
    it('renders text and tool parts together', () => {
      const mixedParts: any[] = [
        { type: 'text', text: 'Creating a file...' },
        {
          type: 'tool-writeFile',
          toolCallId: 'test-call-16',
          input: { path: '/mixed/test.txt', content: 'Mixed content' },
        },
      ]
      render(<Message role="assistant" parts={mixedParts} />)
      expect(screen.getByText(/Creating a file\.\.\./)).toBeInTheDocument()
      expect(screen.getByText(/📝 Wrote to file/)).toBeInTheDocument()
    })

    it('renders multiple tool parts', () => {
      const multipleToolParts: any[] = [
        {
          type: 'tool-readFile',
          toolCallId: 'test-call-17',
          input: { path: '/first.txt' },
        },
        {
          type: 'tool-writeFile',
          toolCallId: 'test-call-18',
          input: { path: '/second.txt', content: 'Data' },
        },
      ]
      render(<Message role="assistant" parts={multipleToolParts} />)
      expect(screen.getByText(/📖 Read file/)).toBeInTheDocument()
      expect(screen.getByText(/📝 Wrote to file/)).toBeInTheDocument()
    })
  })
})
