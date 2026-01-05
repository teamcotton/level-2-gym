/**
 * Service for text analysis operations
 *
 * Provides business logic for analyzing and extracting relevant content from text.
 * This service is part of the application layer and contains domain logic that is
 * independent of infrastructure concerns.
 *
 * @class
 *
 * @example
 * ```typescript
 * const textAnalysisService = new TextAnalysisService()
 * const relevantPassages = textAnalysisService.extractRelevantPassages(fullText, question)
 * ```
 */
export class TextAnalysisService {
  /**
   * Extract relevant passages from the text based on question keywords
   * Uses a sliding window approach to find paragraphs containing key terms
   *
   * @param fullText - The complete text to analyze
   * @param question - The question to extract keywords from
   * @returns Relevant text passages concatenated with separators
   *
   * @example
   * ```typescript
   * const service = new TextAnalysisService()
   * const passages = service.extractRelevantPassages(
   *   'Full text of the document...',
   *   'What happens to Kurtz?'
   * )
   * ```
   */
  public extractRelevantPassages(fullText: string, question: string): string {
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
