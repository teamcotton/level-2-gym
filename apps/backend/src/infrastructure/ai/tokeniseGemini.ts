import { GoogleGenerativeAI } from '@google/generative-ai'
import { EnvConfig } from '../config/env.config.js'
import { obscured } from 'obscured'
import path from 'node:path'
import { readFileSync } from 'node:fs'

// Because Gemini does not publish the tokenizer model,
// offline tokenization isn't possible today

// It is only possible to count the number of tokens

/**
 * @class TokeniseGemini
 * @classDesc Singleton class for counting tokens using Google's Gemini API.
 *
 * This class is a singleton to ensure only one instance of the Gemini client is created.
 * The client is created on first use and cached for future use.
 *
 * IMPORTANT: This class uses synchronous file I/O to read the file contents.
 * It is recommended to use this class in a separate process to avoid blocking the main thread.
 * IMPORTANT: Singletons do not play nicely in dependency injection frameworks,
 * so this class should not be injected into other classes. Consider using a factory pattern instead.
 * Or Change this to a regular class
 *
 * @example
 * ```typescript
 * const tokenizer = TokeniseGemini.getInstance()
 *
 * // Count tokens in a file with full path and base directory validation
 * const count = await tokenizer.count('/path/to/file.txt', '/allowed/base/dir')
 *
 * console.log(`Token count: ${count}`)
 * ```
 */
export class TokeniseGemini {
  private static instance: TokeniseGemini
  private ggenai: GoogleGenerativeAI
  private model: any

  private constructor() {
    this.ggenai = new GoogleGenerativeAI(
      obscured.value(EnvConfig.GOOGLE_GENERATIVE_AI_API_KEY) || ''
    )
    this.model = this.ggenai.getGenerativeModel({ model: EnvConfig.MODEL_PROVIDER || '' })
  }

  /**
   * Gets the singleton instance of TokeniseGemini.
   *
   * @returns The singleton instance
   */
  public static getInstance(): TokeniseGemini {
    if (!TokeniseGemini.instance) {
      TokeniseGemini.instance = new TokeniseGemini()
    }
    return TokeniseGemini.instance
  }

  /**
   * Counts the number of tokens in a file using Google's Gemini API.
   *
   * @param filePath - The absolute or relative file path
   * @param baseDir - Optional base directory to validate the file path against.
   *                  If provided, the resolved file path must be within this directory.
   * @returns A promise that resolves to the number of tokens
   * @throws {Error} If the file cannot be read, path validation fails, or token counting fails
   */
  async count(filePath: string, baseDir?: string): Promise<number> {
    // Resolve to absolute path
    const resolvedPath = path.resolve(filePath)

    // If baseDir is provided, validate that the file is within the base directory
    if (baseDir) {
      const resolvedBaseDir = path.resolve(baseDir)

      // Use path.relative to check for path traversal
      const relativePath = path.relative(resolvedBaseDir, resolvedPath)

      // If the relative path starts with '..' or is absolute, the file is outside baseDir
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error(
          `File path "${filePath}" is outside the allowed base directory "${baseDir}"`
        )
      }
    }

    // Read the file - wrap only file I/O errors
    let input: string
    try {
      input = readFileSync(resolvedPath, 'utf-8')
    } catch (error) {
      throw new Error(
        `Failed to read file "${filePath}": ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    const { totalTokens } = await this.model.countTokens({
      contents: [{ role: 'user', parts: [{ text: input }] }],
    })

    return totalTokens.length
  }
}
