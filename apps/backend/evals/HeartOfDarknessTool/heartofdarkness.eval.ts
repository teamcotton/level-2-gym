import { evalite } from 'evalite'
import { streamText, type CoreUserMessage, stepCountIs } from 'ai'
import { google } from '@ai-sdk/google'
import { HeartOfDarknessTool } from '../../src/infrastructure/ai/tools/heart-of-darkness.tool.js'
import { SYSTEM_PROMPT } from '../../src/shared/constants/ai-constants.js'
import type { LoggerPort } from '../../src/application/ports/logger.port.js'
import { EnvConfig } from '../../src/infrastructure/config/env.config.js'

/**
 * Simple console logger for eval tests
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

/**
 * Eval test cases for Heart of Darkness agent
 */
const testCases = [
  {
    question:
      'At the start of the novella, on which river is Marlow aboard the Nellie when he begins narrating his story?',
    expectedAnswer: 'Answer must include the Thames River',
  },
  {
    question: 'What position is Marlow hired to fill by the Company?',
    expectedAnswer: 'Captain of a steamboat',
  },
  {
    question: 'What African river does Marlow travel upriver on during his assignment?',
    expectedAnswer:
      'It is commonly assumed that it is the Congo River. However, the Congo River is never explicitly named in the novella.',
  },
  {
    question:
      'What specific problem prevents Marlow from immediately taking command of his steamboat?',
    expectedAnswer: 'The previous captain has been killed by natives.',
  },
  {
    question: 'What item does Marlow say he needs in order to repair the steamboat?',
    expectedAnswer: 'Rivets',
  },
  {
    question: "What is Kurtz's job title within the Company?",
    expectedAnswer: "Kurtz's job title within the Company is a first-class agent.",
  },
  {
    question: "What object is placed on poles surrounding Kurtz's station?",
    expectedAnswer: "The object placed on the poles surrounding Kurtz's station was human heads.",
  },
  {
    question: "Who attacks Marlow's steamboat during the upriver journey?",
    expectedAnswer:
      'The novella states that the steamboat was attacked by the natives during the upriver journey.',
  },
  {
    question: 'What exact words does Kurtz speak just before his death?',
    expectedAnswer: 'Kurtz last words are "The horror! The horror!"',
  },
]

/**
 * LLM-as-Judge scorer
 */
async function llmJudgeScorer(input: string, output: string, expected: string): Promise<number> {
  const judgePrompt = `You are an expert evaluator assessing AI answers about "Heart of Darkness".

Question: ${input}
Expected: ${expected}
Agent Answer: ${output}

Evaluate accuracy (0.0-1.0):
1.0 = Perfect, 0.75 = Good, 0.5 = Acceptable, 0.25 = Poor, 0.0 = Wrong

Respond with ONLY a number.`

  try {
    const result = streamText({
      model: google(EnvConfig.MODEL_NAME || 'gemini-2.0-flash-exp'),
      prompt: judgePrompt,
    })
    const text = await result.text
    const score = parseFloat(text.trim())
    return isNaN(score) ? 0 : Math.max(0, Math.min(1, score))
  } catch (error) {
    console.error('LLM Judge error:', error)
    return 0
  }
}

/**
 * Get agent response
 */
async function getAgentResponse(question: string): Promise<string> {
  const logger = new SimpleLogger()
  const heartOfDarknessTool = new HeartOfDarknessTool(logger)

  const messages: CoreUserMessage[] = [
    {
      role: 'user',
      content: question,
    },
  ]

  try {
    const result = streamText({
      model: google(EnvConfig.MODEL_NAME || 'gemini-2.0-flash-exp'),
      messages,
      system: SYSTEM_PROMPT,
      tools: {
        heartOfDarknessQA: heartOfDarknessTool.getTool(),
      },
      stopWhen: [stepCountIs(10)],
    })

    return await result.text
  } catch (error) {
    console.error('Agent error:', error)
    throw error
  }
}

/**
 * Evalite test suite
 */
evalite('Heart of Darkness Agent Accuracy', {
  data: async () => {
    return testCases.map((testCase) => ({
      input: testCase.question,
      expected: testCase.expectedAnswer,
    }))
  },
  task: async (input: string) => {
    return await getAgentResponse(input)
  },
  scorers: [
    {
      name: 'LLM Judge Accuracy',
      scorer: async ({ input, output, expected }) => {
        if (!expected) return { score: 0, passed: false }
        const score = await llmJudgeScorer(input, output, expected)
        return {
          score,
          passed: score >= 0.75,
        }
      },
    },
    {
      name: 'Keyword Match',
      scorer: ({ input, output, expected }) => {
        if (!expected) return { score: 0, passed: false }

        const keyTerms = expected
          .toLowerCase()
          .split(/\s+/)
          .filter((word: string) => word.length > 3)
          .filter(
            (word: string) => !['that', 'this', 'with', 'from', 'answer', 'must'].includes(word)
          )

        const outputLower = output.toLowerCase()
        const matchedTerms = keyTerms.filter((term: string) => outputLower.includes(term))
        const keywordScore = keyTerms.length > 0 ? matchedTerms.length / keyTerms.length : 0

        return {
          score: keywordScore,
          passed: keywordScore >= 0.5,
        }
      },
    },
  ],
})
