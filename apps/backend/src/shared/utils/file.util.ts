import * as fs from 'fs'
import * as path from 'path'
import { ValidationException } from '../exceptions/validation.exception.js'

/**
 * Utility class for file system operations
 * Provides methods for reading, writing, deleting, and searching files within a controlled directory
 */
export class FileUtil {
  private readonly baseDir: string

  /**
   * Create a new FileUtil instance
   * @param dbName - The flat file database directory name (default: 'file-system-db.local')
   * @param dataFolder - The base data folder (default: 'data')
   */
  constructor(dataFolder: string = 'data', dbName: string = 'file-system-db.local') {
    this.baseDir = path.join(process.cwd(), dataFolder, dbName)
  }
  //path.join(process.cwd(), dataFolder, dbName)
  //join(import.meta.dirname, '..', 'data', 'heart-of-darkness.txt')
  /**
   * Ensure the base directory exists
   */
  private ensureBaseDir(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true })
    }
  }

  /**
   * Validate that a path is within the allowed directory
   */
  private validatePath(filePath: string): string {
    const normalizedPath = path.normalize(filePath)
    const fullPath = path.resolve(this.baseDir, normalizedPath)
    const baseDirResolved = path.resolve(this.baseDir)

    const relativePath = path.relative(baseDirResolved, fullPath)
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new ValidationException(
        `Access denied: Path "${filePath}" is outside the allowed directory`
      )
    }

    return fullPath
  }

  /**
   * Get relative path from base directory
   */
  private getRelativePath(fullPath: string): string {
    const baseDirResolved = path.resolve(this.baseDir)
    return path.relative(baseDirResolved, fullPath)
  }

  /**
   * Handle errors consistently across all methods
   */
  private handleError(error: unknown, operation: string): never {
    if (error instanceof ValidationException) {
      throw error
    }
    throw new ValidationException(
      `Error ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  /**
   * Write content to a file
   */
  public writeFile(
    filePath: string,
    content: string
  ): { success: boolean; message: string; path: string } {
    try {
      this.ensureBaseDir()
      const fullPath = this.validatePath(filePath)

      // Ensure the directory exists
      const dir = path.dirname(fullPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(fullPath, content, 'utf8')

      return {
        success: true,
        message: `File written successfully: ${this.getRelativePath(fullPath)}`,
        path: this.getRelativePath(fullPath),
      }
    } catch (error) {
      this.handleError(error, 'writing file')
    }
  }

  /**
   * Read content from a file
   */
  public readFile(filePath: string): {
    success: boolean
    content?: string
    message: string
    path: string
  } {
    try {
      this.ensureBaseDir()
      const fullPath = this.validatePath(filePath)

      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `File not found: ${this.getRelativePath(fullPath)}`,
          path: this.getRelativePath(fullPath),
        }
      }

      const content = fs.readFileSync(fullPath, 'utf8')

      return {
        success: true,
        content,
        message: `File read successfully: ${this.getRelativePath(fullPath)}`,
        path: this.getRelativePath(fullPath),
      }
    } catch (error) {
      this.handleError(error, 'reading file')
    }
  }

  /**
   * Delete a file or directory
   */
  public deletePath(pathToDelete: string): {
    success: boolean
    message: string
    path: string
  } {
    try {
      this.ensureBaseDir()
      const fullPath = this.validatePath(pathToDelete)

      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `Path not found: ${this.getRelativePath(fullPath)}`,
          path: this.getRelativePath(fullPath),
        }
      }

      const stats = fs.statSync(fullPath)

      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true })
        return {
          success: true,
          message: `Directory deleted successfully: ${this.getRelativePath(fullPath)}`,
          path: this.getRelativePath(fullPath),
        }
      } else if (stats.isFile()) {
        fs.unlinkSync(fullPath)
        return {
          success: true,
          message: `File deleted successfully: ${this.getRelativePath(fullPath)}`,
          path: this.getRelativePath(fullPath),
        }
      } else {
        return {
          success: false,
          message: `Path is neither a file nor directory: ${this.getRelativePath(fullPath)}`,
          path: this.getRelativePath(fullPath),
        }
      }
    } catch (error) {
      this.handleError(error, 'deleting path')
    }
  }

  /**
   * List contents of a directory
   */
  public listDirectory(dirPath: string = '.'): {
    success: boolean
    items?: Array<{
      name: string
      type: 'file' | 'directory'
      size?: number
    }>
    message: string
    path: string
  } {
    try {
      this.ensureBaseDir()
      const fullPath = this.validatePath(dirPath)

      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `Directory not found: ${this.getRelativePath(fullPath)}`,
          path: this.getRelativePath(fullPath),
        }
      }

      const stats = fs.statSync(fullPath)
      if (!stats.isDirectory()) {
        return {
          success: false,
          message: `Path is not a directory: ${this.getRelativePath(fullPath)}`,
          path: this.getRelativePath(fullPath),
        }
      }

      const items = fs.readdirSync(fullPath).map((item) => {
        const itemPath = path.join(fullPath, item)
        const itemStats = fs.statSync(itemPath)
        return {
          name: item,
          type: itemStats.isDirectory() ? ('directory' as const) : ('file' as const),
          size: itemStats.isFile() ? itemStats.size : undefined,
        }
      })

      return {
        success: true,
        items,
        message: `Directory listed successfully: ${this.getRelativePath(fullPath)}`,
        path: this.getRelativePath(fullPath),
      }
    } catch (error) {
      this.handleError(error, 'listing directory')
    }
  }

  /**
   * Create a directory
   */
  public createDirectory(dirPath: string): {
    success: boolean
    message: string
    path: string
  } {
    try {
      this.ensureBaseDir()
      const fullPath = this.validatePath(dirPath)

      if (fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `Directory already exists: ${this.getRelativePath(fullPath)}`,
          path: this.getRelativePath(fullPath),
        }
      }

      fs.mkdirSync(fullPath, { recursive: true })

      return {
        success: true,
        message: `Directory created successfully: ${this.getRelativePath(fullPath)}`,
        path: this.getRelativePath(fullPath),
      }
    } catch (error) {
      this.handleError(error, 'creating directory')
    }
  }

  /**
   * Check if a file or directory exists
   */
  public exists(pathToCheck: string): {
    success: boolean
    exists: boolean
    message: string
    path: string
  } {
    try {
      this.ensureBaseDir()
      const fullPath = this.validatePath(pathToCheck)

      const exists = fs.existsSync(fullPath)

      return {
        success: true,
        exists,
        message: `Path ${exists ? 'exists' : 'does not exist'}: ${this.getRelativePath(fullPath)}`,
        path: this.getRelativePath(fullPath),
      }
    } catch (error) {
      this.handleError(error, 'checking path existence')
    }
  }

  /**
   * Search for files by pattern (simple glob-like search)
   */
  public searchFiles(
    pattern: string,
    searchDir: string = '.'
  ): {
    success: boolean
    files?: string[]
    message: string
    pattern: string
    searchDir: string
  } {
    try {
      this.ensureBaseDir()
      const fullSearchDir = this.validatePath(searchDir)

      if (!fs.existsSync(fullSearchDir)) {
        return {
          success: false,
          message: `Search directory not found: ${this.getRelativePath(fullSearchDir)}`,
          pattern,
          searchDir: this.getRelativePath(fullSearchDir),
        }
      }

      const stats = fs.statSync(fullSearchDir)
      if (!stats.isDirectory()) {
        return {
          success: false,
          message: `Search path is not a directory: ${this.getRelativePath(fullSearchDir)}`,
          pattern,
          searchDir: this.getRelativePath(fullSearchDir),
        }
      }

      const foundFiles: string[] = []

      const searchRecursively = (currentDir: string): void => {
        const items = fs.readdirSync(currentDir)

        for (const item of items) {
          const itemPath = path.join(currentDir, item)
          const relativeItemPath = this.getRelativePath(itemPath)
          const stats = fs.statSync(itemPath)

          if (stats.isDirectory()) {
            searchRecursively(itemPath)
          } else if (stats.isFile()) {
            // Simple pattern matching (supports * wildcard)
            const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            const regexPattern = escapedPattern.replace(/\*/g, '.*')
            const regex = new RegExp(`^${regexPattern}$`)

            if (regex.test(item) || regex.test(relativeItemPath)) {
              foundFiles.push(relativeItemPath)
            }
          }
        }
      }

      searchRecursively(fullSearchDir)

      return {
        success: true,
        files: foundFiles,
        message: `Found ${foundFiles.length} files matching pattern "${pattern}"`,
        pattern,
        searchDir: this.getRelativePath(fullSearchDir),
      }
    } catch (error) {
      this.handleError(error, 'searching files')
    }
  }
}

// Create a default instance for backward compatibility
const defaultFileUtil = new FileUtil()

// Export all methods as a single object for easy tool registration
export const fileSystemTools = {
  writeFile: defaultFileUtil.writeFile.bind(defaultFileUtil),
  readFile: defaultFileUtil.readFile.bind(defaultFileUtil),
  deletePath: defaultFileUtil.deletePath.bind(defaultFileUtil),
  listDirectory: defaultFileUtil.listDirectory.bind(defaultFileUtil),
  createDirectory: defaultFileUtil.createDirectory.bind(defaultFileUtil),
  exists: defaultFileUtil.exists.bind(defaultFileUtil),
  searchFiles: defaultFileUtil.searchFiles.bind(defaultFileUtil),
}
