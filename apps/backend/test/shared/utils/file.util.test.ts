import * as fs from 'fs'
import * as path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'
import { FileUtil } from '../../../src/shared/utils/file.util.js'

describe('FileUtil', () => {
  const TEST_BASE_DIR = path.join(process.cwd(), 'data', 'file-system-db.local')
  const TEST_FILE = 'test-file.txt'
  const TEST_CONTENT = 'Hello, World!'
  const TEST_DIR = 'test-directory'
  const NESTED_DIR = 'nested/deep/directory'
  const NESTED_FILE = 'nested/deep/file.txt'

  let fileUtil: FileUtil

  beforeEach(() => {
    // Create a new FileUtil instance for each test
    fileUtil = new FileUtil()

    // Clean up test directory before each test
    if (fs.existsSync(TEST_BASE_DIR)) {
      fs.rmSync(TEST_BASE_DIR, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    // Clean up test directory after each test
    if (fs.existsSync(TEST_BASE_DIR)) {
      fs.rmSync(TEST_BASE_DIR, { recursive: true, force: true })
    }
  })

  describe('Constructor', () => {
    it('should create instance with default parameters', () => {
      const instance = new FileUtil()
      expect(instance).toBeInstanceOf(FileUtil)
    })

    it('should create instance with custom database name', () => {
      const customDbName = 'custom-db-test'
      const customDir = path.join(process.cwd(), 'data', customDbName)
      const customUtil = new FileUtil('data', customDbName)

      try {
        const result = customUtil.writeFile('test.txt', 'content')
        expect(result.success).toBe(true)
        expect(fs.existsSync(customDir)).toBe(true)
      } finally {
        // Clean up custom directory
        if (fs.existsSync(customDir)) {
          fs.rmSync(customDir, { recursive: true, force: true })
        }
      }
    })

    it('should create instance with custom data folder and database name', () => {
      const customFolder = 'test-data'
      const customDbName = 'custom-db'
      const customDir = path.join(process.cwd(), customFolder, customDbName)
      const customUtil = new FileUtil(customFolder, customDbName)

      try {
        const result = customUtil.writeFile('test.txt', 'content')
        expect(result.success).toBe(true)
        expect(fs.existsSync(customDir)).toBe(true)
      } finally {
        // Clean up custom directory and parent folder
        try {
          const customFolderPath = path.join(process.cwd(), customFolder)
          if (fs.existsSync(customFolderPath)) {
            fs.rmSync(customFolderPath, {
              recursive: true,
              force: true,
              maxRetries: 3,
              retryDelay: 100,
            })
          }
        } catch (error) {
          // Ignore cleanup errors in tests
          console.warn('Failed to cleanup test-data folder:', error)
        }
      }
    })
  })

  describe('writeFile', () => {
    it('should write content to a file successfully', () => {
      const result = fileUtil.writeFile(TEST_FILE, TEST_CONTENT)

      expect(result.success).toBe(true)
      expect(result.message).toContain('File written successfully')
      expect(result.path).toBe(TEST_FILE)

      const fullPath = path.join(TEST_BASE_DIR, TEST_FILE)
      expect(fs.existsSync(fullPath)).toBe(true)
      expect(fs.readFileSync(fullPath, 'utf8')).toBe(TEST_CONTENT)
    })

    it('should create nested directories when writing to nested path', () => {
      const result = fileUtil.writeFile(NESTED_FILE, TEST_CONTENT)

      expect(result.success).toBe(true)
      expect(result.path).toBe(NESTED_FILE)

      const fullPath = path.join(TEST_BASE_DIR, NESTED_FILE)
      expect(fs.existsSync(fullPath)).toBe(true)
      expect(fs.readFileSync(fullPath, 'utf8')).toBe(TEST_CONTENT)
    })

    it('should overwrite existing file', () => {
      fileUtil.writeFile(TEST_FILE, 'First content')
      const result = fileUtil.writeFile(TEST_FILE, 'Second content')

      expect(result.success).toBe(true)

      const fullPath = path.join(TEST_BASE_DIR, TEST_FILE)
      expect(fs.readFileSync(fullPath, 'utf8')).toBe('Second content')
    })

    it('should handle empty content', () => {
      const result = fileUtil.writeFile(TEST_FILE, '')

      expect(result.success).toBe(true)

      const fullPath = path.join(TEST_BASE_DIR, TEST_FILE)
      expect(fs.readFileSync(fullPath, 'utf8')).toBe('')
    })

    it('should handle special characters in content', () => {
      const specialContent = 'Special chars: 特殊文字 émojis 🎉 @#$%'
      const result = fileUtil.writeFile(TEST_FILE, specialContent)

      expect(result.success).toBe(true)

      const fullPath = path.join(TEST_BASE_DIR, TEST_FILE)
      expect(fs.readFileSync(fullPath, 'utf8')).toBe(specialContent)
    })

    it('should throw ValidationException for paths outside base directory', () => {
      expect(() => fileUtil.writeFile('../outside.txt', TEST_CONTENT)).toThrow(ValidationException)
      expect(() => fileUtil.writeFile('../outside.txt', TEST_CONTENT)).toThrow('Access denied')
    })

    it('should throw ValidationException for absolute paths outside base directory', () => {
      expect(() => fileUtil.writeFile('/etc/passwd', TEST_CONTENT)).toThrow(ValidationException)
      expect(() => fileUtil.writeFile('/etc/passwd', TEST_CONTENT)).toThrow('Access denied')
    })
  })

  describe('readFile', () => {
    it('should read content from an existing file', () => {
      fileUtil.writeFile(TEST_FILE, TEST_CONTENT)
      const result = fileUtil.readFile(TEST_FILE)

      expect(result.success).toBe(true)
      expect(result.content).toBe(TEST_CONTENT)
      expect(result.message).toContain('File read successfully')
      expect(result.path).toBe(TEST_FILE)
    })

    it('should read content from nested file', () => {
      fileUtil.writeFile(NESTED_FILE, TEST_CONTENT)
      const result = fileUtil.readFile(NESTED_FILE)

      expect(result.success).toBe(true)
      expect(result.content).toBe(TEST_CONTENT)
    })

    it('should return error for non-existent file', () => {
      const result = fileUtil.readFile('non-existent.txt')

      expect(result.success).toBe(false)
      expect(result.content).toBeUndefined()
      expect(result.message).toContain('File not found')
    })

    it('should handle empty files', () => {
      fileUtil.writeFile(TEST_FILE, '')
      const result = fileUtil.readFile(TEST_FILE)

      expect(result.success).toBe(true)
      expect(result.content).toBe('')
    })

    it('should throw ValidationException for paths outside base directory', () => {
      expect(() => fileUtil.readFile('../outside.txt')).toThrow(ValidationException)
      expect(() => fileUtil.readFile('../outside.txt')).toThrow('Access denied')
    })
  })

  describe('deletePath', () => {
    it('should delete an existing file', () => {
      fileUtil.writeFile(TEST_FILE, TEST_CONTENT)
      const result = fileUtil.deletePath(TEST_FILE)

      expect(result.success).toBe(true)
      expect(result.message).toContain('File deleted successfully')
      expect(result.path).toBe(TEST_FILE)

      const fullPath = path.join(TEST_BASE_DIR, TEST_FILE)
      expect(fs.existsSync(fullPath)).toBe(false)
    })

    it('should delete an existing directory', () => {
      fileUtil.createDirectory(TEST_DIR)
      const result = fileUtil.deletePath(TEST_DIR)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Directory deleted successfully')
      expect(result.path).toBe(TEST_DIR)

      const fullPath = path.join(TEST_BASE_DIR, TEST_DIR)
      expect(fs.existsSync(fullPath)).toBe(false)
    })

    it('should delete directory with contents recursively', () => {
      fileUtil.createDirectory(TEST_DIR)
      fileUtil.writeFile(`${TEST_DIR}/file1.txt`, 'Content 1')
      fileUtil.writeFile(`${TEST_DIR}/file2.txt`, 'Content 2')

      const result = fileUtil.deletePath(TEST_DIR)

      expect(result.success).toBe(true)

      const fullPath = path.join(TEST_BASE_DIR, TEST_DIR)
      expect(fs.existsSync(fullPath)).toBe(false)
    })

    it('should return error for non-existent path', () => {
      const result = fileUtil.deletePath('non-existent.txt')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Path not found')
    })

    it('should throw ValidationException for paths outside base directory', () => {
      expect(() => fileUtil.deletePath('../outside.txt')).toThrow(ValidationException)
      expect(() => fileUtil.deletePath('../outside.txt')).toThrow('Access denied')
    })
  })

  describe('listDirectory', () => {
    it('should list empty directory', () => {
      fileUtil.createDirectory(TEST_DIR)
      const result = fileUtil.listDirectory(TEST_DIR)

      expect(result.success).toBe(true)
      expect(result.items).toEqual([])
      expect(result.message).toContain('Directory listed successfully')
    })

    it('should list directory with files and subdirectories', () => {
      fileUtil.createDirectory(TEST_DIR)
      fileUtil.writeFile(`${TEST_DIR}/file1.txt`, 'Content 1')
      fileUtil.writeFile(`${TEST_DIR}/file2.txt`, 'Content 2')
      fileUtil.createDirectory(`${TEST_DIR}/subdir`)

      const result = fileUtil.listDirectory(TEST_DIR)

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(3)

      const files = result.items!.filter((item) => item.type === 'file')
      const dirs = result.items!.filter((item) => item.type === 'directory')

      expect(files).toHaveLength(2)
      expect(dirs).toHaveLength(1)

      files.forEach((file) => {
        expect(file.size).toBeDefined()
        expect(file.size).toBeGreaterThan(0)
      })

      dirs.forEach((dir) => {
        expect(dir.size).toBeUndefined()
      })
    })

    it('should list root directory by default', () => {
      fileUtil.writeFile('root-file.txt', 'Content')
      const result = fileUtil.listDirectory()

      expect(result.success).toBe(true)
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBeGreaterThan(0)
      expect(result.items!.some((item) => item.name === 'root-file.txt')).toBe(true)
    })

    it('should return error for non-existent directory', () => {
      const result = fileUtil.listDirectory('non-existent')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Directory not found')
    })

    it('should return error when path is a file, not directory', () => {
      fileUtil.writeFile(TEST_FILE, TEST_CONTENT)
      const result = fileUtil.listDirectory(TEST_FILE)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Path is not a directory')
    })

    it('should throw ValidationException for paths outside base directory', () => {
      expect(() => fileUtil.listDirectory('../outside')).toThrow(ValidationException)
      expect(() => fileUtil.listDirectory('../outside')).toThrow('Access denied')
    })
  })

  describe('createDirectory', () => {
    it('should create a new directory', () => {
      const result = fileUtil.createDirectory(TEST_DIR)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Directory created successfully')
      expect(result.path).toBe(TEST_DIR)

      const fullPath = path.join(TEST_BASE_DIR, TEST_DIR)
      expect(fs.existsSync(fullPath)).toBe(true)
      expect(fs.statSync(fullPath).isDirectory()).toBe(true)
    })

    it('should create nested directories', () => {
      const result = fileUtil.createDirectory(NESTED_DIR)

      expect(result.success).toBe(true)
      expect(result.path).toBe(NESTED_DIR)

      const fullPath = path.join(TEST_BASE_DIR, NESTED_DIR)
      expect(fs.existsSync(fullPath)).toBe(true)
    })

    it('should return error if directory already exists', () => {
      fileUtil.createDirectory(TEST_DIR)
      const result = fileUtil.createDirectory(TEST_DIR)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Directory already exists')
    })

    it('should throw ValidationException for paths outside base directory', () => {
      expect(() => fileUtil.createDirectory('../outside')).toThrow(ValidationException)
      expect(() => fileUtil.createDirectory('../outside')).toThrow('Access denied')
    })
  })

  describe('exists', () => {
    it('should return true for existing file', () => {
      fileUtil.writeFile(TEST_FILE, TEST_CONTENT)
      const result = fileUtil.exists(TEST_FILE)

      expect(result.success).toBe(true)
      expect(result.exists).toBe(true)
      expect(result.message).toContain('exists')
    })

    it('should return true for existing directory', () => {
      fileUtil.createDirectory(TEST_DIR)
      const result = fileUtil.exists(TEST_DIR)

      expect(result.success).toBe(true)
      expect(result.exists).toBe(true)
    })

    it('should return false for non-existent path', () => {
      const result = fileUtil.exists('non-existent.txt')

      expect(result.success).toBe(true)
      expect(result.exists).toBe(false)
      expect(result.message).toContain('does not exist')
    })

    it('should throw ValidationException for paths outside base directory', () => {
      expect(() => fileUtil.exists('../outside.txt')).toThrow(ValidationException)
      expect(() => fileUtil.exists('../outside.txt')).toThrow('Access denied')
    })
  })

  describe('searchFiles', () => {
    beforeEach(() => {
      // Create test file structure
      fileUtil.writeFile('file1.txt', 'Content 1')
      fileUtil.writeFile('file2.txt', 'Content 2')
      fileUtil.writeFile('document.pdf', 'PDF content')
      fileUtil.createDirectory('subdir')
      fileUtil.writeFile('subdir/nested.txt', 'Nested content')
      fileUtil.writeFile('subdir/data.json', 'JSON data')
      fileUtil.createDirectory('subdir/deep')
      fileUtil.writeFile('subdir/deep/deepfile.txt', 'Deep content')
    })

    it('should find files matching exact name', () => {
      const result = fileUtil.searchFiles('file1.txt')

      expect(result.success).toBe(true)
      expect(result.files).toHaveLength(1)
      expect(result.files![0]).toBe('file1.txt')
    })

    it('should find files matching wildcard pattern', () => {
      const result = fileUtil.searchFiles('*.txt')

      expect(result.success).toBe(true)
      expect(result.files!.length).toBeGreaterThanOrEqual(3)
      expect(result.files!.every((file) => file.endsWith('.txt'))).toBe(true)
    })

    it('should search recursively in subdirectories', () => {
      const result = fileUtil.searchFiles('*.txt', '.')

      expect(result.success).toBe(true)
      expect(result.files).toContain('file1.txt')
      expect(result.files).toContain('subdir/nested.txt')
      expect(result.files).toContain('subdir/deep/deepfile.txt')
    })

    it('should search in specific subdirectory', () => {
      const result = fileUtil.searchFiles('*.txt', 'subdir')

      expect(result.success).toBe(true)
      expect(result.files).toHaveLength(2)
      expect(result.files!.every((file) => file.startsWith('subdir'))).toBe(true)
    })

    it('should find files by partial name match', () => {
      const result = fileUtil.searchFiles('*data*')

      expect(result.success).toBe(true)
      expect(result.files!.length).toBeGreaterThanOrEqual(1)
      expect(result.files).toContain('subdir/data.json')
    })

    it('should return empty array when no files match', () => {
      const result = fileUtil.searchFiles('*.nonexistent')

      expect(result.success).toBe(true)
      expect(result.files).toEqual([])
      expect(result.message).toContain('Found 0 files')
    })

    it('should return error for non-existent search directory', () => {
      const result = fileUtil.searchFiles('*.txt', 'non-existent-dir')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Search directory not found')
    })

    it('should return error when search path is a file', () => {
      const result = fileUtil.searchFiles('*.txt', 'file1.txt')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Search path is not a directory')
    })

    it('should throw ValidationException for search paths outside base directory', () => {
      expect(() => fileUtil.searchFiles('*.txt', '../outside')).toThrow(ValidationException)
      expect(() => fileUtil.searchFiles('*.txt', '../outside')).toThrow('Access denied')
    })
  })

  describe('fileSystemTools export', () => {
    it('should export all methods as bound functions', async () => {
      const { fileSystemTools } = await import('../../../src/shared/utils/file.util.js')

      expect(typeof fileSystemTools.writeFile).toBe('function')
      expect(typeof fileSystemTools.readFile).toBe('function')
      expect(typeof fileSystemTools.deletePath).toBe('function')
      expect(typeof fileSystemTools.listDirectory).toBe('function')
      expect(typeof fileSystemTools.createDirectory).toBe('function')
      expect(typeof fileSystemTools.exists).toBe('function')
      expect(typeof fileSystemTools.searchFiles).toBe('function')
    })

    it('should work when called from fileSystemTools object', async () => {
      const { fileSystemTools } = await import('../../../src/shared/utils/file.util.js')

      const writeResult = fileSystemTools.writeFile('tool-test.txt', 'Tool content')
      expect(writeResult.success).toBe(true)

      const readResult = fileSystemTools.readFile('tool-test.txt')
      expect(readResult.success).toBe(true)
      expect(readResult.content).toBe('Tool content')
    })
  })

  describe('Path Security', () => {
    it('should prevent directory traversal with ../', () => {
      expect(() => fileUtil.writeFile('../../etc/passwd', 'malicious')).toThrow(ValidationException)
      expect(() => fileUtil.writeFile('../../etc/passwd', 'malicious')).toThrow('Access denied')
    })

    it('should prevent directory traversal patterns', () => {
      // This test works on all platforms
      expect(() => fileUtil.writeFile('../outside.txt', 'malicious')).toThrow(ValidationException)
      expect(() => fileUtil.writeFile('../outside.txt', 'malicious')).toThrow('Access denied')

      expect(() => fileUtil.writeFile('test/../../../etc/passwd', 'malicious')).toThrow(
        ValidationException
      )
      expect(() => fileUtil.writeFile('test/../../../etc/passwd', 'malicious')).toThrow(
        'Access denied'
      )
    })

    it('should prevent absolute path access', () => {
      expect(() => fileUtil.writeFile('/etc/passwd', 'malicious')).toThrow(ValidationException)
      expect(() => fileUtil.writeFile('/etc/passwd', 'malicious')).toThrow('Access denied')
    })

    it('should allow relative paths within base directory', () => {
      const result = fileUtil.writeFile('subdir/../allowed.txt', 'content')

      expect(result.success).toBe(true)

      const fullPath = path.join(TEST_BASE_DIR, 'allowed.txt')
      expect(fs.existsSync(fullPath)).toBe(true)
    })
  })

  describe('Base Directory Initialization', () => {
    it('should create base directory if it does not exist', () => {
      // Clean up to ensure it doesn't exist
      if (fs.existsSync(TEST_BASE_DIR)) {
        fs.rmSync(TEST_BASE_DIR, { recursive: true, force: true })
      }

      const result = fileUtil.writeFile(TEST_FILE, TEST_CONTENT)

      expect(result.success).toBe(true)
      expect(fs.existsSync(TEST_BASE_DIR)).toBe(true)
    })

    it('should handle existing base directory gracefully', () => {
      // Ensure base directory exists
      fileUtil.writeFile('init-test.txt', 'content')

      // Call again - should not fail
      const result = fileUtil.writeFile('another-file.txt', 'more content')

      expect(result.success).toBe(true)
    })
  })
})
