import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIController } from '../../../../src/adapters/primary/http/ai.controller.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import type { AppendedChatUseCase } from '../../../../src/application/use-cases/append-chat.use-case.js'
import type { GetChatUseCase } from '../../../../src/application/use-cases/get-chat.use-case.js'
import type { SaveChatUseCase } from '../../../../src/application/use-cases/save-chat.use-case.js'

// Mock the AI SDK modules
vi.mock('ai', () => ({
  convertToModelMessages: vi.fn((msgs) => msgs),
  stepCountIs: vi.fn((count) => count),
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: vi.fn(() => ({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })),
  })),
  tool: vi.fn((config) => config),
}))

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn((model) => model),
}))

vi.mock('../../../../src/infrastructure/ai/tools/getText.js', () => {
  class MockGetText {
    filePath = 'data/heart-of-darkness.txt'
    getText = vi.fn().mockResolvedValue('Heart of Darkness text content...')
    hasCachedContent = vi.fn().mockReturnValue(false)
    getCachedContent = vi.fn().mockReturnValue(null)
  }

  return {
    GetText: MockGetText,
  }
})

describe('AIController', () => {
  let controller: AIController
  let mockGetChatUseCase: GetChatUseCase
  let mockAppendChatUseCase: AppendedChatUseCase
  let mockSaveChatUseCase: SaveChatUseCase
  let mockLogger: LoggerPort
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create mock use cases
    mockGetChatUseCase = {
      execute: vi.fn(),
    } as any

    mockAppendChatUseCase = {
      execute: vi.fn(),
    } as any

    mockSaveChatUseCase = {
      execute: vi.fn(),
    } as any

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    // Create controller instance with mocked dependencies
    controller = new AIController(
      mockGetChatUseCase,
      mockLogger,
      mockAppendChatUseCase,
      mockSaveChatUseCase
    )

    // Create mock Fastify reply with chainable methods
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis(),
    } as any

    // Create mock Fastify request
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { sub: 'user-123' },
    } as any
  })

  describe('constructor', () => {
    it('should create instance with required dependencies', () => {
      const instance = new AIController(
        mockGetChatUseCase,
        mockLogger,
        mockAppendChatUseCase,
        mockSaveChatUseCase
      )

      expect(instance).toBeInstanceOf(AIController)
      expect(instance).toBeDefined()
    })

    it('should accept GetChatUseCase, LoggerPort, and AppendedChatUseCase as dependencies', () => {
      const instance = new AIController(
        mockGetChatUseCase,
        mockLogger,
        mockAppendChatUseCase,
        mockSaveChatUseCase
      )

      expect(instance).toBeDefined()
      expect(instance).toBeInstanceOf(AIController)
    })
  })

  describe('registerRoutes()', () => {
    it('should register POST /ai/chat route', () => {
      const mockApp = {
        post: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.post).toHaveBeenCalledTimes(1)
      expect(mockApp.post).toHaveBeenCalledWith(
        '/ai/chat',
        expect.objectContaining({ preHandler: expect.any(Array) }),
        expect.any(Function)
      )
    })

    it('should bind controller context to route handler', () => {
      const mockApp = {
        post: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      // Verify handler is a bound function (in the options object at index 1)
      const routeOptions = vi.mocked(mockApp.post).mock.calls[0]?.[1]
      const chatHandler = routeOptions?.handler

      expect(chatHandler).toBeTypeOf('function')
    })

    it('should register route with correct HTTP method', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.post).toHaveBeenCalledTimes(1)
      expect(mockApp.get).not.toHaveBeenCalled()
      expect(mockApp.put).not.toHaveBeenCalled()
      expect(mockApp.delete).not.toHaveBeenCalled()
    })
  })

  describe('chat()', () => {
    describe('validation', () => {
      it('should return 400 if request body is invalid', async () => {
        mockRequest.body = {
          invalidField: 'test',
        }

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Invalid request body',
          details: expect.any(Array),
        })
      })

      it('should return 400 if messages array is missing', async () => {
        mockRequest.body = {
          id: 'chat-123',
        }

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Invalid request body',
          details: expect.any(Array),
        })
      })

      it('should return 400 if id is missing', async () => {
        mockRequest.body = {
          messages: [{ role: 'user', content: 'Hello' }],
        }

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Invalid request body',
          details: expect.any(Array),
        })
      })

      it('should return 400 if no messages are provided', async () => {
        mockRequest.body = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          messages: [],
          trigger: 'user-input',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue(null)

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalled()
      })

      it('should return 400 if last message is not from user', async () => {
        mockRequest.body = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          messages: [
            { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
            { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] },
          ],
          trigger: 'user-input',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue(null)

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalled()
      })

      it('should return 401 if user is not authenticated for new chat', async () => {
        mockRequest.body = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }
        mockRequest.user = undefined

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue(null)

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalled()
      })
    })

    describe('successful chat processing', () => {
      it('should process valid chat request with existing chat', async () => {
        const chatId = '550e8400-e29b-41d4-a716-446655440000'
        mockRequest.body = {
          id: chatId,
          messages: [
            { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
            { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hi!' }] },
            { id: '3', role: 'user', parts: [{ type: 'text', text: 'How are you?' }] },
          ],
          trigger: 'user-input',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue({
          id: chatId,
          userId: 'user-123',
          messages: [],
        } as any)

        await controller.chat(mockRequest, mockReply)

        expect(mockGetChatUseCase.execute).toHaveBeenCalledWith('user-123', [
          expect.objectContaining({ id: '1', role: 'user' }),
          expect.objectContaining({ id: '2', role: 'assistant' }),
          expect.objectContaining({ id: '3', role: 'user' }),
        ])
        expect(mockAppendChatUseCase.execute).toHaveBeenCalledWith(chatId, [
          expect.objectContaining({ id: '3', role: 'user' }),
        ])
      })

      it('should create new chat if chat does not exist', async () => {
        const chatId = '550e8400-e29b-41d4-a716-446655440000'
        mockRequest.body = {
          id: chatId,
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }
        mockRequest.user = { sub: 'user-123', email: 'user@example.com' }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue(null)

        await controller.chat(mockRequest, mockReply)

        expect(mockGetChatUseCase.execute).toHaveBeenCalledWith('user-123', [
          expect.objectContaining({ id: '1', role: 'user' }),
        ])
      })

      it('should log debug message when sending to chat', async () => {
        const chatId = '550e8400-e29b-41d4-a716-446655440000'
        mockRequest.body = {
          id: chatId,
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue({
          id: chatId,
          userId: 'user-123',
          messages: [],
        } as any)

        await controller.chat(mockRequest, mockReply)

        expect(mockLogger.debug).toHaveBeenCalledWith('Received chat request')
        expect(mockLogger.debug).toHaveBeenCalledWith('Parsed AI chat request body', {
          parsed: expect.objectContaining({
            id: chatId,
            messages: expect.any(Array),
          }),
        })
      })

      it('should log info when creating new chat', async () => {
        const chatId = '550e8400-e29b-41d4-a716-446655440001'
        mockRequest.body = {
          id: chatId,
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }
        mockRequest.user = { sub: 'user-123', email: 'user@example.com' }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue(null)

        await controller.chat(mockRequest, mockReply)

        expect(mockLogger.info).toHaveBeenCalledWith('Chat does not exist, creating new chat', {
          id: chatId,
        })
      })

      it('should log info when appending to existing chat', async () => {
        const chatId = '550e8400-e29b-41d4-a716-446655440002'
        mockRequest.body = {
          id: chatId,
          messages: [
            { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
            { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hi!' }] },
            { id: '3', role: 'user', parts: [{ type: 'text', text: 'How are you?' }] },
          ],
          trigger: 'user-input',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue({
          id: chatId,
          userId: 'user-123',
          messages: [],
        } as any)

        await controller.chat(mockRequest, mockReply)

        expect(mockLogger.info).toHaveBeenCalledWith('Chat exists, appending most recent message', {
          id: chatId,
        })
      })
    })

    describe('AI streaming', () => {
      it('should call streamText with correct parameters', async () => {
        const { streamText } = await import('ai')
        const chatId = '550e8400-e29b-41d4-a716-446655440003'

        mockRequest.body = {
          id: chatId,
          messages: [
            {
              id: '1',
              role: 'user',
              parts: [{ type: 'text', text: 'Tell me about Heart of Darkness' }],
            },
          ],
          trigger: 'user-input',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue({
          id: chatId,
          userId: 'user-123',
          messages: [],
        } as any)

        await controller.chat(mockRequest, mockReply)

        expect(streamText).toHaveBeenCalledWith(
          expect.objectContaining({
            model: expect.any(String),
            messages: expect.any(Array),
            system: expect.stringContaining('Charles Marlow'),
            tools: expect.objectContaining({
              heartOfDarknessQA: expect.any(Object),
            }),
          })
        )
      })

      it('should return stream response', async () => {
        const chatId = '550e8400-e29b-41d4-a716-446655440004'
        mockRequest.body = {
          id: chatId,
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue({
          id: chatId,
          userId: 'user-123',
          messages: [],
        } as any)

        const result = await controller.chat(mockRequest, mockReply)

        expect(result).toBeDefined()
        expect(result).toHaveProperty('status')
      })
    })

    describe('error handling', () => {
      it('should handle Zod validation errors', async () => {
        mockRequest.body = {
          id: 123, // Should be string
          messages: 'invalid', // Should be array
        }

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Invalid request body',
          details: expect.any(Array),
        })
      })

      it('should handle use case errors gracefully', async () => {
        const chatId = '550e8400-e29b-41d4-a716-446655440005'
        mockRequest.body = {
          id: chatId,
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }

        vi.mocked(mockGetChatUseCase.execute).mockRejectedValue(new Error('Database error'))

        await expect(controller.chat(mockRequest, mockReply)).rejects.toThrow('Database error')
      })
    })
  })
})
