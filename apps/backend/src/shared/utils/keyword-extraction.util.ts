/**
 * Utility for extracting meaningful keywords from text.
 *
 * This module provides tools for text analysis and keyword extraction,
 * commonly used for natural language processing tasks like question answering,
 * search, and content matching.
 *
 * @example
 * ```typescript
 * import { KeywordExtractionUtil } from './keyword-extraction.util'
 *
 * const text = "What is Marlow's role in Heart of Darkness?"
 * const keywords = KeywordExtractionUtil.extractKeywords(text)
 * // Returns: ['marlow', 'role', 'heart', 'darkness']
 * ```
 */

/**
 * Comprehensive set of English stopwords (common words to filter out).
 *
 * These words are typically not useful for keyword extraction as they:
 * - Appear frequently in most texts
 * - Carry little semantic meaning on their own
 * - Include articles, pronouns, prepositions, conjunctions, auxiliary verbs, etc.
 *
 * Used to filter out non-meaningful words during keyword extraction.
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
 * Minimum word length for keyword extraction.
 * Words shorter than this are filtered out as they typically
 * don't carry significant semantic meaning.
 *
 * This value (4) was determined through eval testing to optimize
 * keyword matching accuracy while filtering out noise words.
 * See commit efe7b45 for comprehensive stopword filtering implementation.
 */
const MIN_WORD_LENGTH = 4

/**
 * Utility class for keyword extraction operations.
 * All methods are static and can be used without instantiation.
 */
export class KeywordExtractionUtil {
  /**
   * Extracts meaningful keywords from text by performing the following operations:
   * 1. Converts text to lowercase for case-insensitive matching
   * 2. Removes possessives ('s and s') to normalize word forms
   * 3. Removes punctuation, replacing it with spaces
   * 4. Splits text into individual words
   * 5. Filters out short words (less than 4 characters)
   * 6. Filters out common stopwords (articles, pronouns, etc.)
   *
   * This extraction method is designed to identify the most semantically meaningful
   * words in a text while filtering out noise and common words.
   *
   * @param text - The input text to extract keywords from
   * @returns An array of extracted keywords (lowercased, normalized)
   *
   * @example
   * ```typescript
   * // Basic keyword extraction
   * KeywordExtractionUtil.extractKeywords("What is Marlow's role?")
   * // Returns: ['marlow', 'role']
   *
   * // Handles possessives
   * KeywordExtractionUtil.extractKeywords("Conrad's novel")
   * // Returns: ['conrad', 'novel']
   *
   * // Filters short words and stopwords
   * KeywordExtractionUtil.extractKeywords("The river is very long")
   * // Returns: ['river', 'long']
   *
   * // Removes punctuation
   * KeywordExtractionUtil.extractKeywords("Hello, world!")
   * // Returns: ['hello', 'world']
   * ```
   */
  static extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/'s?\b/g, '') // Remove possessives before other punctuation
      .replace(/[^\w\s]/g, ' ') // Replace remaining punctuation with spaces
      .split(/\s+/)
      .filter((word) => word.length >= MIN_WORD_LENGTH) // Keep words with MIN_WORD_LENGTH+ chars
      .filter((word) => !STOPWORDS.has(word)) // Remove stopwords
  }

  /**
   * Gets the set of stopwords used for filtering.
   *
   * This method provides read-only access to the stopwords set,
   * useful for testing or custom keyword extraction logic.
   * Returns a new Set to ensure immutability and prevent external mutations.
   *
   * @returns A Set containing all stopwords
   *
   * @example
   * ```typescript
   * const stopwords = KeywordExtractionUtil.getStopwords()
   * stopwords.has('the') // true
   * stopwords.has('important') // false
   * ```
   */
  static getStopwords(): ReadonlySet<string> {
    return new Set(STOPWORDS)
  }
}
