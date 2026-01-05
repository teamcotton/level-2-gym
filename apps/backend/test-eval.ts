import { streamText, type CoreUserMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { HeartOfDarknessTool } from './src/infrastructure/ai/tools/heart-of-darkness.tool.js'
import type { LoggerPort } from './src/application/ports/logger.port.js'
import { EnvConfig } from './src/infrastructure/config/env.config.js'

/**
 * Simple console logger for testing
 */
class SimpleLogger implements LoggerPort {
  info(message: string): void {
    console.log(`[INFO] ${message}`)
  }
  error(message: string): void {
    console.error(`[ERROR] ${message}`)
  }
  warn(message: string): void {
    console.warn(`[WARN] ${message}`)
  }
  debug(message: string): void {
    console.debug(`[DEBUG] ${message}`)
  }
}

async function testAgent() {
  console.log('Testing Heart of Darkness Agent...\n')

  const logger = new SimpleLogger()
  const heartOfDarknessTool = new HeartOfDarknessTool(logger)

  const question =
    'At the start of the novella, on which river is Marlow aboard the Nellie when he begins narrating his story?'

  const messages: CoreUserMessage[] = [
    {
      role: 'user',
      content: question,
    },
  ]

  const evalSystemPrompt = `You are an AI assistant that answers questions about Joseph Conrad's novella "Heart of Darkness". 
You have access to the heartOfDarknessQA tool which provides the full text of the novella. 
Use this tool to answer questions accurately by citing specific passages from the text.
Provide direct, concise answers based only on the text.`

  try {
    console.log('Question:', question)
    console.log('\nCalling agent...\n')

    const result = await streamText({
      model: google(EnvConfig.MODEL_NAME || 'ggemini-1.5-flash'),
      messages,
      system: evalSystemPrompt,
      tools: {
        heartOfDarknessQA: heartOfDarknessTool.getTool(),
      },
    })

    const answer = await result.text
    console.log('Answer:', answer)
    console.log('\n✓ Test passed!')
  } catch (error) {
    console.error('\n✗ Test failed:', error)
    process.exit(1)
  }
}

testAgent()
