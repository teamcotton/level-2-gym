import * as fs from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'

//const textPath = join(import.meta.dirname, '..', 'data', 'heart-of-darkness.txt')
const FileExtensionSchema = z.string().regex(/\.(txt|csv|json|toon|onnx|safetensors|pt|py|gguf)$/i)

type FilePathSchema = z.infer<typeof FileExtensionSchema>

/**
 * Class for managing text file retrieval with state management
 */
export class GetText {
  private readonly fileContents: Map<string, string>
  private readonly file: string
  public readonly filePath: string

  /**
   * Create a new GetText instance
   * @param dataFolder - The data folder name (id: 'data')
   * @param filePath - The file name to read (id: 'heart-of-darkness.txt')
   */
  constructor(dataFolder: string, filePath: FilePathSchema) {
    try {
      FileExtensionSchema.parse(filePath)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues
      }
    }
    this.file = filePath
    this.filePath = path.join(process.cwd(), dataFolder, filePath)
    this.fileContents = new Map<string, string>()
  }

  /**
   * Get text content from a file
   * @returns The file content as a string, or undefined if empty
   * @throws Error if file cannot be read
   */
  public async getText(): Promise<string | undefined> {
    try {
      // Read file content - will throw ENOENT if file doesn't exist
      const content = await fs.readFile(this.filePath, 'utf8')

      // Return undefined if content is empty
      if (!content) {
        return undefined
      }

      // Save the successfully retrieved content to state
      this.fileContents.set(this.filePath, content)
      return content
    } catch (error) {
      // Handle file not found error
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === 'ENOENT') {
        throw new Error(`Error reading file "${this.filePath}": File not found: ${this.file}`)
      }
      // Handle other errors
      throw new Error(
        `Error reading file "${this.filePath}": ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get cached file content from state
   * @param textPath - The relative path to the text file
   * @returns The cached file content, or undefined if not in cache
   */
  public getCachedContent(textPath: string): string | undefined {
    return this.fileContents.get(textPath)
  }

  /**
   * Check if a file's content is cached
   * @param textPath - The relative path to the text file
   * @returns True if the file content is cached
   */
  public hasCachedContent(textPath: string): boolean {
    return this.fileContents.has(textPath)
  }

  /**
   * Clear cached content for a specific file or all files
   * @param textPath - Optional path to clear specific file, or clear all if not provided
   */
  public clearCache(textPath?: string): void {
    if (textPath) {
      this.fileContents.delete(textPath)
    } else {
      this.fileContents.clear()
    }
  }

  /**
   * Get all cached file paths
   * @returns Array of cached file paths
   */
  public getCachedPaths(): string[] {
    return Array.from(this.fileContents.keys())
  }
}

// Legacy function export for backward compatibility
export async function getText(textPath: string, dataFolder: string): Promise<string | undefined> {
  const getTextInstance = new GetText(dataFolder, textPath)
  return getTextInstance.getText()
}
