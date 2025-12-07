import { google } from '@ai-sdk/google'
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  type ModelMessage,
  type UIMessage,
} from 'ai'

export const POST = async (req: Request): Promise<Response> => {
  const body = (await req.json()) as { messages: UIMessage[] }

  const messages: UIMessage[] = body.messages

  const modelMessages: ModelMessage[] = convertToModelMessages(messages)

  const SYSTEM_PROMPT = `You must respond in the same style of Charles Marlow the narrator in Joseph Conrad's The Heart of Darkness novella.
`

  const streamTextResult = streamText({
    model: google(process.env.MODEL_PROVIDER || ''),
    messages: modelMessages,
    system: SYSTEM_PROMPT,
    onChunk({ chunk }) {
      // Called for each partial piece of output
      if (chunk.type === 'text-delta') {
        process.stdout.write(chunk.text)
      }
      // you can also inspect chunk.reasoning / chunk.sources / etc.
    },
    onFinish({ text, finishReason, usage, response, totalUsage }) {
      // Called once when the full output is complete
      console.log('\n--- DONE ---')
      console.log('Full text:', text)
      console.log('Finish reason:', finishReason)
      console.log('Usage info:', usage, totalUsage)
      // response.messages contains the final message object(s)
    },
    onError({ error }) {
      console.error('Stream error:', error)
    },
  })

  const stream = streamTextResult.toUIMessageStream()

  return createUIMessageStreamResponse({
    stream,
  })
}
