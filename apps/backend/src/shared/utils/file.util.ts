import * as fs from 'fs'
import * as path from 'path'
import { ValidationException } from '../exceptions/validation.exception.js'

/**
 * Utility class for file system operations
 * Provides methods for reading, writing, deleting, and searching files within a controlled directory
 */
export class FileUtil {
  private static readonly BASE_DIR = path.join(process.cwd(), 'data', 'file-system-db.local')

  /**
   * Ensure the base directory exists
   */
  private static ensureBaseDir(): void {
    if (!fs.existsSync(FileUtil.BASE_DIR)) {
      fs.mkdirSync(FileUtil.BASE_DIR, { recursive: true })
    }
  }

  /**
   * Validate that a path is within the allowed directory
   */
  private static validatePath(filePath: string): string {
    const normalizedPath = path.normalize(filePath)
    const fullPath = path.resolve(FileUtil.BASE_DIR, normalizedPath)
    const baseDirResolved = path.resolve(FileUtil.BASE_DIR)

    if (!fullPath.startsWith(baseDirResolved)) {
      throw new ValidationException(
        `Access denied: Path "${filePath}" is outside the allowed directory`
      )
    }

    return fullPath
  }

  /**
   * Get relative path from base directory
   */
  private static getRelativePath(fullPath: string): string {
    const baseDirResolved = path.resolve(FileUtil.BASE_DIR)
    return path.relative(baseDirResolved, fullPath)
  }

  /**
   * Write content to a file
   */
  public static writeFile(
    filePath: string,
    content: string
  ): { success: boolean; message: string; path: string } {
    try {
      FileUtil.ensureBaseDir()
      const fullPath = FileUtil.validatePath(filePath)

      // Ensure the directory exists
      const dir = path.dirname(fullPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(fullPath, content, 'utf8')

      return {
        success: true,
        message: `File written successfully: ${FileUtil.getRelativePath(fullPath)}`,
        path: FileUtil.getRelativePath(fullPath),
      }
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error
      }
      throw new ValidationException(
        `Error writing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Read content from a file
   */
  public static readFile(filePath: string): {
    success: boolean
    content?: string
    message: string
    path: string
  } {
    try {
      FileUtil.ensureBaseDir()
      const fullPath = FileUtil.validatePath(filePath)

      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `File not found: ${FileUtil.getRelativePath(fullPath)}`,
          path: FileUtil.getRelativePath(fullPath),
        }
      }

      const content = fs.readFileSync(fullPath, 'utf8')

      return {
        success: true,
        content,
        message: `File read successfully: ${FileUtil.getRelativePath(fullPath)}`,
        path: FileUtil.getRelativePath(fullPath),
      }
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error
      }
      throw new ValidationException(
        `Error writing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Delete a file or directory
   */
  public static deletePath(pathToDelete: string): {
    success: boolean
    message: string
    path: string
  } {
    try {
      FileUtil.ensureBaseDir()
      const fullPath = FileUtil.validatePath(pathToDelete)

      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `Path not found: ${FileUtil.getRelativePath(fullPath)}`,
          path: FileUtil.getRelativePath(fullPath),
        }
      }

      const stats = fs.statSync(fullPath)

      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true })
        return {
          success: true,
          message: `Directory deleted successfully: ${FileUtil.getRelativePath(fullPath)}`,
          path: FileUtil.getRelativePath(fullPath),
        }
      } else if (stats.isFile()) {
        fs.unlinkSync(fullPath)
        return {
          success: true,
          message: `File deleted successfully: ${FileUtil.getRelativePath(fullPath)}`,
          path: FileUtil.getRelativePath(fullPath),
        }
      } else {
        return {
          success: false,
          message: `Path is neither a file nor directory: ${FileUtil.getRelativePath(fullPath)}`,
          path: FileUtil.getRelativePath(fullPath),
        }
      }
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error
      }
      throw new ValidationException(
        `Error writing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * List contents of a directory
   */
  public static listDirectory(dirPath: string = '.'): {
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
      FileUtil.ensureBaseDir()
      const fullPath = FileUtil.validatePath(dirPath)

      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `Directory not found: ${FileUtil.getRelativePath(fullPath)}`,
          path: FileUtil.getRelativePath(fullPath),
        }
      }

      const stats = fs.statSync(fullPath)
      if (!stats.isDirectory()) {
        return {
          success: false,
          message: `Path is not a directory: ${FileUtil.getRelativePath(fullPath)}`,
          path: FileUtil.getRelativePath(fullPath),
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
        message: `Directory listed successfully: ${FileUtil.getRelativePath(fullPath)}`,
        path: FileUtil.getRelativePath(fullPath),
      }
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error
      }
      throw new ValidationException(
        `Error writing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Create a directory
   */
  public static createDirectory(dirPath: string): {
    success: boolean
    message: string
    path: string
  } {
    try {
      FileUtil.ensureBaseDir()
      const fullPath = FileUtil.validatePath(dirPath)

      if (fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `Directory already exists: ${FileUtil.getRelativePath(fullPath)}`,
          path: FileUtil.getRelativePath(fullPath),
        }
      }

      fs.mkdirSync(fullPath, { recursive: true })

      return {
        success: true,
        message: `Directory created successfully: ${FileUtil.getRelativePath(fullPath)}`,
        path: FileUtil.getRelativePath(fullPath),
      }
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error
      }
      throw new ValidationException(
        `Error writing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Check if a file or directory exists
   */
  public static exists(pathToCheck: string): {
    success: boolean
    exists: boolean
    message: string
    path: string
  } {
    try {
      FileUtil.ensureBaseDir()
      const fullPath = FileUtil.validatePath(pathToCheck)

      const exists = fs.existsSync(fullPath)

      return {
        success: true,
        exists,
        message: `Path ${exists ? 'exists' : 'does not exist'}: ${FileUtil.getRelativePath(fullPath)}`,
        path: FileUtil.getRelativePath(fullPath),
      }
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error
      }
      throw new ValidationException(
        `Error writing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Search for files by pattern (simple glob-like search)
   */
  public static searchFiles(
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
      FileUtil.ensureBaseDir()
      const fullSearchDir = FileUtil.validatePath(searchDir)

      if (!fs.existsSync(fullSearchDir)) {
        return {
          success: false,
          message: `Search directory not found: ${FileUtil.getRelativePath(fullSearchDir)}`,
          pattern,
          searchDir: FileUtil.getRelativePath(fullSearchDir),
        }
      }

      const stats = fs.statSync(fullSearchDir)
      if (!stats.isDirectory()) {
        return {
          success: false,
          message: `Search path is not a directory: ${FileUtil.getRelativePath(fullSearchDir)}`,
          pattern,
          searchDir: FileUtil.getRelativePath(fullSearchDir),
        }
      }

      const foundFiles: string[] = []

      function searchRecursively(currentDir: string): void {
        const items = fs.readdirSync(currentDir)

        for (const item of items) {
          const itemPath = path.join(currentDir, item)
          const relativeItemPath = FileUtil.getRelativePath(itemPath)
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
        searchDir: FileUtil.getRelativePath(fullSearchDir),
      }
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error
      }
      throw new ValidationException(
        `Error writing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

// Export all methods as a single object for easy tool registration
export const fileSystemTools = {
  writeFile: FileUtil.writeFile.bind(FileUtil),
  readFile: FileUtil.readFile.bind(FileUtil),
  deletePath: FileUtil.deletePath.bind(FileUtil),
  listDirectory: FileUtil.listDirectory.bind(FileUtil),
  createDirectory: FileUtil.createDirectory.bind(FileUtil),
  exists: FileUtil.exists.bind(FileUtil),
  searchFiles: FileUtil.searchFiles.bind(FileUtil),
}
