import { Tiktoken } from 'js-tiktoken/lite'
import o200k_base from 'js-tiktoken/ranks/o200k_base'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

/**
 * @class TokeniseOpenAI
 * @classDesc Singleton class for tokenizing content using OpenAI's o200k_base tokenizer.
 *
 * This class is a singleton to ensure only one instance of the tokenizer is created.
 * The tokenizer is created on first use and cached for future use.
 *
 * IMPORTANT: This class uses synchronous file I/O to read the file contents.
 * It is recommended to use this class in a separate process to avoid blocking the main thread.
 * IMPORTANT: Singletons do not play nicely in dependency injection frameworks,
 * so this class should not be injected into other classes. Consider using a factory pattern instead.
 * Or Change this to a regular class
 * The reason I choose a Singleton is to avoid the overhead of creating multiple tokenizer instances,
 * apparently there is a .free() method that can be called to free up memory, but it doesn't
 * seem to be a feature
 *
 * @example
 * ```typescript
 * const tokenizer = TokeniseOpenAI.getInstance()
 *
 * // Tokenize content directly
 * const tokens1 = tokenizer.tokeniseContent('Hello, world!')
 *
 * // Tokenize file with full path and base directory validation
 * const tokens2 = tokenizer.tokeniseFile('/path/to/file.txt', '/allowed/base/dir')
 *
 * console.log(`Token count: ${tokens1.length}`)
 * ```
 */
class TokeniseOpenAI {
  private static instance: TokeniseOpenAI
  private tokenizer: Tiktoken

  private constructor() {
    this.tokenizer = new Tiktoken(o200k_base)
  }

  /**
   * Gets the singleton instance of TokeniseOpenAI.
   *
   * @returns The singleton instance
   */
  public static getInstance(): TokeniseOpenAI {
    if (!TokeniseOpenAI.instance) {
      TokeniseOpenAI.instance = new TokeniseOpenAI()
    }
    return TokeniseOpenAI.instance
  }

  /**
   * Tokenizes text content directly using OpenAI's o200k_base tokenizer.
   *
   * @param content - The text content to tokenize
   * @returns An array of token IDs
   * @throws {Error} If tokenization fails
   */
  public tokeniseContent(content: string): number[] {
    try {
      return this.tokenizer.encode(content)
    } catch (error) {
      throw new ValidationException(
        'Invalid file path: paths cannot contain directory traversal (..), forward slashes (/), or backslashes (\\). Only filenames in the current directory are allowed.'
      )
    }
  }

  /**
   * Tokenizes the content of a file using OpenAI's o200k_base tokenizer.
   *
   * @param filePath - The absolute or relative file path
   * @param baseDir - Optional base directory to validate the file path against.
   *                  If provided, the resolved file path must be within this directory.
   * @returns An array of token IDs
   * @throws {Error} If the file cannot be read, path validation fails, or tokenization fails
   */
  public tokeniseFile(filePath: string, baseDir?: string): number[] {
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

    // Let tokenization errors propagate as-is
    return this.tokeniseContent(input)
  }
}

export { TokeniseOpenAI }
