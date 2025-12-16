import { FileUtil } from '../../../shared/utils/file.util.js'

//const textPath = join(import.meta.dirname, '..', 'data', 'heart-of-darkness.txt')

/**
 * Class for managing text file retrieval with state management
 */
export class GetText {
  private readonly fileUtil: FileUtil
  private readonly fileContents: Map<string, string>

  /**
   * Create a new GetText instance
   * @param dataFolder - The data folder name (default: 'data')
   * @param dbName - The database directory name (default: 'file-system-db.local')
   */
  constructor(dataFolder: string = 'data', dbName: string = 'file-system-db.local') {
    this.fileUtil = new FileUtil(dataFolder, dbName)
    this.fileContents = new Map<string, string>()
  }

  /**
   * Get text content from a file
   * @param textPath - The relative path to the text file
   * @returns The file content as a string, or undefined if empty
   * @throws Error if file cannot be read
   */
  public async getText(textPath: string): Promise<string | undefined> {
    if (this.hasCachedContent(textPath)) {
      return this.getCachedContent(textPath)
    }
    const fileExists = this.fileUtil.readFile(textPath)
    if (fileExists.success && fileExists.content) {
      // Save the successfully retrieved content to state
      this.fileContents.set(textPath, fileExists.content)
      return fileExists.content
    }
    if (!fileExists.success) {
      throw new Error(`Error reading file "${textPath}": ${fileExists.message}`)
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
export async function getText(
  textPath: string,
  dataFolder: string,
  dbName: string
): Promise<string | undefined> {
  const getTextInstance = new GetText(dataFolder, dbName)
  return getTextInstance.getText(textPath)
}
