import { describe, expect,it } from 'vitest'

import {
  AISchema,
  AISummarySchema,
  CreateAISchema,
  MessagePartSchema,
  MessageSchema,
  UpdateAISchema,
} from '../../src/schemas/ai.js'

describe('AI Schemas', () => {
  describe('AISchema', () => {
    it('should validate valid AI data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should coerce date string to Date', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
        createdAt: '2024-01-01T00:00:00.000Z',
      }

      const result = AISchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date)
      }
    })

    it('should reject empty prompt', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: '',
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Prompt is required')
      }
    })

    it('should reject maxTokens less than 1', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 0,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('maxTokens must be at least 1')
      }
    })

    it('should reject non-integer maxTokens', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100.5,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject temperature below 0', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: -0.1,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('temperature must be at least 0')
      }
    })

    it('should reject temperature above 2', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 2.1,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('temperature must be at most 2')
      }
    })

    it('should reject topP below 0', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 0.7,
        topP: -0.1,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('topP must be at least 0')
      }
    })

    it('should reject topP above 1', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 0.7,
        topP: 1.1,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('topP must be at most 1')
      }
    })

    it('should reject frequencyPenalty below -2', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: -2.1,
        presencePenalty: 0.3,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('frequencyPenalty must be at least -2')
      }
    })

    it('should reject frequencyPenalty above 2', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 2.1,
        presencePenalty: 0.3,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('frequencyPenalty must be at most 2')
      }
    })

    it('should reject presencePenalty below -2', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: -2.1,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('presencePenalty must be at least -2')
      }
    })

    it('should reject presencePenalty above 2', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 2.1,
        createdAt: new Date(),
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('presencePenalty must be at most 2')
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = AISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('CreateAISchema', () => {
    it('should validate valid create AI data', () => {
      const validData = {
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
      }

      const result = CreateAISchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject data with id field', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
      }

      const result = CreateAISchema.safeParse(invalidData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('id')
      }
    })

    it('should reject empty prompt', () => {
      const invalidData = {
        prompt: '',
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
      }

      const result = CreateAISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Prompt is required')
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        prompt: 'Test prompt',
      }

      const result = CreateAISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateAISchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        prompt: 'Updated prompt',
        maxTokens: 200,
      }

      const result = UpdateAISchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const validData = {}

      const result = UpdateAISchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow partial updates', () => {
      const validData = {
        temperature: 0.5,
      }

      const result = UpdateAISchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid field values', () => {
      const invalidData = {
        temperature: 3,
      }

      const result = UpdateAISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('temperature must be at most 2')
      }
    })

    it('should reject empty prompt when provided', () => {
      const invalidData = {
        prompt: '',
      }

      const result = UpdateAISchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Prompt is required')
      }
    })
  })

  describe('AISummarySchema', () => {
    it('should validate valid summary data with createdAt', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        createdAt: new Date(),
      }

      const result = AISummarySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate valid summary data without createdAt', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
      }

      const result = AISummarySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should coerce date string to Date', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        createdAt: '2024-01-01T00:00:00.000Z',
      }

      const result = AISummarySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date)
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = AISummarySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('MessagePartSchema', () => {
    it('should validate text type with text content', () => {
      const validData = {
        type: 'text',
        text: 'Hello world',
      }

      const result = MessagePartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate text type with state', () => {
      const validData = {
        type: 'text',
        text: 'Hello world',
        state: 'done',
      }

      const result = MessagePartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate step-start type without text', () => {
      const validData = {
        type: 'step-start',
      }

      const result = MessagePartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate reasoning type', () => {
      const validData = {
        type: 'reasoning',
        text: 'Reasoning content',
      }

      const result = MessagePartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate file type', () => {
      const validData = {
        type: 'file',
      }

      const result = MessagePartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate source_url type', () => {
      const validData = {
        type: 'source_url',
      }

      const result = MessagePartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate source_document type', () => {
      const validData = {
        type: 'source_document',
      }

      const result = MessagePartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate data type', () => {
      const validData = {
        type: 'data',
      }

      const result = MessagePartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid type', () => {
      const invalidData = {
        type: 'invalid-type',
      }

      const result = MessagePartSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid state', () => {
      const invalidData = {
        type: 'text',
        text: 'Hello',
        state: 'invalid-state',
      }

      const result = MessagePartSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing required type field', () => {
      const invalidData = {
        text: 'Hello world',
      }

      const result = MessagePartSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('MessageSchema', () => {
    it('should validate user message with single part', () => {
      const validData = {
        id: 'msg-123',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Hello',
          },
        ],
      }

      const result = MessageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate assistant message with multiple parts', () => {
      const validData = {
        id: 'msg-456',
        role: 'assistant',
        parts: [
          {
            type: 'step-start',
          },
          {
            type: 'text',
            text: 'Hello back',
            state: 'done',
          },
        ],
      }

      const result = MessageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate message with empty parts array', () => {
      const validData = {
        id: 'msg-789',
        role: 'user',
        parts: [],
      }

      const result = MessageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid role', () => {
      const invalidData = {
        id: 'msg-123',
        role: 'system',
        parts: [
          {
            type: 'text',
            text: 'Hello',
          },
        ],
      }

      const result = MessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        id: 'msg-123',
        role: 'user',
      }

      const result = MessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid part in parts array', () => {
      const invalidData = {
        id: 'msg-123',
        role: 'user',
        parts: [
          {
            type: 'invalid-type',
            text: 'Hello',
          },
        ],
      }

      const result = MessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject non-array parts', () => {
      const invalidData = {
        id: 'msg-123',
        role: 'user',
        parts: 'not-an-array',
      }

      const result = MessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
