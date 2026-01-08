import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIController } from '../../../../src/adapters/primary/http/ai.controller.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import type { AppendedChatUseCase } from '../../../../src/application/use-cases/append-chat.use-case.js'
import type { GetChatUseCase } from '../../../../src/application/use-cases/get-chat.use-case.js'
import type { GetChatContentByChatIdUseCase } from '../../../../src/application/use-cases/get-chat-content-by-chat-id.use-case.js'
import type { GetChatsByUserIdUseCase } from '../../../../src/application/use-cases/get-chats-by-userid.use-case.js'
import type { SaveChatUseCase } from '../../../../src/application/use-cases/save-chat.use-case.js'
import { ChatId } from '../../../../src/domain/value-objects/chatID.js'
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
  let mockGetChatsByUserIdUseCase: GetChatsByUserIdUseCase
  let mockGetChatContentByChatIdUseCase: GetChatContentByChatIdUseCase
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

    mockGetChatsByUserIdUseCase = {
      execute: vi.fn(),
    } as any

    mockGetChatContentByChatIdUseCase = {
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
      mockSaveChatUseCase,
      mockGetChatsByUserIdUseCase,
      mockGetChatContentByChatIdUseCase
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
        mockSaveChatUseCase,
        mockGetChatsByUserIdUseCase,
        mockGetChatContentByChatIdUseCase
      )

      expect(instance).toBeInstanceOf(AIController)
      expect(instance).toBeDefined()
    })

    it('should accept GetChatUseCase, LoggerPort, and AppendedChatUseCase as dependencies', () => {
      const instance = new AIController(
        mockGetChatUseCase,
        mockLogger,
        mockAppendChatUseCase,
        mockSaveChatUseCase,
        mockGetChatsByUserIdUseCase,
        mockGetChatContentByChatIdUseCase
      )

      expect(instance).toBeDefined()
      expect(instance).toBeInstanceOf(AIController)
    })
  })

  describe('registerRoutes()', () => {
    it('should register POST /ai/chat route', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
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
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      // Verify handler is a bound function (at index 2, the third argument)
      // Using 'any' cast because Fastify has multiple overloads and TypeScript infers the 2-arg version
      const mockCalls = vi.mocked(mockApp.post).mock.calls[0] as any
      const chatHandler = mockCalls?.[2] as Function

      expect(chatHandler).toBeTypeOf('function')
    })

    it('should register routes with correct HTTP methods', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.post).toHaveBeenCalledTimes(1)
      expect(mockApp.get).toHaveBeenCalledTimes(2)
      expect(mockApp.put).not.toHaveBeenCalled()
      expect(mockApp.delete).not.toHaveBeenCalled()
    })

    it('should register GET /ai/chats/:userId route', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.get).toHaveBeenCalledTimes(2)
      expect(mockApp.get).toHaveBeenCalledWith(
        '/ai/chats/:userId',
        expect.objectContaining({ preHandler: expect.any(Array) }),
        expect.any(Function)
      )
    })

    it('should register GET /ai/fetchChat/:chatId/:userId route', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.get).toHaveBeenCalledTimes(2)
      expect(mockApp.get).toHaveBeenCalledWith(
        '/ai/fetchChat/:chatId/:userId',
        expect.objectContaining({ preHandler: expect.any(Array) }),
        expect.any(Function)
      )
    })
  })

  describe('chat()', () => {
    describe('validation', () => {
      it('should return 400 if request body is missing required fields', async () => {
        mockRequest.body = {
          invalidField: 'test',
        }

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
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

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'No messages provided',
        })
        // When messages is missing, validateUIMessages accepts empty array,
        // then the controller checks for empty messages and returns "No messages provided"
      })

      it('should return 400 if trigger is missing', async () => {
        mockRequest.body = {
          id: uuidv7(),
          messages: [{ role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
        }

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
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

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'No messages provided',
        })
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

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Last message must be from the user',
        })
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

        expect(mockReply.code).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'User not authenticated',
        })
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
      it('should return 400 if id is missing', async () => {
        mockRequest.body = {
          messages: [{ role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
          trigger: 'user-input',
        }

        await controller.chat(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid request body',
          details: 'id and trigger are required',
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

  describe('getAIChatsByUserId()', () => {
    describe('successful scenarios', () => {
      it('should retrieve chats for a valid userId', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const mockChats = [new ChatId(uuidv7()).getValue(), new ChatId(uuidv7()).getValue()]

        mockRequest.params = { userId }
        mockRequest.user = {
          sub: userId, // Same user accessing their own data
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatsByUserIdUseCase.execute).mockResolvedValue(mockChats)

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockChats,
        })
        expect(mockGetChatsByUserIdUseCase.execute).toHaveBeenCalledWith(userId)
        expect(mockGetChatsByUserIdUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockLogger.debug).toHaveBeenCalledWith('Received getAIChatsByUserId request')
      })

      it('should return empty array when user has no chats', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const mockChats: any[] = []

        mockRequest.params = { userId }
        mockRequest.user = {
          sub: userId, // Same user accessing their own data
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatsByUserIdUseCase.execute).mockResolvedValue(mockChats)

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: [],
        })
        expect(mockGetChatsByUserIdUseCase.execute).toHaveBeenCalledWith(userId)
      })

      it('should handle multiple chats for a user', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const mockChats = Array.from({ length: 10 }, () => new ChatId(uuidv7()).getValue())

        mockRequest.params = { userId }
        mockRequest.user = {
          sub: userId, // Same user accessing their own data
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatsByUserIdUseCase.execute).mockResolvedValue(mockChats)

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockChats,
        })
        expect(mockGetChatsByUserIdUseCase.execute).toHaveBeenCalledWith(userId)
      })
    })

    describe('validation', () => {
      it('should return 400 if userId parameter is missing', async () => {
        mockRequest.params = {}

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid userId parameter',
        })
        expect(mockGetChatsByUserIdUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 if userId parameter is undefined', async () => {
        mockRequest.params = { userId: undefined }

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid userId parameter',
        })
        expect(mockGetChatsByUserIdUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 if userId parameter is null', async () => {
        mockRequest.params = { userId: null }

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid userId parameter',
        })
        expect(mockGetChatsByUserIdUseCase.execute).not.toHaveBeenCalled()
      })

      it('should log debug message on request', async () => {
        const userId = new UserId(uuidv7()).getValue()
        mockRequest.params = { userId }
        mockRequest.user = {
          sub: userId, // Same user accessing their own data
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatsByUserIdUseCase.execute).mockResolvedValue([])

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockLogger.debug).toHaveBeenCalledWith('Received getAIChatsByUserId request')
        expect(mockLogger.debug).toHaveBeenCalledTimes(1)
      })
    })

    describe('error handling', () => {
      it('should return 500 when use case throws error', async () => {
        const userId = new UserId(uuidv7()).getValue()
        mockRequest.params = { userId }
        mockRequest.user = {
          sub: userId, // Same user accessing their own data
          email: 'user@example.com',
          roles: ['user'],
        }

        vi.mocked(mockGetChatsByUserIdUseCase.execute).mockRejectedValue(
          new Error('Database connection failed')
        )

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Internal server error',
        })
        expect(mockLogger.error).toHaveBeenCalled()
        expect(mockGetChatsByUserIdUseCase.execute).toHaveBeenCalledWith(userId)
      })

      it('should return 500 when repository throws error', async () => {
        const userId = new UserId(uuidv7()).getValue()
        mockRequest.params = { userId }
        mockRequest.user = {
          sub: userId, // Same user accessing their own data
          email: 'user@example.com',
          roles: ['user'],
        }

        vi.mocked(mockGetChatsByUserIdUseCase.execute).mockRejectedValue(
          new Error('Repository error')
        )

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Internal server error',
        })
        expect(mockLogger.error).toHaveBeenCalled()
        expect(mockGetChatsByUserIdUseCase.execute).toHaveBeenCalledWith(userId)
      })

      it('should return 400 error for invalid userId format', async () => {
        mockRequest.params = { userId: 'invalid-uuid-format' }

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid userId format',
        })
        expect(mockGetChatsByUserIdUseCase.execute).not.toHaveBeenCalled()
      })
    })

    describe('authorization', () => {
      it('should allow user to access their own chat history', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const mockChats = [new ChatId(uuidv7()).getValue(), new ChatId(uuidv7()).getValue()]

        mockRequest.params = { userId }
        mockRequest.user = {
          sub: userId, // Same as requested userId
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatsByUserIdUseCase.execute).mockResolvedValue(mockChats)

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockChats,
        })
        expect(mockGetChatsByUserIdUseCase.execute).toHaveBeenCalledWith(userId)
        expect(mockReply.code).not.toHaveBeenCalledWith(403)
      })

      it('should allow admin to access any user chat history', async () => {
        const targetUserId = new UserId(uuidv7()).getValue()
        const adminUserId = new UserId(uuidv7()).getValue()
        const mockChats = [new ChatId(uuidv7()).getValue()]

        mockRequest.params = { userId: targetUserId }
        mockRequest.user = {
          sub: adminUserId, // Different from target userId
          email: 'admin@example.com',
          roles: ['admin'],
        }
        vi.mocked(mockGetChatsByUserIdUseCase.execute).mockResolvedValue(mockChats)

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockChats,
        })
        expect(mockGetChatsByUserIdUseCase.execute).toHaveBeenCalledWith(targetUserId)
        expect(mockReply.code).not.toHaveBeenCalledWith(403)
      })

      it('should allow moderator to access any user chat history', async () => {
        const targetUserId = new UserId(uuidv7()).getValue()
        const moderatorUserId = new UserId(uuidv7()).getValue()
        const mockChats = [new ChatId(uuidv7()).getValue()]

        mockRequest.params = { userId: targetUserId }
        mockRequest.user = {
          sub: moderatorUserId, // Different from target userId
          email: 'moderator@example.com',
          roles: ['moderator'],
        }
        vi.mocked(mockGetChatsByUserIdUseCase.execute).mockResolvedValue(mockChats)

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockChats,
        })
        expect(mockGetChatsByUserIdUseCase.execute).toHaveBeenCalledWith(targetUserId)
        expect(mockReply.code).not.toHaveBeenCalledWith(403)
      })

      it('should return 403 when user tries to access another user chat history', async () => {
        const targetUserId = new UserId(uuidv7()).getValue()
        const requestingUserId = new UserId(uuidv7()).getValue()

        mockRequest.params = { userId: targetUserId }
        mockRequest.user = {
          sub: requestingUserId, // Different from target userId
          email: 'user@example.com',
          roles: ['user'],
        }

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(403)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error:
            'Access denied. You can only access your own chat history or must have admin/moderator role',
        })
        expect(mockGetChatsByUserIdUseCase.execute).not.toHaveBeenCalled()
        expect(mockLogger.warn).toHaveBeenCalled()
      })

      it('should return 403 when user has no roles and tries to access another user chat history', async () => {
        const targetUserId = new UserId(uuidv7()).getValue()
        const requestingUserId = new UserId(uuidv7()).getValue()

        mockRequest.params = { userId: targetUserId }
        mockRequest.user = {
          sub: requestingUserId,
          email: 'user@example.com',
          roles: [], // No roles
        }

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(403)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error:
            'Access denied. You can only access your own chat history or must have admin/moderator role',
        })
        expect(mockGetChatsByUserIdUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 401 when user is not authenticated', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.params = { userId }
        mockRequest.user = undefined // No authenticated user

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Authentication required',
        })
        expect(mockGetChatsByUserIdUseCase.execute).not.toHaveBeenCalled()
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Authorization check failed: User not authenticated'
        )
      })

      it('should allow user with both admin and moderator roles to access any user chat history', async () => {
        const targetUserId = new UserId(uuidv7()).getValue()
        const adminUserId = new UserId(uuidv7()).getValue()
        const mockChats = [new ChatId(uuidv7()).getValue()]

        mockRequest.params = { userId: targetUserId }
        mockRequest.user = {
          sub: adminUserId,
          email: 'superuser@example.com',
          roles: ['admin', 'moderator'], // Multiple roles
        }
        vi.mocked(mockGetChatsByUserIdUseCase.execute).mockResolvedValue(mockChats)

        await controller.getAIChatsByUserId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockChats,
        })
        expect(mockGetChatsByUserIdUseCase.execute).toHaveBeenCalledWith(targetUserId)
        expect(mockReply.code).not.toHaveBeenCalledWith(403)
      })
    })
  })

  describe('getAIChatByChatId()', () => {
    describe('successful scenarios', () => {
      it('should retrieve chat content for valid chatId and userId', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()
        const mockChatData = [
          {
            message: {
              id: 'msg-1',
              chatId,
              role: 'user',
              createdAt: new Date(),
            },
            part: {
              id: 'part-1',
              messageId: 'msg-1',
              type: 'text',
              textText: 'Hello',
              order: 0,
            },
          },
          {
            message: {
              id: 'msg-2',
              chatId,
              role: 'assistant',
              createdAt: new Date(),
            },
            part: {
              id: 'part-2',
              messageId: 'msg-2',
              type: 'text',
              textText: 'Hi there!',
              order: 0,
            },
          },
        ]

        mockRequest.params = { chatId, userId }
        mockRequest.user = {
          sub: userId, // Same user accessing their own chat
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockResolvedValue(mockChatData as any)

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            id: chatId,
            messages: expect.arrayContaining([
              expect.objectContaining({
                id: 'msg-1',
                role: 'user',
                parts: expect.any(Array),
              }),
              expect.objectContaining({
                id: 'msg-2',
                role: 'assistant',
                parts: expect.any(Array),
              }),
            ]),
          }),
        })
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledWith(chatId)
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockLogger.debug).toHaveBeenCalledWith('Received getAIChatByChatId request')
      })

      it('should handle chat with multiple messages and parts', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()
        const mockChatData = [
          {
            message: {
              id: 'msg-1',
              chatId,
              role: 'user',
              createdAt: new Date('2024-01-01'),
            },
            part: {
              id: 'part-1',
              messageId: 'msg-1',
              type: 'text',
              textText: 'First message',
              order: 0,
            },
          },
          {
            message: {
              id: 'msg-1',
              chatId,
              role: 'user',
              createdAt: new Date('2024-01-01'),
            },
            part: {
              id: 'part-2',
              messageId: 'msg-1',
              type: 'text',
              textText: 'Second part',
              order: 1,
            },
          },
          {
            message: {
              id: 'msg-2',
              chatId,
              role: 'assistant',
              createdAt: new Date('2024-01-02'),
            },
            part: {
              id: 'part-3',
              messageId: 'msg-2',
              type: 'text',
              textText: 'Response',
              order: 0,
            },
          },
        ]

        mockRequest.params = { chatId, userId }
        mockRequest.user = {
          sub: userId,
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockResolvedValue(mockChatData as any)

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            id: chatId,
            messages: expect.arrayContaining([
              expect.objectContaining({
                id: 'msg-1',
                parts: expect.any(Array),
              }),
              expect.objectContaining({
                id: 'msg-2',
                parts: expect.any(Array),
              }),
            ]),
          }),
        })
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledWith(chatId)
      })

      it('should handle chat with messages without parts', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()
        const mockChatData = [
          {
            message: {
              id: 'msg-1',
              chatId,
              role: 'user',
              createdAt: new Date(),
            },
            part: null, // Message without parts
          },
        ]

        mockRequest.params = { chatId, userId }
        mockRequest.user = {
          sub: userId,
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockResolvedValue(mockChatData as any)

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            id: chatId,
            messages: expect.arrayContaining([
              expect.objectContaining({
                id: 'msg-1',
                role: 'user',
                parts: [],
              }),
            ]),
          }),
        })
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledWith(chatId)
      })
    })

    describe('validation', () => {
      it('should return 400 if chatId parameter is missing', async () => {
        const userId = new UserId(uuidv7()).getValue()
        mockRequest.params = { userId } // Missing chatId

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Missing chatId parameter',
        })
        expect(mockGetChatContentByChatIdUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 if userId parameter is missing', async () => {
        const chatId = new ChatId(uuidv7()).getValue()
        mockRequest.params = { chatId } // Missing userId

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid userId parameter',
        })
        expect(mockGetChatContentByChatIdUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 if chatId parameter is undefined', async () => {
        const userId = new UserId(uuidv7()).getValue()
        mockRequest.params = { chatId: undefined, userId }

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Missing chatId parameter',
        })
        expect(mockGetChatContentByChatIdUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 if userId parameter is undefined', async () => {
        const chatId = new ChatId(uuidv7()).getValue()
        mockRequest.params = { chatId, userId: undefined }

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid userId parameter',
        })
        expect(mockGetChatContentByChatIdUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 for invalid chatId format', async () => {
        const userId = new UserId(uuidv7()).getValue()
        mockRequest.params = { chatId: 'invalid-uuid-format', userId }

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid chatId format',
        })
        expect(mockGetChatContentByChatIdUseCase.execute).not.toHaveBeenCalled()
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should return 400 for invalid userId format', async () => {
        const chatId = new ChatId(uuidv7()).getValue()
        mockRequest.params = { chatId, userId: 'invalid-uuid-format' }

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid userId format',
        })
        expect(mockGetChatContentByChatIdUseCase.execute).not.toHaveBeenCalled()
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should log debug message on request', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()
        mockRequest.params = { chatId, userId }
        mockRequest.user = {
          sub: userId,
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockResolvedValue([
          {
            message: { id: 'msg-1', chatId, role: 'user', createdAt: new Date() },
            part: { id: 'part-1', messageId: 'msg-1', type: 'text', textText: 'Hello', order: 0 },
          },
        ] as any)

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockLogger.debug).toHaveBeenCalledWith('Received getAIChatByChatId request')
        expect(mockLogger.debug).toHaveBeenCalledTimes(1)
      })
    })

    describe('not found scenarios', () => {
      it('should return 404 when chat does not exist', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()

        mockRequest.params = { chatId, userId }
        mockRequest.user = {
          sub: userId,
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockResolvedValue(null)

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(404)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Chat not found',
        })
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledWith(chatId)
      })

      it('should return 404 when chat has no messages', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()

        mockRequest.params = { chatId, userId }
        mockRequest.user = {
          sub: userId,
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockResolvedValue([])

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(404)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Chat not found',
        })
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledWith(chatId)
      })
    })

    describe('error handling', () => {
      it('should return 500 when use case throws error', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()

        mockRequest.params = { chatId, userId }
        mockRequest.user = {
          sub: userId,
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockRejectedValue(
          new Error('Database connection failed')
        )

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Internal server error',
        })
        expect(mockLogger.error).toHaveBeenCalled()
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledWith(chatId)
      })

      it('should return 500 when repository throws error', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()

        mockRequest.params = { chatId, userId }
        mockRequest.user = {
          sub: userId,
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockRejectedValue(
          new Error('Repository error')
        )

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Internal server error',
        })
        expect(mockLogger.error).toHaveBeenCalled()
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledWith(chatId)
      })

      it('should handle unexpected errors gracefully', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()

        mockRequest.params = { chatId, userId }
        mockRequest.user = {
          sub: userId,
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockRejectedValue(
          new Error('Unexpected error')
        )

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Internal server error',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error while fetching chat in getAIChatByChatId'),
          expect.any(Error)
        )
      })
    })

    describe('authorization', () => {
      it('should allow user to access their own chat', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()
        const mockChatData = [
          {
            message: {
              id: 'msg-1',
              chatId,
              role: 'user',
              createdAt: new Date(),
            },
            part: {
              id: 'part-1',
              messageId: 'msg-1',
              type: 'text',
              textText: 'Hello',
              order: 0,
            },
          },
        ]

        mockRequest.params = { chatId, userId }
        mockRequest.user = {
          sub: userId, // Same as requested userId
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockResolvedValue(mockChatData as any)

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            id: chatId,
            messages: expect.any(Array),
          }),
        })
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledWith(chatId)
        expect(mockReply.code).not.toHaveBeenCalledWith(403)
      })

      it('should allow admin to access any user chat', async () => {
        const targetUserId = new UserId(uuidv7()).getValue()
        const adminUserId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()
        const mockChatData = [
          {
            message: {
              id: 'msg-1',
              chatId,
              role: 'user',
              createdAt: new Date(),
            },
            part: {
              id: 'part-1',
              messageId: 'msg-1',
              type: 'text',
              textText: 'Hello',
              order: 0,
            },
          },
        ]

        mockRequest.params = { chatId, userId: targetUserId }
        mockRequest.user = {
          sub: adminUserId, // Different from target userId
          email: 'admin@example.com',
          roles: ['admin'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockResolvedValue(mockChatData as any)

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            id: chatId,
            messages: expect.any(Array),
          }),
        })
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledWith(chatId)
        expect(mockReply.code).not.toHaveBeenCalledWith(403)
      })

      it('should allow moderator to access any user chat', async () => {
        const targetUserId = new UserId(uuidv7()).getValue()
        const moderatorUserId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()
        const mockChatData = [
          {
            message: {
              id: 'msg-1',
              chatId,
              role: 'user',
              createdAt: new Date(),
            },
            part: {
              id: 'part-1',
              messageId: 'msg-1',
              type: 'text',
              textText: 'Hello',
              order: 0,
            },
          },
        ]

        mockRequest.params = { chatId, userId: targetUserId }
        mockRequest.user = {
          sub: moderatorUserId, // Different from target userId
          email: 'moderator@example.com',
          roles: ['moderator'],
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockResolvedValue(mockChatData as any)

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            id: chatId,
            messages: expect.any(Array),
          }),
        })
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledWith(chatId)
        expect(mockReply.code).not.toHaveBeenCalledWith(403)
      })

      it('should return 403 when user tries to access another user chat', async () => {
        const targetUserId = new UserId(uuidv7()).getValue()
        const requestingUserId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()

        mockRequest.params = { chatId, userId: targetUserId }
        mockRequest.user = {
          sub: requestingUserId, // Different from target userId
          email: 'user@example.com',
          roles: ['user'],
        }

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(403)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error:
            'Access denied. You can only access your own chat history or must have admin/moderator role',
        })
        expect(mockGetChatContentByChatIdUseCase.execute).not.toHaveBeenCalled()
        expect(mockLogger.warn).toHaveBeenCalled()
      })

      it('should return 403 when user has no roles and tries to access another user chat', async () => {
        const targetUserId = new UserId(uuidv7()).getValue()
        const requestingUserId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()

        mockRequest.params = { chatId, userId: targetUserId }
        mockRequest.user = {
          sub: requestingUserId,
          email: 'user@example.com',
          roles: [], // No roles
        }

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(403)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error:
            'Access denied. You can only access your own chat history or must have admin/moderator role',
        })
        expect(mockGetChatContentByChatIdUseCase.execute).not.toHaveBeenCalled()
      })

      it('should allow user with both admin and moderator roles to access any user chat', async () => {
        const targetUserId = new UserId(uuidv7()).getValue()
        const adminUserId = new UserId(uuidv7()).getValue()
        const chatId = new ChatId(uuidv7()).getValue()
        const mockChatData = [
          {
            message: {
              id: 'msg-1',
              chatId,
              role: 'user',
              createdAt: new Date(),
            },
            part: {
              id: 'part-1',
              messageId: 'msg-1',
              type: 'text',
              textText: 'Hello',
              order: 0,
            },
          },
        ]

        mockRequest.params = { chatId, userId: targetUserId }
        mockRequest.user = {
          sub: adminUserId,
          email: 'superuser@example.com',
          roles: ['admin', 'moderator'], // Multiple roles
        }
        vi.mocked(mockGetChatContentByChatIdUseCase.execute).mockResolvedValue(mockChatData as any)

        await controller.getAIChatByChatId(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            id: chatId,
            messages: expect.any(Array),
          }),
        })
        expect(mockGetChatContentByChatIdUseCase.execute).toHaveBeenCalledWith(chatId)
        expect(mockReply.code).not.toHaveBeenCalledWith(403)
      })
    })
  })
})
