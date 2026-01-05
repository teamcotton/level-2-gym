import { tool, type InferToolInput, type InferToolOutput } from 'ai'
import { z } from 'zod'
import { GetTextUseCase } from '../../../application/use-cases/get-text.use-case.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'

/**
 * AI tool for answering questions about Joseph Conrad's "Heart of Darkness"
 *
 * Provides access to the full text of the novella with caching for performance.
 *
 * @class
 *
 * @example
 * ```typescript
 * const logger = new ConsoleLogger()
 * const heartOfDarknessTool = new HeartOfDarkness(logger)
 * const tool = heartOfDarknessTool.getTool()
 * ```
 */
export class HeartOfDarknessTool {
  private readonly getTextUseCase: GetTextUseCase
  private readonly logger: LoggerPort

  constructor(logger: LoggerPort) {
    this.logger = logger
    this.getTextUseCase = new GetTextUseCase('data', 'heart-of-darkness.txt')
  }

  /**
   * Get the AI tool definition
   *
   * @returns The configured AI tool
   */
  public getTool() {
    return tool({
      description:
        'Answer questions about Joseph Conrad\'s novella "Heart of Darkness" using the full text of the book',
      inputSchema: z.object({
        question: z.string().describe('The question to answer about Heart of Darkness'),
      }),
      execute: async ({ question }) => {
        try {
          // Read the Heart of Darkness text file using the use case instance
          const filePath = this.getTextUseCase.filePath

          let heartOfDarknessText

          if (this.getTextUseCase.hasCachedContent(filePath)) {
            heartOfDarknessText = this.getTextUseCase.getCachedContent(filePath)
            this.logger.info('Heart of Darkness text loaded from cache')
          } else {
            heartOfDarknessText = await this.getTextUseCase.execute()
            this.logger.info('Heart of Darkness text loaded from file')
          }

          if (!heartOfDarknessText) {
            throw new Error('Failed to load Heart of Darkness text')
          }

          // Extract relevant passages based on question keywords
          const relevantContext = this.extractRelevantPassages(heartOfDarknessText, question)

          // Return extracted context for the AI to use in answering
          return {
            question,
            textLength: heartOfDarknessText.length,
            contextLength: relevantContext.length,
            context: relevantContext,
            instructions:
              'Use the provided text passages from Heart of Darkness to answer the question. These are the most relevant sections based on your question.',
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          this.logger.error(`Error loading Heart of Darkness text: ${errorMessage}`)
          throw new Error(`Error loading Heart of Darkness text: ${errorMessage}`)
        }
      },
    })
  }

  /**
   * Extract relevant passages from the text based on question keywords
   * Uses a sliding window approach to find paragraphs containing key terms
   */
  private extractRelevantPassages(fullText: string, question: string): string {
    const MAX_CONTEXT_LENGTH = 25000 // ~6,000 tokens - allow more context for accurate answers
    const PASSAGE_WINDOW = 1500 // Characters around each match

    // Extract meaningful keywords from the question (exclude common words)
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'is',
      'are',
      'was',
      'were',
      'what',
      'which',
      'who',
      'whom',
      'when',
      'where',
      'why',
      'how',
      'does',
      'do',
      'did',
      'has',
      'have',
      'had',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'about',
      'into',
      'during',
      'his',
      'her',
      'their',
      'its',
      'that',
      'this',
      'these',
      'those',
      'and',
      'or',
      'but',
      'if',
      'then',
      'else',
      'just',
      'before',
      'after',
      'upriver',
      'start',
      'begins',
      'narrating',
      'story',
      'novella',
    ])

    const keywords = question
      .toLowerCase()
      .replace(/[?.,!]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))

    // Add domain-specific keywords based on question content
    const additionalKeywords: string[] = []
    if (question.toLowerCase().includes('river')) {
      additionalKeywords.push('thames', 'congo', 'river', 'water')
    }
    if (question.toLowerCase().includes('position') || question.toLowerCase().includes('hired')) {
      additionalKeywords.push('captain', 'steamboat', 'command', 'skipper', 'appointed')
    }
    if (question.toLowerCase().includes('kurtz')) {
      additionalKeywords.push('kurtz', 'ivory', 'station', 'agent')
    }
    if (question.toLowerCase().includes('death') || question.toLowerCase().includes('words')) {
      additionalKeywords.push('horror', 'died', 'death', 'last', 'whispered')
    }
    if (question.toLowerCase().includes('attack')) {
      additionalKeywords.push('arrows', 'natives', 'spears', 'attack', 'savages')
    }
    if (question.toLowerCase().includes('repair') || question.toLowerCase().includes('steamboat')) {
      additionalKeywords.push('rivets', 'repair', 'boiler', 'steam', 'wreck')
    }
    if (question.toLowerCase().includes('poles') || question.toLowerCase().includes('station')) {
      additionalKeywords.push('heads', 'skulls', 'poles', 'ornamental')
    }

    const allKeywords = [...new Set([...keywords, ...additionalKeywords])]

    // Find passages containing keywords
    const passages: { start: number; end: number; score: number }[] = []
    const textLower = fullText.toLowerCase()

    for (const keyword of allKeywords) {
      let searchStart = 0
      while (searchStart < textLower.length) {
        const idx = textLower.indexOf(keyword, searchStart)
        if (idx === -1) break

        const start = Math.max(0, idx - PASSAGE_WINDOW / 2)
        const end = Math.min(fullText.length, idx + keyword.length + PASSAGE_WINDOW / 2)

        // Check if this overlaps with existing passages
        let merged = false
        for (const existing of passages) {
          if (start <= existing.end && end >= existing.start) {
            existing.start = Math.min(existing.start, start)
            existing.end = Math.max(existing.end, end)
            existing.score += 1
            merged = true
            break
          }
        }

        if (!merged) {
          passages.push({ start, end, score: 1 })
        }

        searchStart = idx + keyword.length
      }
    }

    // Sort by score (most keyword matches first) then by position
    passages.sort((a, b) => b.score - a.score || a.start - b.start)

    // Collect passages up to max length
    let result = ''
    const usedRanges: { start: number; end: number }[] = []

    for (const passage of passages) {
      // Skip if overlaps with already used range
      const overlaps = usedRanges.some(
        (used) => passage.start < used.end && passage.end > used.start
      )
      if (overlaps) continue

      const passageText = fullText.substring(passage.start, passage.end).trim()

      if (result.length + passageText.length + 10 > MAX_CONTEXT_LENGTH) {
        break
      }

      result += '\n\n---\n\n' + passageText
      usedRanges.push({ start: passage.start, end: passage.end })
    }

    // If no passages found, return the beginning and end of the text
    if (result.length === 0) {
      const beginning = fullText.substring(0, MAX_CONTEXT_LENGTH / 2)
      const ending = fullText.substring(fullText.length - MAX_CONTEXT_LENGTH / 2)
      result = beginning + '\n\n[...]\n\n' + ending
    }

    return result.trim()
  }
}

export type HeartOfDarknessInput = InferToolInput<ReturnType<HeartOfDarknessTool['getTool']>>
export type HeartOfDarknessOutput = InferToolOutput<ReturnType<HeartOfDarknessTool['getTool']>>
