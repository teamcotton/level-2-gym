import {
  type UIMessagePart,
  type InferUITools,
  type UIMessageStreamWriter,
  type UIMessage,
} from 'ai'
import { z } from 'zod'

export const metadataSchema = z.object({})

type MyMetadata = z.infer<typeof metadataSchema>

export const dataPartSchema = z.object({
  darkness: z.object({
    response: z.string().optional(),
    loading: z.boolean().default(true),
  }),
})

export type MyDataPart = z.infer<typeof dataPartSchema>

// UIMessagePart requires 2 type arguments: data part and tools
// Since we're not using custom tools types, we use never for the tools parameter
export type MyUIMessagePart = UIMessagePart<MyDataPart, never>
