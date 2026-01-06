import { google } from '@ai-sdk/google'
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai'
import { z } from 'zod'
import type { FastifyRequest } from 'fastify'

import { GetText } from './infrastructure/ai/tools/getText.js'

import { appendToChatMessages, createChat, getChat } from './shared/persistance-layer.js'

import { isValidUUID, uuidVersionValidation } from 'uuidv7-utilities'
import { FastifyUtil } from './shared/utils/fastify.utils.js'
import path from 'node:path'

// Create a singleton instance of GetText to preserve cache across requests
const getTextInstance = new GetText('data', 'heart-of-darkness.txt')

function processUserUUID(userInput: string | Buffer) {
  if (!isValidUUID(userInput)) {
    throw new Error('Invalid UUID format provided')
  }
  return uuidVersionValidation(userInput)
}

export const GET = async (req: FastifyRequest): Promise<Response> => {
  const url = new URL(req.url, `http://${req.hostname}`)

  const chatId = url.searchParams.get('id')

  if (!chatId) {
    return new Response('No chatId provided', { status: 400 })
  }

  const uuidVersion = processUserUUID(chatId)
  if (uuidVersion !== 'v7') {
    return new Response(`Invalid chatId provided ${uuidVersion}`, { status: 400 })
  }

  const chat = await getChat(chatId)

  if (!chat) {
    return new Response(`No chat data for ${chatId}`, { status: 400 })
  }

  return FastifyUtil.createResponse(
    JSON.stringify({ id: chatId, messages: chat.messages as UIMessage[] })
  )
}

export const POST = async (req: Request): Promise<Response> => {
  console.log('POST')
  const UIMessageSchema = z.object({
    id: z.string(),
    role: z.string(),
    content: z.string().optional(),
    name: z.string().optional(),
    parts: z.array(z.any()).optional(),
    trigger: z.string().optional(),
  })
  const RequestBodySchema = z.object({
    messages: z.array(UIMessageSchema),
    id: z.string(),
  })
  let parsed
  try {
    parsed = RequestBodySchema.parse(await req.json())
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: 'Invalid request body',
        details: e instanceof z.ZodError ? e.issues : e,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
  const { messages, id } = parsed

  let chat = await getChat(id)
  const mostRecentMessage = messages[messages.length - 1]

  if (!mostRecentMessage) {
    return new Response('No messages provided', { status: 400 })
  }

  if (mostRecentMessage.role !== 'user') {
    return new Response('Last message must be from the user', {
      status: 400,
    })
  }

  if (!chat) {
    await createChat(id, messages as UIMessage[])
  } else {
    await appendToChatMessages(id, [mostRecentMessage as UIMessage])
  }

  const SYSTEM_PROMPT = `You must respond in the same style of Charles Marlow the narrator in Joseph Conrad's The Heart of Darkness novella. Only answer factual questions about the novella when using the heartOfDarknessQA tool. Do not use other sources.`

  const result = streamText({
    model: google('gemini-2.0-flash-001'),
    messages: await convertToModelMessages(messages as UIMessage[]),
    system: ` ${SYSTEM_PROMPT}
      You have access to the following tools:
      - heartOfDarknessQA (for answering questions about the novella Heart of Darkness)
    `,
    tools: {
      heartOfDarknessQA: tool({
        description:
          'Answer questions about Joseph Conrad\'s novella "Heart of Darkness" using the full text of the book',
        inputSchema: z.object({
          question: z.string().describe('The question to answer about Heart of Darkness'),
        }),
        execute: async ({ question }) => {
          try {
            // Read the Heart of Darkness text file using the singleton instance
            const filePath = getTextInstance.filePath

            let heartOfDarknessText

            if (getTextInstance.hasCachedContent(filePath)) {
              heartOfDarknessText = getTextInstance.getCachedContent(filePath)
              console.log('CACHED')
            } else {
              heartOfDarknessText = await getTextInstance.getText()
              console.log('FROM FILE')
            }

            // Return the full text as context for the AI to use in answering
            return {
              question,
              textLength: heartOfDarknessText ? heartOfDarknessText.length : 0,
              context: heartOfDarknessText,
              instructions:
                'Use the provided full text of Heart of Darkness to answer the question comprehensively and accurately. Reference specific passages where relevant.',
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            throw new Error(`Error loading Heart of Darkness text: ${errorMessage}`)
          }
        },
      }),
    },
    stopWhen: [stepCountIs(10)],
    onChunk({ chunk }) {
      // Called for each partial piece of output
      if (chunk.type === 'text-delta') {
        process.stdout.write(chunk.text)
        // (Debugging) To log chunk text, use console.log or a logger. For production, do not output to stdout.
      }
      // you can also inspect chunk.reasoning / chunk.sources / etc.
    },
    onFinish({ finishReason, usage, totalUsage }) {
      // Called once when the full output is complete
      // console.log('\n--- DONE ---')
      // console.log('Full text:', text)
      // The reason the model finished generating the text.
      // "stop" | "length" | "content-filter" | "tool-calls" | "error" | "other" | "unknown"
      console.log('Finish reason:', finishReason)
      //usage
      console.log('Usage info:', usage, totalUsage)
      // use proper logging for production
      console.log('toUIMessageStreamResponse.onFinish')
      // Model messages (AssistantModelMessage or ToolModelMessage)
      // Minimal information, no UI data
      // Not suitable for UI applications
      console.log('  messages')
      console.dir(messages, { depth: null })
      // 'response.messages' is an array of ToolModelMessage and AssistantModelMessage,
      // which are the model messages that were generated during the stream.
      // This is useful if you don't need UIMessages - for simpler applications.
      // console.log('toUIMessageStreamResponse.onFinish')
      // console.log('  response')
      //    console.dir(response, { depth: null })
    },
    onError({ error }) {
      // use proper logging for production
      console.error('Stream error:', error)
    },
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages as UIMessage[],
    onFinish: async ({ responseMessage }) => {
      // 'messages' is the full message history, including the original messages
      // Includes original user message and assistant's response with all parts
      // Ideal for persisting entire conversations
      console.log('toUIMessageStreamResponse.onFinish')
      console.log('  messages')
      console.dir(messages, { depth: null })

      // Single message
      // Just the newly generated assistant message
      // Good for persisting only the latest response
      // console.log('toUIMessageStreamResponse.onFinish')
      // console.log('  responseMessage')
      // console.dir(responseMessage, { depth: null })
      await appendToChatMessages(id, [responseMessage])
    },
  })
}
