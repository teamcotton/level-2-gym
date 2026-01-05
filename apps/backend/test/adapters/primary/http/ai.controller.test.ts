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

// Mock cache service
let mockCacheService: { get: any; set: any } | null = null
vi.mock('../../../../src/infrastructure/ai/middleware/cache.middleware.js', () => ({
  createCacheService: vi.fn(() => mockCacheService),
}))

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

    // Reset cache service to null by default
    mockCacheService = null

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
      type: vi.fn().mockReturnThis(),
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
          id: uuidv7(),
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

      it('should log debug message when sending to chat', async () => {
        const chatId = uuidv7()
        const userId = uuidv7()
        mockRequest.body = {
          id: chatId,
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue({
          id: chatId,
          userId: userId,
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

    describe('cache behavior', () => {
      beforeEach(() => {
        // Reset cache mock before each test in this section
        mockCacheService = {
          get: vi.fn(),
          set: vi.fn(),
        }
      })

      it('should persist assistant message when returning cached response', async () => {
        const chatId = uuidv7()
        const cachedResponse = 'This is a cached response about Heart of Darkness.'
        
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

        // Mock cache service to return a cached response
        mockCacheService!.get = vi.fn().mockResolvedValue(cachedResponse)

        await controller.chat(mockRequest, mockReply)

        // Verify appendChatUseCase was called twice:
        // 1. Once for the user message (line 109)
        // 2. Once for the assistant message from cache (line 143)
        expect(mockAppendChatUseCase.execute).toHaveBeenCalledTimes(2)

        // Verify the second call persisted the assistant message
        const secondCall = vi.mocked(mockAppendChatUseCase.execute).mock.calls[1]
        expect(secondCall).toBeDefined()
        expect(secondCall![0]).toBe(chatId) // chatId
        expect(secondCall![1]).toEqual([
          expect.objectContaining({
            role: 'assistant',
            parts: [
              expect.objectContaining({
                type: 'text',
                text: cachedResponse,
                state: 'done',
              }),
            ],
          }),
        ])
      })

      it('should return cached response as plain text', async () => {
        const chatId = uuidv7()
        const cachedResponse = 'Cached AI response text'
        
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

        mockCacheService!.get = vi.fn().mockResolvedValue(cachedResponse)

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith(cachedResponse)
      })

      it('should log cache hit when returning cached response', async () => {
        const chatId = uuidv7()
        const cachedResponse = 'Cached response'
        
        mockRequest.body = {
          id: chatId,
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Test' }] }],
          trigger: 'user-input',
        }

        vi.mocked(mockGetChatUseCase.execute).mockResolvedValue({
          id: chatId,
          userId: 'user-123',
          messages: [],
        } as any)

        mockCacheService!.get = vi.fn().mockResolvedValue(cachedResponse)

        await controller.chat(mockRequest, mockReply)

        expect(mockLogger.info).toHaveBeenCalledWith('Returning cached AI response', { chatId })
        expect(mockLogger.debug).toHaveBeenCalledWith('Persisted cached assistant message', {
          chatId,
        })
      })

      it('should proceed with streaming when cache miss', async () => {
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

        // Mock cache miss
        mockCacheService!.get = vi.fn().mockResolvedValue(null)

        await controller.chat(mockRequest, mockReply)

        // Should proceed with streaming (not return early)
        const { streamText } = await import('ai')
        expect(streamText).toHaveBeenCalled()
      })

      it('should handle null cache service gracefully', async () => {
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

        // Set cache service to null (Redis not configured)
        mockCacheService = null

        await controller.chat(mockRequest, mockReply)

        // Should proceed with streaming
        const { streamText } = await import('ai')
        expect(streamText).toHaveBeenCalled()
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
