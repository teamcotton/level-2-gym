import { z } from 'zod'

export const AISchema = z.object({
  id: z.string(),
  // Text prompt associated with this AI option (maps to ai_options.prompt)
  prompt: z.string().min(1, { message: 'Prompt is required' }),
  // Maximum number of tokens to generate (maps to ai_options.max_tokens)
  maxTokens: z.number().int().min(1, { message: 'maxTokens must be at least 1' }),
  // Temperature for sampling (maps to ai_options.temperature)
  temperature: z
    .number()
    .min(0, { message: 'temperature must be at least 0' })
    .max(2, { message: 'temperature must be at most 2' }),
  // Top P for nucleus sampling (maps to ai_options.top_p)
  topP: z
    .number()
    .min(0, { message: 'topP must be at least 0' })
    .max(1, { message: 'topP must be at most 1' }),
  // Penalty for repeated tokens (maps to ai_options.frequency_penalty)
  frequencyPenalty: z
    .number()
    .min(-2, { message: 'frequencyPenalty must be at least -2' })
    .max(2, { message: 'frequencyPenalty must be at most 2' }),
  // Penalty for presence of tokens (maps to ai_options.presence_penalty)
  presencePenalty: z
    .number()
    .min(-2, { message: 'presencePenalty must be at least -2' })
    .max(2, { message: 'presencePenalty must be at most 2' }),
  createdAt: z.coerce.date(),
})

export const CreateAISchema = AISchema.pick({
  prompt: true,
  maxTokens: true,
  temperature: true,
  topP: true,
  frequencyPenalty: true,
  presencePenalty: true,
})

export const UpdateAISchema = CreateAISchema.partial()

export const AISummarySchema = z.object({
  id: z.string(),
  prompt: z.string(),
  createdAt: z.string().optional(),
})

export const AIListSchema = z.array(AISummarySchema)

export const AISummaryWithUsageSchema = AISummarySchema.extend({
  usageCount: z.number(),
})

export const AIListWithUsageSchema = z.array(AISummaryWithUsageSchema)
export const AIUsageSchema = z.object({
  aiId: z.string(),
  usageCount: z.number(),
})

export const AIUsageListSchema = z.array(AIUsageSchema)

export const AIModelsSchema = z.array(z.string())

export const AIRequestSchema = z.object({
  prompt: z.string().min(1, { message: 'Prompt is required' }),
})

export const MessagePartSchema = z.object({
  type: z.enum(['text', 'step-start']),
  text: z.string().optional(),
  state: z.enum(['done']).optional(),
})

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  parts: z.array(MessagePartSchema),
})

export const AIReturnedResponseSchema = z.object({
  id: z.uuid(),
  messages: z.array(MessageSchema),
  trigger: z.string(),
})

export type AISummaryWithUsageSchemaType = z.infer<typeof AISummaryWithUsageSchema>
export type AISchemaType = z.infer<typeof AISchema>
export type CreateAISchemaType = z.infer<typeof CreateAISchema>
export type UpdateAISchemaType = z.infer<typeof UpdateAISchema>
export type AISummarySchemaType = z.infer<typeof AISummarySchema>
export type AIListSchemaType = z.infer<typeof AIListSchema>
export type AIUsageSchemaType = z.infer<typeof AIUsageSchema>
export type AIUsageListSchemaType = z.infer<typeof AIUsageListSchema>
export type AIReturnedResponseSchemaType = z.infer<typeof AIReturnedResponseSchema>
export type AIListWithUsageSchemaType = z.infer<typeof AIListWithUsageSchema>
export type AIModelsSchemaType = z.infer<typeof AIModelsSchema>
export type AIRequestSchemaType = z.infer<typeof AIRequestSchema>
export type MessagePartSchemaType = z.infer<typeof MessagePartSchema>
export type MessageSchemaType = z.infer<typeof MessageSchema>
