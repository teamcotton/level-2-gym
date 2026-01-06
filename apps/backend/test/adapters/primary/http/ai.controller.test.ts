import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIController } from '../../../../src/adapters/primary/http/ai.controller.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import type { AppendedChatUseCase } from '../../../../src/application/use-cases/append-chat.use-case.js'
import type { GetChatUseCase } from '../../../../src/application/use-cases/get-chat.use-case.js'
import type { SaveChatUseCase } from '../../../../src/application/use-cases/save-chat.use-case.js'
import { UserId } from '../../../../src/domain/value-objects/userID.js'

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
  validateUIMessages: vi.fn(async ({ messages }) => {
    if (!Array.isArray(messages)) {
      throw new Error('messages must be an array')
    }
    return messages
  }),
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
      user: {
        sub: new UserId(uuidv7()).getValue(),
        email: 'user@example.com',
      },
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

      // Verify handler is a bound function (at index 2, the third argument)
      // Using 'any' cast because Fastify has multiple overloads and TypeScript infers the 2-arg version
      const mockCalls = vi.mocked(mockApp.post).mock.calls[0] as any
      const chatHandler = mockCalls?.[2] as Function

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
      it('should return 400 if request body is missing required fields', async () => {
        mockRequest.body = {
          invalidField: 'test',
        }

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Invalid request body',
          details: 'id and trigger are required',
        })
      })

      it('should return 400 if messages array is missing', async () => {
        mockRequest.body = {
          id: uuidv7(),
          trigger: 'user-input',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue(null)

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalled()
        // When messages is missing, validateUIMessages accepts empty array,
        // then the controller checks for empty messages and returns "No messages provided"
      })

      it('should return 400 if id is missing', async () => {
        mockRequest.body = {
          messages: [{ role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Invalid request body',
          details: 'id and trigger are required',
        })
      })

      it('should return 400 if no messages are provided', async () => {
        mockRequest.body = {
          id: uuidv7(),
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
          id: uuidv7(),
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
          id: uuidv7(),
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
        const chatId = uuidv7()
        const userId = uuidv7()
        mockRequest.body = {
          id: chatId,
          messages: [
            { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
            { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hi!' }] },
            { id: '3', role: 'user', parts: [{ type: 'text', text: 'How are you?' }] },
          ],
          trigger: 'user-input',
        }
        mockRequest.user = {
          sub: new UserId(userId).getValue(),
          email: 'user@example.com',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue({
          id: chatId,
          userId: userId,
          messages: [],
        } as any)

        await controller.chat(mockRequest, mockReply)

        expect(mockGetChatUseCase.execute).toHaveBeenCalledWith(
          expect.any(String), // chatId as branded type
          expect.arrayContaining([
            expect.objectContaining({ id: '1', role: 'user', parts: expect.any(Array) }),
            expect.objectContaining({ id: '2', role: 'assistant', parts: expect.any(Array) }),
            expect.objectContaining({ id: '3', role: 'user', parts: expect.any(Array) }),
          ])
        )
        expect(mockAppendChatUseCase.execute).toHaveBeenCalledWith(
          expect.any(String), // chatId as branded type
          expect.arrayContaining([
            expect.objectContaining({ id: '3', role: 'user', parts: expect.any(Array) }),
          ])
        )
      })

      it('should create new chat if chat does not exist', async () => {
        const chatId = uuidv7()
        const userId = uuidv7()
        mockRequest.body = {
          id: chatId,
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }
        mockRequest.user = {
          sub: new UserId(userId).getValue(),
          email: 'user@example.com',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue(null)

        await controller.chat(mockRequest, mockReply)

        expect(mockGetChatUseCase.execute).toHaveBeenCalledWith(
          expect.any(String), // chatId as branded type
          expect.arrayContaining([
            expect.objectContaining({ id: '1', role: 'user', parts: expect.any(Array) }),
          ])
        )
      })

      it('should log debug message when processing chat', async () => {
        const chatId = uuidv7()
        const userId = uuidv7()
        mockRequest.body = {
          id: chatId,
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }
        mockRequest.user = {
          sub: new UserId(userId).getValue(),
          email: 'user@example.com',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue({
          id: chatId,
          userId: userId,
          messages: [],
        } as any)

        await controller.chat(mockRequest, mockReply)

        expect(mockLogger.debug).toHaveBeenCalledWith('Received chat request')
        expect(mockLogger.debug).toHaveBeenCalledWith('Validated messages', {
          messageCount: 1,
          id: chatId,
          trigger: 'user-input',
        })
      })

      it('should log info when creating new chat', async () => {
        const chatId = uuidv7()
        mockRequest.body = {
          id: chatId,
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }
        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user@example.com',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue(null)

        await controller.chat(mockRequest, mockReply)

        expect(mockLogger.info).toHaveBeenCalledWith('Chat does not exist, creating new chat', {
          id: chatId,
        })
      })

      it('should log info when appending to existing chat', async () => {
        const chatId = uuidv7()
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
        const chatId = uuidv7()

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
            system: expect.stringContaining('literary expert'),
            tools: expect.objectContaining({
              heartOfDarknessQA: expect.any(Object),
            }),
          })
        )
      })

      it('should return stream response', async () => {
        const chatId = uuidv7()
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
      it('should handle validateUIMessages errors', async () => {
        const { validateUIMessages } = await import('ai')
        vi.mocked(validateUIMessages).mockRejectedValueOnce(new Error('Invalid message format'))

        mockRequest.body = {
          id: uuidv7(),
          messages: 'invalid', // Should be array
          trigger: 'user-input',
        }

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Invalid request body',
          details: 'Invalid message format',
        })
      })

      it('should handle use case errors gracefully', async () => {
        const chatId = uuidv7()
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
