// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true })

import { evalite } from 'evalite'
import { generateText, stepCountIs } from 'ai'
import type { ModelMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { HeartOfDarknessTool } from '../../src/infrastructure/ai/tools/heart-of-darkness.tool.js'
import type { LoggerPort } from '../../src/application/ports/logger.port.js'
import { SYSTEM_PROMPT } from '../../src/shared/constants/ai-constants.js'
/**
 * Simple console logger for eval tests
 */
class SimpleLogger implements LoggerPort {
  info(message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.log(`[INFO] ${message}`, meta)
    } else {
      console.log(`[INFO] ${message}`)
    }
  }
  error(message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.error(`[ERROR] ${message}`, meta)
    } else {
      console.error(`[ERROR] ${message}`)
    }
  }
  warn(message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.warn(`[WARN] ${message}`, meta)
    } else {
      console.warn(`[WARN] ${message}`)
    }
  }
  debug(message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.debug(`[DEBUG] ${message}`, meta)
    } else {
      console.debug(`[DEBUG] ${message}`)
    }
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
    const result = await generateText({
      model: google(process.env.MODEL_NAME || 'gemini-2.5-flash'),
      prompt: judgePrompt,
    })
    const text = result.text
    const score = parseFloat(text.trim())
    return isNaN(score) ? 0 : Math.max(0, Math.min(1, score))
  } catch (error) {
    console.error('LLM Judge error while scoring Heart of Darkness eval:', error)
    throw error
  }
}

/**
 * Get agent response
 */
async function getAgentResponse(question: string): Promise<string> {
  const logger = new SimpleLogger()
  const heartOfDarknessTool = new HeartOfDarknessTool(logger)

  const messages: ModelMessage[] = [
    {
      role: 'user',
      content: question,
    },
  ]

  // System prompt that forces tool usage for accurate answers from the text
  const evalSystemPrompt = SYSTEM_PROMPT

  try {
    const result = await generateText({
      model: google(process.env.MODEL_NAME || 'gemini-2.5-flash'),
      messages,
      system: evalSystemPrompt,
      tools: {
        heartOfDarknessQA: heartOfDarknessTool.getTool(),
      },
      stopWhen: stepCountIs(5),
    })

    const text = result.text

    if (!text || text.trim().length === 0) {
      throw new Error('Agent returned empty response')
    }

    return text
  } catch (error) {
    console.error('Agent error:', error)
    console.error('Question was:', question)
    throw error
  }
}

/**
 * Comprehensive English stopwords list for keyword filtering
 * These are common words that don't contribute meaningful semantic value
 */
const STOPWORDS = new Set([
  // Articles
  'the',
  'a',
  'an',
  // Pronouns
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'them',
  'their',
  'what',
  'which',
  'who',
  'whom',
  'this',
  'that',
  'these',
  'those',
  // Prepositions
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'from',
  'by',
  'about',
  'as',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'under',
  'over',
  'within',
  // Conjunctions
  'and',
  'but',
  'or',
  'nor',
  'so',
  'yet',
  'because',
  'although',
  'though',
  'while',
  'if',
  'when',
  'where',
  'how',
  'why',
  // Auxiliary verbs
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
  'will',
  'would',
  'shall',
  'should',
  'may',
  'might',
  'must',
  'can',
  'could',
  // Common verbs
  'get',
  'got',
  'make',
  'made',
  'take',
  'taken',
  'say',
  'said',
  'see',
  'seen',
  // Common adverbs
  'very',
  'also',
  'just',
  'only',
  'even',
  'now',
  'then',
  'here',
  'there',
  'well',
  'back',
  'out',
  'up',
  'down',
  'off',
  'more',
  'most',
  'other',
  'some',
  'such',
  // Other common words
  'all',
  'any',
  'both',
  'each',
  'few',
  'many',
  'no',
  'not',
  'own',
  'same',
  'than',
  'too',
  'use',
  'used',
  'way',
  // Common adjectives/descriptors
  'first',
  'last',
  'next',
  'previous',
  'following',
  'given',
  'certain',
  'particular',
  // Question/Answer specific stopwords
  'answer',
  'question',
  'include',
  'includes',
  'commonly',
  'assumed',
  'however',
  'explicitly',
  'never',
  'states',
  'stated',
  'placed',
  'surrounding',
  'named',
])

/**
 * Extracts meaningful keywords from text by:
 * 1. Converting to lowercase
 * 2. Removing possessives ('s and s')
 * 3. Removing punctuation
 * 4. Splitting into words
 * 5. Filtering out short words (< 4 chars)
 * 6. Filtering out common stopwords
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/'s?\b/g, '') // Remove possessives before other punctuation
    .replace(/[^\w\s]/g, ' ') // Replace remaining punctuation with spaces
    .split(/\s+/)
    .filter((word) => word.length >= 3) // Keep words with 4+ chars
    .filter((word) => !STOPWORDS.has(word)) // Remove stopwords
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

        const keyTerms = extractKeywords(expected)
        const outputKeywords = extractKeywords(output)

        // Use exact matching to avoid false positives from substring matches
        const matchedTerms = keyTerms.filter((term: string) => outputKeywords.includes(term))
        const keywordScore = keyTerms.length > 0 ? matchedTerms.length / keyTerms.length : 0

        return {
          score: keywordScore,
          passed: keywordScore >= 0.5,
        }
      },
    },
  ],
})
