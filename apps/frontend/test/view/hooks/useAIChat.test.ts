import { useChat } from '@ai-sdk/react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation.js'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { fileToDataURL } from '@/application/services/fileToDataURL.service.js'
import { useAIChat } from '@/view/hooks/useAIChat.js'

// Mock dependencies
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(),
}))

vi.mock('@/application/services/fileToDataURL.service.js', () => ({
  fileToDataURL: vi.fn(),
}))

vi.mock('@/infrastructure/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

describe('useAIChat', () => {
  const mockPush = vi.fn()
  const mockSendMessage = vi.fn()
  const mockRouter = {
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }

  const mockMessages = [
    {
      id: '1',
      role: 'user',
      content: 'Hello',
      createdAt: new Date(),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hi there!',
      createdAt: new Date(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as Mock).mockReturnValue(mockRouter)
    ;(useChat as Mock).mockReturnValue({
      messages: mockMessages,
      sendMessage: mockSendMessage,
      stop: vi.fn().mockResolvedValue(undefined),
    })
    ;(fileToDataURL as Mock).mockResolvedValue('data:image/png;base64,abc123')
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      expect(result.current.input).toBe('')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.selectedFile).toBe(null)
      expect(result.current.errorMessage).toBe('')
      expect(result.current.mobileOpen).toBe(false)
      expect(result.current.messagesEndRef.current).toBe(null)
    })

    it('should return messages from useChat hook', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      expect(result.current.messages).toEqual(mockMessages)
    })

    it('should expose all required handlers', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      expect(typeof result.current.handleSubmit).toBe('function')
      expect(typeof result.current.handleFileSelect).toBe('function')
      expect(typeof result.current.handleDrawerToggle).toBe('function')
      expect(typeof result.current.handleNewChat).toBe('function')
      expect(typeof result.current.handleInputChange).toBe('function')
      expect(typeof result.current.handleErrorClose).toBe('function')
    })

    it('should call useChat with provided id', () => {
      renderHook(() => useAIChat({ id: 'custom-id' }))

      expect(useChat).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'custom-id',
        })
      )
    })

    it('should call useRouter hook', () => {
      renderHook(() => useAIChat({ id: 'test-id' }))

      expect(useRouter).toHaveBeenCalled()
    })

    it('should set disabled to false when id is provided', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      expect(result.current.disabled).toBe(false)
    })

    it('should set disabled to true when no id is provided', () => {
      const { result } = renderHook(() => useAIChat())

      expect(result.current.disabled).toBe(true)
    })

    it('should call useChat with undefined id when no id is provided', () => {
      renderHook(() => useAIChat())

      expect(useChat).toHaveBeenCalledWith(
        expect.objectContaining({
          id: undefined,
        })
      )
    })
  })

  describe('handleInputChange', () => {
    it('should update input state when text changes', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      act(() => {
        result.current.handleInputChange({
          target: { value: 'New message' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.input).toBe('New message')
    })

    it('should handle empty string input', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      act(() => {
        result.current.handleInputChange({
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.input).toBe('')
    })

    it('should handle multiple input changes', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      act(() => {
        result.current.handleInputChange({
          target: { value: 'First' },
        } as React.ChangeEvent<HTMLInputElement>)
      })
      expect(result.current.input).toBe('First')

      act(() => {
        result.current.handleInputChange({
          target: { value: 'Second' },
        } as React.ChangeEvent<HTMLInputElement>)
      })
      expect(result.current.input).toBe('Second')
    })
  })

  describe('handleDrawerToggle', () => {
    it('should toggle mobileOpen from false to true', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      expect(result.current.mobileOpen).toBe(false)

      act(() => {
        result.current.handleDrawerToggle()
      })

      expect(result.current.mobileOpen).toBe(true)
    })

    it('should toggle mobileOpen from true to false', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      act(() => {
        result.current.handleDrawerToggle()
      })
      expect(result.current.mobileOpen).toBe(true)

      act(() => {
        result.current.handleDrawerToggle()
      })
      expect(result.current.mobileOpen).toBe(false)
    })

    it('should toggle multiple times correctly', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.handleDrawerToggle()
        })
        expect(result.current.mobileOpen).toBe(i % 2 === 0)
      }
    })
  })

  describe('handleNewChat', () => {
    it('should navigate to /ai/{uuid} route', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      act(() => {
        result.current.handleNewChat()
      })

      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush.mock.calls[0]?.[0]).toMatch(
        /^\/ai\/[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it('should call router.push exactly once', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      act(() => {
        result.current.handleNewChat()
      })

      expect(mockPush).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleErrorClose', () => {
    it('should clear error message', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      // Set error message first
      act(() => {
        result.current.handleFileSelect(
          new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' })
        )
      })
      expect(result.current.errorMessage).toBeTruthy()

      // Clear error
      act(() => {
        result.current.handleErrorClose()
      })

      expect(result.current.errorMessage).toBe('')
    })
  })

  describe('handleFileSelect', () => {
    it('should set selected file when file is provided', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      act(() => {
        result.current.handleFileSelect(file)
      })

      expect(result.current.selectedFile).toBe(file)
    })

    it('should clear selected file when null is provided', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      act(() => {
        result.current.handleFileSelect(file)
      })
      expect(result.current.selectedFile).toBe(file)

      act(() => {
        result.current.handleFileSelect(null)
      })
      expect(result.current.selectedFile).toBe(null)
    })

    it('should reject file larger than 10MB', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain',
      })

      act(() => {
        result.current.handleFileSelect(largeFile)
      })

      expect(result.current.errorMessage).toBe('File too large. Maximum size is 10MB')
      expect(result.current.selectedFile).toBe(null)
    })

    it('should accept file exactly at 10MB limit', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const maxFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'max.txt', {
        type: 'text/plain',
      })

      act(() => {
        result.current.handleFileSelect(maxFile)
      })

      expect(result.current.selectedFile).toBe(maxFile)
      expect(result.current.errorMessage).toBe('')
    })

    it('should accept file smaller than 10MB', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const smallFile = new File(['small content'], 'small.txt', { type: 'text/plain' })

      act(() => {
        result.current.handleFileSelect(smallFile)
      })

      expect(result.current.selectedFile).toBe(smallFile)
      expect(result.current.errorMessage).toBe('')
    })

    it('should handle different file types', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      const imageFile = new File(['image'], 'image.png', { type: 'image/png' })
      act(() => {
        result.current.handleFileSelect(imageFile)
      })
      expect(result.current.selectedFile).toBe(imageFile)

      const pdfFile = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' })
      act(() => {
        result.current.handleFileSelect(pdfFile)
      })
      expect(result.current.selectedFile).toBe(pdfFile)
    })

    it('should reject file with invalid MIME type', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const execFile = new File(['content'], 'malware.exe', { type: 'application/x-msdownload' })

      act(() => {
        result.current.handleFileSelect(execFile)
      })

      expect(result.current.errorMessage).toBe(
        'Invalid file type. Please upload images, PDFs, Word documents, or text files only.'
      )
      expect(result.current.selectedFile).toBe(null)
    })

    it('should reject JavaScript file', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const jsFile = new File(['alert("xss")'], 'script.js', { type: 'application/javascript' })

      act(() => {
        result.current.handleFileSelect(jsFile)
      })

      expect(result.current.errorMessage).toBe(
        'Invalid file type. Please upload images, PDFs, Word documents, or text files only.'
      )
      expect(result.current.selectedFile).toBe(null)
    })

    it('should accept all allowed image types', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const imageTypes = [
        { type: 'image/jpeg', name: 'photo.jpg' },
        { type: 'image/png', name: 'image.png' },
        { type: 'image/gif', name: 'anim.gif' },
        { type: 'image/webp', name: 'modern.webp' },
        { type: 'image/svg+xml', name: 'vector.svg' },
      ]

      imageTypes.forEach((img) => {
        const file = new File(['image'], img.name, { type: img.type })
        act(() => {
          result.current.handleFileSelect(file)
        })
        expect(result.current.selectedFile).toBe(file)
        expect(result.current.errorMessage).toBe('')
      })
    })

    it('should accept all allowed document types', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const docTypes = [
        { type: 'application/pdf', name: 'doc.pdf' },
        { type: 'application/msword', name: 'old.doc' },
        {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          name: 'modern.docx',
        },
        { type: 'text/plain', name: 'readme.txt' },
        { type: 'text/markdown', name: 'docs.md' },
      ]

      docTypes.forEach((doc) => {
        const file = new File(['content'], doc.name, { type: doc.type })
        act(() => {
          result.current.handleFileSelect(file)
        })
        expect(result.current.selectedFile).toBe(file)
        expect(result.current.errorMessage).toBe('')
      })
    })

    it('should reject HTML file', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const htmlFile = new File(['<html></html>'], 'page.html', { type: 'text/html' })

      act(() => {
        result.current.handleFileSelect(htmlFile)
      })

      expect(result.current.errorMessage).toBe(
        'Invalid file type. Please upload images, PDFs, Word documents, or text files only.'
      )
      expect(result.current.selectedFile).toBe(null)
    })

    it('should reject shell script', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const shFile = new File(['#!/bin/bash'], 'script.sh', { type: 'application/x-sh' })

      act(() => {
        result.current.handleFileSelect(shFile)
      })

      expect(result.current.errorMessage).toBe(
        'Invalid file type. Please upload images, PDFs, Word documents, or text files only.'
      )
      expect(result.current.selectedFile).toBe(null)
    })

    it('should reject ZIP archive', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const zipFile = new File(['content'], 'archive.zip', { type: 'application/zip' })

      act(() => {
        result.current.handleFileSelect(zipFile)
      })

      expect(result.current.errorMessage).toBe(
        'Invalid file type. Please upload images, PDFs, Word documents, or text files only.'
      )
      expect(result.current.selectedFile).toBe(null)
    })
  })

  describe('handleSubmit', () => {
    it('should prevent default form submission', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      act(() => {
        result.current.handleInputChange({
          target: { value: 'Test message' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    it('should not submit when input is empty', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('should not submit when input is only whitespace', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      act(() => {
        result.current.handleInputChange({
          target: { value: '   ' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('should attempt to prevent concurrent submissions via isLoading check', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      act(() => {
        result.current.handleInputChange({
          target: { value: 'Test message' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // First submission
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      // After first submission completes, isLoading should be false and input cleared
      expect(result.current.isLoading).toBe(false)
      expect(result.current.input).toBe('')

      // Add new input for second submission
      act(() => {
        result.current.handleInputChange({
          target: { value: 'Second message' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Now start second submission - this should work because isLoading is false
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      // Both submissions should have been called
      expect(mockSendMessage).toHaveBeenCalledTimes(2)
    })

    it('should submit with text-only message', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      act(() => {
        result.current.handleInputChange({
          target: { value: 'Hello AI' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(mockSendMessage).toHaveBeenCalledWith({
        parts: [
          {
            type: 'text',
            text: 'Hello AI',
          },
        ],
      })
    })

    it('should submit with text and file', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      act(() => {
        result.current.handleInputChange({
          target: { value: 'Check this file' },
        } as React.ChangeEvent<HTMLInputElement>)
        result.current.handleFileSelect(file)
      })

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(fileToDataURL).toHaveBeenCalledWith(file)
      expect(mockSendMessage).toHaveBeenCalledWith({
        parts: [
          {
            type: 'text',
            text: 'Check this file',
          },
          {
            type: 'file',
            mediaType: 'text/plain',
            url: 'data:image/png;base64,abc123',
          },
        ],
      })
    })

    it('should clear input after successful submission', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      act(() => {
        result.current.handleInputChange({
          target: { value: 'Test message' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      await waitFor(() => {
        expect(result.current.input).toBe('')
      })
    })

    it('should clear selected file after successful submission', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      act(() => {
        result.current.handleInputChange({
          target: { value: 'Test' },
        } as React.ChangeEvent<HTMLInputElement>)
        result.current.handleFileSelect(file)
      })

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      await waitFor(() => {
        expect(result.current.selectedFile).toBe(null)
      })
    })

    it('should set isLoading to true during submission and false after', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      act(() => {
        result.current.handleInputChange({
          target: { value: 'Test message' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Before submission
      expect(result.current.isLoading).toBe(false)

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      // After submission completes
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should set isLoading back to false after submission', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      act(() => {
        result.current.handleInputChange({
          target: { value: 'Test message' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should set isLoading back to false even if submission fails', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      mockSendMessage.mockRejectedValueOnce(new Error('Network error'))

      act(() => {
        result.current.handleInputChange({
          target: { value: 'Test message' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        try {
          await result.current.handleSubmit(mockEvent)
        } catch {
          // Expected error, ignore
        }
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle file conversion error gracefully', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      ;(fileToDataURL as Mock).mockRejectedValueOnce(new Error('Conversion failed'))

      act(() => {
        result.current.handleInputChange({
          target: { value: 'Test' },
        } as React.ChangeEvent<HTMLInputElement>)
        result.current.handleFileSelect(file)
      })

      await act(async () => {
        try {
          await result.current.handleSubmit(mockEvent)
        } catch {
          // Expected error, ignore
        }
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Integration - Multiple Operations', () => {
    it('should handle input change, file select, and submit in sequence', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      // Change input
      act(() => {
        result.current.handleInputChange({
          target: { value: 'Message with file' },
        } as React.ChangeEvent<HTMLInputElement>)
      })
      expect(result.current.input).toBe('Message with file')

      // Select file
      act(() => {
        result.current.handleFileSelect(file)
      })
      expect(result.current.selectedFile).toBe(file)

      // Submit
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      await waitFor(() => {
        expect(result.current.input).toBe('')
        expect(result.current.selectedFile).toBe(null)
      })
      expect(mockSendMessage).toHaveBeenCalled()
    })

    it('should allow new message after previous submission', async () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      // First message
      act(() => {
        result.current.handleInputChange({
          target: { value: 'First message' },
        } as React.ChangeEvent<HTMLInputElement>)
      })
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      await waitFor(() => {
        expect(result.current.input).toBe('')
      })

      // Second message
      act(() => {
        result.current.handleInputChange({
          target: { value: 'Second message' },
        } as React.ChangeEvent<HTMLInputElement>)
      })
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(mockSendMessage).toHaveBeenCalledTimes(2)
    })

    it('should handle drawer toggle and new chat navigation', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      act(() => {
        result.current.handleDrawerToggle()
      })
      expect(result.current.mobileOpen).toBe(true)

      act(() => {
        result.current.handleNewChat()
      })
      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush.mock.calls[0]?.[0]).toMatch(
        /^\/ai\/[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it('should handle file error and error close', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain',
      })

      act(() => {
        result.current.handleFileSelect(largeFile)
      })
      expect(result.current.errorMessage).toBe('File too large. Maximum size is 10MB')

      act(() => {
        result.current.handleErrorClose()
      })
      expect(result.current.errorMessage).toBe('')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid input changes', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))

      const inputs = ['a', 'ab', 'abc', 'abcd', 'abcde']
      inputs.forEach((value) => {
        act(() => {
          result.current.handleInputChange({
            target: { value },
          } as React.ChangeEvent<HTMLInputElement>)
        })
      })

      expect(result.current.input).toBe('abcde')
    })

    it('should handle special characters in input', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const specialText = '!@#$%^&*()_+{}:"<>?[];\',./`~'

      act(() => {
        result.current.handleInputChange({
          target: { value: specialText },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.input).toBe(specialText)
    })

    it('should handle very long input text', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const longText = 'a'.repeat(10000)

      act(() => {
        result.current.handleInputChange({
          target: { value: longText },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.input).toBe(longText)
    })

    it('should handle file selection changes', () => {
      const { result } = renderHook(() => useAIChat({ id: 'test-id' }))
      const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' })
      const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' })

      act(() => {
        result.current.handleFileSelect(file1)
      })
      expect(result.current.selectedFile).toBe(file1)

      act(() => {
        result.current.handleFileSelect(file2)
      })
      expect(result.current.selectedFile).toBe(file2)
    })

    it('should handle empty id parameter', () => {
      const { result } = renderHook(() => useAIChat({ id: '' }))

      expect(result.current.input).toBe('')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.messages).toEqual(mockMessages)
    })
  })
})
