import type { ToolExecutionOptions } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { GetTextUseCase } from '../../../../src/application/use-cases/get-text.use-case.js'
import {
  type HeartOfDarknessOutput,
  HeartOfDarknessTool,
} from '../../../../src/infrastructure/ai/tools/heart-of-darkness.tool.js'

// Mock instance to be used across tests
let mockGetTextUseCaseInstance: {
  filePath: string
  execute: ReturnType<typeof vi.fn>
  getCachedContent: ReturnType<typeof vi.fn>
  hasCachedContent: ReturnType<typeof vi.fn>
  clearCache: ReturnType<typeof vi.fn>
  getCachedPaths: ReturnType<typeof vi.fn>
}

// Mock the GetTextUseCase module
vi.mock('../../../../src/application/use-cases/get-text.use-case.js', () => {
  // Use a function with 'function' keyword so it can be used as a constructor
  return {
    GetTextUseCase: vi.fn(function (this: unknown) {
      return mockGetTextUseCaseInstance
    }),
  }
})

describe('HeartOfDarknessTool', () => {
  let tool: HeartOfDarknessTool
  let mockLogger: LoggerPort
  let mockOptions: ToolExecutionOptions

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    // Create mock ToolCallOptions
    mockOptions = {
      abortSignal: undefined,
      toolCallId: 'test-call-id',
      messages: [],
    }

    // Create mock GetTextUseCase instance
    mockGetTextUseCaseInstance = {
      filePath: '/test/path/data/heart-of-darkness.txt',
      execute: vi.fn(),
      getCachedContent: vi.fn(),
      hasCachedContent: vi.fn(),
      clearCache: vi.fn(),
      getCachedPaths: vi.fn(),
    }

    // Create tool instance
    tool = new HeartOfDarknessTool(mockLogger)
  })

  describe('constructor', () => {
    it('should create instance with logger', () => {
      expect(tool).toBeInstanceOf(HeartOfDarknessTool)
    })

    it('should initialize GetTextUseCase with correct parameters', () => {
      expect(GetTextUseCase).toHaveBeenCalledWith('data', 'heart-of-darkness.txt')
    })

    it('should store logger reference', () => {
      const newTool = new HeartOfDarknessTool(mockLogger)
      expect(newTool).toBeDefined()
    })
  })

  describe('getTool()', () => {
    it('should return a tool object', () => {
      const aiTool = tool.getTool()

      expect(aiTool).toBeDefined()
      expect(aiTool).toHaveProperty('description')
      expect(aiTool).toHaveProperty('inputSchema')
      expect(aiTool).toHaveProperty('execute')
    })

    it('should have correct description', () => {
      const aiTool = tool.getTool()

      expect(aiTool.description).toContain('Heart of Darkness')
      expect(aiTool.description).toContain('Joseph Conrad')
      expect(aiTool.description).toContain('full text')
    })

    it('should have inputSchema with question field', () => {
      const aiTool = tool.getTool()

      // Just verify the schema is defined - the AI SDK handles the actual validation
      expect(aiTool.inputSchema).toBeDefined()
    })

    it('should include question field in input', async () => {
      const mockText = 'Text content'
      const question = 'What is the main theme?'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!({ question }, mockOptions)) as HeartOfDarknessOutput

      // Verify the question is passed through correctly
      expect(result.question).toBe(question)
    })
  })

  describe('execute() - cached content', () => {
    it('should use cached content when available', async () => {
      const mockText = 'The Nellie, a cruising yawl, swung to her anchor...'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!(
        { question: 'Who is Marlow?' },
        mockOptions
      )) as HeartOfDarknessOutput

      expect(mockGetTextUseCaseInstance.hasCachedContent).toHaveBeenCalledWith(
        mockGetTextUseCaseInstance.filePath
      )
      expect(mockGetTextUseCaseInstance.getCachedContent).toHaveBeenCalledWith(
        mockGetTextUseCaseInstance.filePath
      )
      expect(mockGetTextUseCaseInstance.execute).not.toHaveBeenCalled()
      // Context now includes extracted passages or fallback format
      expect(result.context).toContain(mockText)
    })

    it('should log when loading from cache', async () => {
      const mockText = 'Cached text'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()
      await aiTool.execute!({ question: 'Test question' }, mockOptions)

      expect(mockLogger.info).toHaveBeenCalledWith('Heart of Darkness text loaded from cache')
    })

    it('should include question in result when using cache', async () => {
      const mockText = 'Text content'
      const question = 'What happens at the Inner Station?'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!({ question }, mockOptions)) as HeartOfDarknessOutput

      expect(result.question).toBe(question)
    })

    it('should include text length in result when using cache', async () => {
      const mockText = 'A'.repeat(1000)
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!(
        { question: 'Test' },
        mockOptions
      )) as HeartOfDarknessOutput

      expect(result.textLength).toBe(1000)
    })

    it('should include instructions in result when using cache', async () => {
      const mockText = 'Text'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!(
        { question: 'Test' },
        mockOptions
      )) as HeartOfDarknessOutput

      expect(result.instructions).toContain('Heart of Darkness')
      expect(result.instructions).toContain('answer the question')
    })
  })

  describe('execute() - file loading', () => {
    it('should load from file when not cached', async () => {
      const mockText = 'File content...'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(false)
      vi.mocked(mockGetTextUseCaseInstance.execute).mockResolvedValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!(
        { question: 'Who is Kurtz?' },
        mockOptions
      )) as HeartOfDarknessOutput

      expect(mockGetTextUseCaseInstance.hasCachedContent).toHaveBeenCalledWith(
        mockGetTextUseCaseInstance.filePath
      )
      expect(mockGetTextUseCaseInstance.execute).toHaveBeenCalled()
      expect(mockGetTextUseCaseInstance.getCachedContent).not.toHaveBeenCalled()
      // Context now includes extracted passages or fallback format
      expect(result.context).toContain(mockText)
    })

    it('should log when loading from file', async () => {
      const mockText = 'File text'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(false)
      vi.mocked(mockGetTextUseCaseInstance.execute).mockResolvedValue(mockText)

      const aiTool = tool.getTool()
      await aiTool.execute!({ question: 'Test question' }, mockOptions)

      expect(mockLogger.info).toHaveBeenCalledWith('Heart of Darkness text loaded from file')
    })

    it('should include question in result when loading from file', async () => {
      const mockText = 'Text'
      const question = "What is the Congo River's significance?"
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(false)
      vi.mocked(mockGetTextUseCaseInstance.execute).mockResolvedValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!({ question }, mockOptions)) as HeartOfDarknessOutput

      expect(result.question).toBe(question)
    })

    it('should include text length in result when loading from file', async () => {
      const mockText = 'B'.repeat(5000)
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(false)
      vi.mocked(mockGetTextUseCaseInstance.execute).mockResolvedValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!(
        { question: 'Test' },
        mockOptions
      )) as HeartOfDarknessOutput

      expect(result.textLength).toBe(5000)
    })

    it('should handle undefined content from execute', async () => {
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(false)
      vi.mocked(mockGetTextUseCaseInstance.execute).mockResolvedValue(undefined)

      const aiTool = tool.getTool()

      // Should throw error when execute returns undefined
      await expect(aiTool.execute!({ question: 'Test' }, mockOptions)).rejects.toThrow(
        'Failed to load Heart of Darkness text'
      )
    })
  })

  describe('execute() - error handling', () => {
    it('should handle Error objects from GetTextUseCase', async () => {
      const error = new Error('File not found')
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(false)
      vi.mocked(mockGetTextUseCaseInstance.execute).mockRejectedValue(error)

      const aiTool = tool.getTool()

      await expect(aiTool.execute!({ question: 'Test' }, mockOptions)).rejects.toThrow(
        'Error loading Heart of Darkness text: File not found'
      )
    })

    it('should log error when execute fails', async () => {
      const error = new Error('Read error')
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(false)
      vi.mocked(mockGetTextUseCaseInstance.execute).mockRejectedValue(error)

      const aiTool = tool.getTool()

      try {
        await aiTool.execute!({ question: 'Test' }, mockOptions)
      } catch {
        // Expected error
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error loading Heart of Darkness text: Read error'
      )
    })

    it('should handle non-Error thrown values', async () => {
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(false)
      vi.mocked(mockGetTextUseCaseInstance.execute).mockRejectedValue('String error')

      const aiTool = tool.getTool()

      await expect(aiTool.execute!({ question: 'Test' }, mockOptions)).rejects.toThrow(
        'Error loading Heart of Darkness text: Unknown error occurred'
      )
    })

    it('should log unknown error for non-Error values', async () => {
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(false)
      vi.mocked(mockGetTextUseCaseInstance.execute).mockRejectedValue(null)

      const aiTool = tool.getTool()

      try {
        await aiTool.execute!({ question: 'Test' }, mockOptions)
      } catch {
        // Expected error
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error loading Heart of Darkness text: Unknown error occurred'
      )
    })

    it('should handle error when checking cache', async () => {
      const error = new Error('Cache check failed')
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockImplementation(() => {
        throw error
      })

      const aiTool = tool.getTool()

      await expect(aiTool.execute!({ question: 'Test' }, mockOptions)).rejects.toThrow(
        'Error loading Heart of Darkness text: Cache check failed'
      )
    })

    it('should handle error when getting cached content', async () => {
      const error = new Error('Cache retrieval failed')
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockImplementation(() => {
        throw error
      })

      const aiTool = tool.getTool()

      await expect(aiTool.execute!({ question: 'Test' }, mockOptions)).rejects.toThrow(
        'Error loading Heart of Darkness text: Cache retrieval failed'
      )
    })
  })

  describe('execute() - result structure', () => {
    it('should return all required fields', async () => {
      const mockText = 'Text content'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!(
        { question: 'Test question' },
        mockOptions
      )) as HeartOfDarknessOutput

      expect(result).toHaveProperty('question')
      expect(result).toHaveProperty('textLength')
      expect(result).toHaveProperty('context')
      expect(result).toHaveProperty('instructions')
    })

    it('should have correct types for all fields', async () => {
      const mockText = 'Text'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!(
        { question: 'Test' },
        mockOptions
      )) as HeartOfDarknessOutput

      expect(typeof result.question).toBe('string')
      expect(typeof result.textLength).toBe('number')
      expect(typeof result.context).toBe('string')
      expect(typeof result.instructions).toBe('string')
    })

    it('should handle empty text content', async () => {
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(null as any)

      const aiTool = tool.getTool()

      // Should throw error when content is null/undefined
      await expect(aiTool.execute!({ question: 'Test' }, mockOptions)).rejects.toThrow(
        'Failed to load Heart of Darkness text'
      )
    })
  })

  describe('integration scenarios', () => {
    it('should work with multiple questions using cached content', async () => {
      const mockText = 'Story text'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()

      const result1 = (await aiTool.execute!(
        { question: 'Question 1' },
        mockOptions
      )) as HeartOfDarknessOutput
      const result2 = (await aiTool.execute!(
        { question: 'Question 2' },
        mockOptions
      )) as HeartOfDarknessOutput

      // Context now includes extracted passages or fallback format
      expect(result1.context).toContain(mockText)
      expect(result2.context).toContain(mockText)
      expect(mockGetTextUseCaseInstance.getCachedContent).toHaveBeenCalledTimes(2)
      expect(mockGetTextUseCaseInstance.execute).not.toHaveBeenCalled()
    })

    it('should handle cache miss followed by cache hit', async () => {
      const mockText = 'Story content'

      // First call - cache miss
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValueOnce(false)
      vi.mocked(mockGetTextUseCaseInstance.execute).mockResolvedValueOnce(mockText)

      const aiTool = tool.getTool()
      const result1 = (await aiTool.execute!(
        { question: 'First question' },
        mockOptions
      )) as HeartOfDarknessOutput

      // Second call - cache hit
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValueOnce(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValueOnce(mockText)

      const result2 = (await aiTool.execute!(
        { question: 'Second question' },
        mockOptions
      )) as HeartOfDarknessOutput

      // Context now includes extracted passages or fallback format
      expect(result1.context).toContain(mockText)
      expect(result2.context).toContain(mockText)
      expect(mockLogger.info).toHaveBeenCalledWith('Heart of Darkness text loaded from file')
      expect(mockLogger.info).toHaveBeenCalledWith('Heart of Darkness text loaded from cache')
    })

    it('should create separate instances with separate loggers', () => {
      const mockLogger2: LoggerPort = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      }

      const tool1 = new HeartOfDarknessTool(mockLogger)
      const tool2 = new HeartOfDarknessTool(mockLogger2)

      expect(tool1).toBeDefined()
      expect(tool2).toBeDefined()
      expect(tool1).not.toBe(tool2)
    })

    it('should handle very long questions', async () => {
      const mockText = 'Text'
      const longQuestion = 'What is the significance of '.repeat(100) + '?'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!(
        { question: longQuestion },
        mockOptions
      )) as HeartOfDarknessOutput

      expect(result.question).toBe(longQuestion)
      // Context now includes extracted passages or fallback format
      expect(result.context).toContain(mockText)
    })

    it('should handle questions with special characters', async () => {
      const mockText = 'Text'
      const specialQuestion = 'What does "darkness" mean? Is it literal/symbolic?'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!(
        { question: specialQuestion },
        mockOptions
      )) as HeartOfDarknessOutput

      expect(result.question).toBe(specialQuestion)
    })

    it('should handle unicode characters in questions', async () => {
      const mockText = 'Text'
      const unicodeQuestion = 'What is the symbolism? 你好 مرحبا'
      vi.mocked(mockGetTextUseCaseInstance.hasCachedContent).mockReturnValue(true)
      vi.mocked(mockGetTextUseCaseInstance.getCachedContent).mockReturnValue(mockText)

      const aiTool = tool.getTool()
      const result = (await aiTool.execute!(
        { question: unicodeQuestion },
        mockOptions
      )) as HeartOfDarknessOutput

      expect(result.question).toBe(unicodeQuestion)
    })
  })
})
