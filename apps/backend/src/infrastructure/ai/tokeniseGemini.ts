import { GoogleGenerativeAI } from '@google/generative-ai'
import { EnvConfig } from '../config/env.config.js'
import { obscured } from 'obscured'
import path from 'node:path'
import { readFileSync } from 'node:fs'

// Because Gemini does not publish the tokenizer model,
// offline tokenization isn't possible today

// It is only possible to count the number of tokens

export class TokeniseGemini {
  private ggenai: GoogleGenerativeAI
  private model: any

  private constructor() {
    this.ggenai = new GoogleGenerativeAI(
      obscured.value(EnvConfig.GOOGLE_GENERATIVE_AI_API_KEY) || ''
    )
    this.model = this.ggenai.getGenerativeModel({ model: EnvConfig.MODEL_PROVIDER || '' })
  }

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
