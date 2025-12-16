import { google } from '@ai-sdk/google'
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  stepCountIs,
  tool,
  type ModelMessage,
  type UIMessage,
} from 'ai'
import { z } from 'zod'
import { FileUtil } from './shared/utils/file.util.js'

import { isValidUUID, uuidVersionValidation } from 'uuidv7-utilities'

function processUserUUID(userInput: string | Buffer) {
  if (!isValidUUID(userInput)) {
    throw new Error('Invalid UUID format provided')
  }
  return uuidVersionValidation(userInput)
}

const fileSystemTools = new FileUtil('data', 'file-system-db.local')

export const GET = async (
  req: Request
): Promise<Response | { id: string; messages: UIMessage[] }> => {
  const url = new URL(req.url)
  const chatId = url.searchParams.get('id')
  if (!chatId) {
    return new Response('No chatId provided', { status: 400 })
  }
  if (processUserUUID(chatId) !== 'v7') {
    return new Response('Invalid chatId provided', { status: 400 })
  }
  return { id: chatId, messages: [] as UIMessage[] }
}

export const POST = async (req: Request): Promise<Response> => {
  const body = (await req.json()) as { messages: UIMessage[]; id: string }

  const messages: UIMessage[] = body.messages
  const id = body.id

  const modelMessages: ModelMessage[] = convertToModelMessages(messages)

  const SYSTEM_PROMPT = `You must respond in the same style of Charles Marlow the narrator in Joseph Conrad's The Heart of Darkness novella. Only answer factual questions about the novella when using the heartOfDarknessQA tool. Do not use other sources.
`
  const streamTextResult = streamText({
    model: google(process.env.MODEL_NAME || ''),
    messages: modelMessages,
    system: ` ${SYSTEM_PROMPT}
      You are a helpful assistant that can use a sandboxed file system to create, edit and delete files.
      
      You also have access to the full text of Joseph Conrad's "Heart of Darkness" and can answer detailed questions about the novella using the heartOfDarknessQA tool.

      You have access to the following tools:
      - writeFile
      - readFile
      - deletePath
      - listDirectory
      - createDirectory
      - exists
      - searchFiles
      - heartOfDarknessQA (for answering questions about the novella Heart of Darkness)

      Use these tools to record notes, create todo lists, and edit documents for the user.

      Use markdown files to store information.
    `,
    tools: {
      writeFile: tool({
        description: 'Write to a file',
        inputSchema: z.object({
          path: z.string().describe('The path to the file to create'),
          content: z.string().describe('The content of the file to create'),
        }),
        execute: async ({ path, content }) => {
          return fileSystemTools.writeFile(path, content)
        },
      }),
      readFile: tool({
        description: 'Read a file',
        inputSchema: z.object({
          path: z.string().describe('The path to the file to read'),
        }),
        execute: async ({ path }) => {
          return fileSystemTools.readFile(path)
        },
      }),
      deletePath: tool({
        description: 'Delete a file or directory',
        inputSchema: z.object({
          path: z.string().describe('The path to the file or directory to delete'),
        }),
        execute: async ({ path }) => {
          return fileSystemTools.deletePath(path)
        },
      }),
      listDirectory: tool({
        description: 'List a directory',
        inputSchema: z.object({
          path: z.string().describe('The path to the directory to list'),
        }),
        execute: async ({ path }) => {
          return fileSystemTools.listDirectory(path)
        },
      }),
      createDirectory: tool({
        description: 'Create a directory',
        inputSchema: z.object({
          path: z.string().describe('The path to the directory to create'),
        }),
        execute: async ({ path }) => {
          return fileSystemTools.createDirectory(path)
        },
      }),
      exists: tool({
        description: 'Check if a file or directory exists',
        inputSchema: z.object({
          path: z.string().describe('The path to the file or directory to check'),
        }),
        execute: async ({ path }) => {
          return fileSystemTools.exists(path)
        },
      }),
      searchFiles: tool({
        description: 'Search for files',
        inputSchema: z.object({
          pattern: z.string().describe('The pattern to search for'),
        }),
        execute: async ({ pattern }) => {
          return fileSystemTools.searchFiles(pattern)
        },
      }),
      heartOfDarknessQA: tool({
        description:
          'Answer questions about Joseph Conrad\'s novella "Heart of Darkness" using the full text of the book',
        inputSchema: z.object({
          question: z.string().describe('The question to answer about Heart of Darkness'),
        }),
        execute: async ({ question }) => {
          const { readFile } = await import('fs/promises')
          const { join } = await import('path')

          // Simple list of English stopwords for keyword extraction
          const STOPWORDS = new Set([
            'the',
            'and',
            'a',
            'an',
            'of',
            'to',
            'in',
            'on',
            'for',
            'with',
            'at',
            'by',
            'from',
            'up',
            'about',
            'into',
            'over',
            'after',
            'under',
            'above',
            'below',
            'is',
            'are',
            'was',
            'were',
            'be',
            'been',
            'being',
            'have',
            'has',
            'had',
            'do',
            'does',
            'did',
            'but',
            'if',
            'or',
            'because',
            'as',
            'until',
            'while',
            'can',
            'will',
            'just',
            'should',
            'could',
            'would',
            'may',
            'might',
            'so',
            'than',
            'too',
            'very',
            'this',
            'that',
            'these',
            'those',
            'i',
            'you',
            'he',
            'she',
            'it',
            'we',
            'they',
            'them',
            'his',
            'her',
            'their',
            'our',
            'your',
            'my',
            'me',
            'him',
            'who',
            'whom',
            'which',
            'what',
            'when',
            'where',
            'why',
            'how',
          ])

          function extractKeywords(text: string): string[] {
            return text
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, ' ')
              .split(/\s+/)
              .filter((word) => word && !STOPWORDS.has(word))
          }

          try {
            // Read the Heart of Darkness text file
            const textPath = join(import.meta.dirname, '..', 'data', 'heart-of-darkness.txt')
            const heartOfDarknessText = await readFile(textPath, 'utf-8')

            // Split text into paragraphs (by double newlines)
            const paragraphs = heartOfDarknessText.split(/\n\s*\n/)

            // Extract keywords from the question
            const questionKeywords = extractKeywords(question)

            // Score each paragraph by number of keyword matches
            const scoredParagraphs = paragraphs.map((para, idx) => {
              const paraWords = extractKeywords(para)
              const matchCount = questionKeywords.reduce(
                (count, kw) => count + (paraWords.includes(kw) ? 1 : 0),
                0
              )
              return { idx, para, matchCount }
            })

            // Sort paragraphs by matchCount descending, then by length descending
            scoredParagraphs.sort((a, b) => {
              if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount
              return b.para.length - a.para.length
            })

            // Select top 3 relevant paragraphs (or fewer if not enough)
            const topParagraphs = scoredParagraphs.slice(0, 3).filter((p) => p.matchCount > 0)

            // If no relevant paragraphs found, fall back to the first paragraph
            const contextParagraphs =
              topParagraphs.length > 0 ? topParagraphs.map((p) => p.para) : [paragraphs[0]]

            return {
              question,
              context: contextParagraphs,
              contextParagraphCount: contextParagraphs.length,
              instructions:
                'Use only the provided relevant excerpts from Heart of Darkness to answer the question. Reference the excerpts where appropriate.',
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
    onFinish({ text, finishReason, usage, response, totalUsage }) {
      // Called once when the full output is complete
      console.log('\n--- DONE ---')
      console.log('Full text:', text)
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
      console.log('toUIMessageStreamResponse.onFinish')
      console.log('  response')
      console.dir(response, { depth: null })
    },
    onError({ error }) {
      // use proper logging for production
      console.error('Stream error:', error)
    },
  })

  return streamTextResult.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages, responseMessage }) => {
      // 'messages' is the full message history, including the original messages
      // Includes original user message and assistant's response with all parts
      // Ideal for persisting entire conversations
      console.log('toUIMessageStreamResponse.onFinish')
      console.log('  messages')
      console.dir(messages, { depth: null })

      // Single message
      // Just the newly generated assistant message
      // Good for persisting only the latest response
      console.log('toUIMessageStreamResponse.onFinish')
      console.log('  responseMessage')
      console.dir(responseMessage, { depth: null })
    },
  })

  /// streaming
  /*const stream = streamTextResult.toUIMessageStream()

  return createUIMessageStreamResponse({
    stream,
  })*/
}
