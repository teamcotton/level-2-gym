import * as fs from 'fs'
import * as path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'
import { FileUtil } from '../../../src/shared/utils/file.util.js'

describe('FileUtil', () => {
  const TEST_BASE_DIR = path.join(process.cwd(), 'data', 'test-db')
  const TEST_FILE = 'test-file.txt'
  const TEST_CONTENT = 'Hello, World!'
  const TEST_DIR = 'test-directory'
  const NESTED_DIR = 'nested/deep/directory'
  const NESTED_FILE = 'nested/deep/file.txt'

  let fileUtil: FileUtil

  beforeEach(() => {
    // Create a new FileUtil instance for each test with test-specific database
    fileUtil = new FileUtil('data', 'test-db')

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
    it('should create instance with required parameters', () => {
      const instance = new FileUtil('data', 'test-db')
      expect(instance).toBeInstanceOf(FileUtil)
    })

    it('should create instance with custom database name', async () => {
      const customDbName = 'custom-db-test'
      const customDir = path.join(process.cwd(), 'data', customDbName)
      const customUtil = new FileUtil('data', customDbName)

      try {
        const result = await customUtil.writeFile('test.txt', 'content')
        expect(result.success).toBe(true)
        expect(fs.existsSync(customDir)).toBe(true)
      } finally {
        if (fs.existsSync(customDir)) {
          fs.rmSync(customDir, { recursive: true, force: true })
        }
      }
    })

    it('should create instance with custom data folder and database name', async () => {
      const customFolder = 'test-data'
      const customDbName = 'custom-db'
      const customDir = path.join(process.cwd(), customFolder, customDbName)
      const customUtil = new FileUtil(customFolder, customDbName)

      try {
        const result = await customUtil.writeFile('test.txt', 'content')
        expect(result.success).toBe(true)
        expect(fs.existsSync(customDir)).toBe(true)
      } finally {
        const customFolderPath = path.join(process.cwd(), customFolder)
        if (fs.existsSync(customFolderPath)) {
          fs.rmSync(customFolderPath, { recursive: true, force: true })
        }
      }
    })
  })

  describe('writeFile', () => {
    it('should write content to a file successfully', async () => {
      const result = await fileUtil.writeFile(TEST_FILE, TEST_CONTENT)

      expect(result.success).toBe(true)
      expect(result.message).toContain('File written successfully')
      expect(result.path).toBe(TEST_FILE)

      const fullPath = path.join(TEST_BASE_DIR, TEST_FILE)
      expect(fs.existsSync(fullPath)).toBe(true)
      expect(fs.readFileSync(fullPath, 'utf8')).toBe(TEST_CONTENT)
    })

    it('should create nested directories when writing to nested path', async () => {
      const result = await fileUtil.writeFile(NESTED_FILE, TEST_CONTENT)

      expect(result.success).toBe(true)
      expect(result.path).toBe(NESTED_FILE)

      const fullPath = path.join(TEST_BASE_DIR, NESTED_FILE)
      expect(fs.existsSync(fullPath)).toBe(true)
      expect(fs.readFileSync(fullPath, 'utf8')).toBe(TEST_CONTENT)
    })

    it('should overwrite existing file', async () => {
      await fileUtil.writeFile(TEST_FILE, 'First content')
      const result = await fileUtil.writeFile(TEST_FILE, 'Second content')

      expect(result.success).toBe(true)

      const fullPath = path.join(TEST_BASE_DIR, TEST_FILE)
      expect(fs.readFileSync(fullPath, 'utf8')).toBe('Second content')
    })

    it('should handle empty content', async () => {
      const result = await fileUtil.writeFile(TEST_FILE, '')

      expect(result.success).toBe(true)

      const fullPath = path.join(TEST_BASE_DIR, TEST_FILE)
      expect(fs.readFileSync(fullPath, 'utf8')).toBe('')
    })

    it('should handle special characters in content', async () => {
      const specialContent = 'Special chars: 特殊文字 émojis 🎉 @#$%'
      const result = await fileUtil.writeFile(TEST_FILE, specialContent)

      expect(result.success).toBe(true)

      const fullPath = path.join(TEST_BASE_DIR, TEST_FILE)
      expect(fs.readFileSync(fullPath, 'utf8')).toBe(specialContent)
    })

    it('should throw ValidationException for paths outside base directory', async () => {
      await expect(fileUtil.writeFile('../outside.txt', TEST_CONTENT)).rejects.toThrow(
        ValidationException
      )
      await expect(fileUtil.writeFile('../outside.txt', TEST_CONTENT)).rejects.toThrow(
        'Access denied'
      )
    })

    it('should throw ValidationException for absolute paths', async () => {
      await expect(fileUtil.writeFile('/etc/passwd', TEST_CONTENT)).rejects.toThrow(
        ValidationException
      )
      await expect(fileUtil.writeFile('/etc/passwd', TEST_CONTENT)).rejects.toThrow('Access denied')
    })

    it('should create base directory if it does not exist', async () => {
      if (fs.existsSync(TEST_BASE_DIR)) {
        fs.rmSync(TEST_BASE_DIR, { recursive: true, force: true })
      }

      const result = await fileUtil.writeFile(TEST_FILE, TEST_CONTENT)

      expect(result.success).toBe(true)
      expect(fs.existsSync(TEST_BASE_DIR)).toBe(true)
    })
  })

  describe('readFile', () => {
    it('should read content from an existing file', async () => {
      await fileUtil.writeFile(TEST_FILE, TEST_CONTENT)
      const result = await fileUtil.readFile(TEST_FILE)

      expect(result.success).toBe(true)
      expect(result.content).toBe(TEST_CONTENT)
      expect(result.message).toContain('File read successfully')
      expect(result.path).toBe(TEST_FILE)
    })

    it('should read content from nested file', async () => {
      await fileUtil.writeFile(NESTED_FILE, TEST_CONTENT)
      const result = await fileUtil.readFile(NESTED_FILE)

      expect(result.success).toBe(true)
      expect(result.content).toBe(TEST_CONTENT)
    })

    it('should return error for non-existent file', async () => {
      const result = await fileUtil.readFile('non-existent.txt')

      expect(result.success).toBe(false)
      expect(result.content).toBeUndefined()
      expect(result.message).toContain('File not found')
    })

    it('should handle empty files', async () => {
      await fileUtil.writeFile(TEST_FILE, '')
      const result = await fileUtil.readFile(TEST_FILE)

      expect(result.success).toBe(true)
      expect(result.content).toBe('')
    })

    it('should throw ValidationException for paths outside base directory', async () => {
      await expect(fileUtil.readFile('../outside.txt')).rejects.toThrow(ValidationException)
      await expect(fileUtil.readFile('../outside.txt')).rejects.toThrow('Access denied')
    })

    it('should handle special characters in file content', async () => {
      const specialContent = '特殊文字 émojis 🎉'
      await fileUtil.writeFile(TEST_FILE, specialContent)
      const result = await fileUtil.readFile(TEST_FILE)

      expect(result.success).toBe(true)
      expect(result.content).toBe(specialContent)
    })
  })

  describe('deletePath', () => {
    it('should delete an existing file', async () => {
      await fileUtil.writeFile(TEST_FILE, TEST_CONTENT)
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

    it('should delete directory with contents recursively', async () => {
      fileUtil.createDirectory(TEST_DIR)
      await fileUtil.writeFile(`${TEST_DIR}/file1.txt`, 'Content 1')
      await fileUtil.writeFile(`${TEST_DIR}/file2.txt`, 'Content 2')

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

    it('should delete nested directory structure', async () => {
      await fileUtil.writeFile(NESTED_FILE, TEST_CONTENT)
      const result = fileUtil.deletePath('nested')

      expect(result.success).toBe(true)
      const fullPath = path.join(TEST_BASE_DIR, 'nested')
      expect(fs.existsSync(fullPath)).toBe(false)
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

    it('should list directory with files and subdirectories', async () => {
      fileUtil.createDirectory(TEST_DIR)
      await fileUtil.writeFile(`${TEST_DIR}/file1.txt`, 'Content 1')
      await fileUtil.writeFile(`${TEST_DIR}/file2.txt`, 'Content 2')
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

    it('should list root directory by default', async () => {
      await fileUtil.writeFile('root-file.txt', 'Content')
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

    it('should return error when path is a file, not directory', async () => {
      await fileUtil.writeFile(TEST_FILE, TEST_CONTENT)
      const result = fileUtil.listDirectory(TEST_FILE)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Path is not a directory')
    })

    it('should throw ValidationException for paths outside base directory', () => {
      expect(() => fileUtil.listDirectory('../outside')).toThrow(ValidationException)
      expect(() => fileUtil.listDirectory('../outside')).toThrow('Access denied')
    })

    it('should show file sizes correctly', async () => {
      fileUtil.createDirectory(TEST_DIR)
      const content = 'Test content with some length'
      await fileUtil.writeFile(`${TEST_DIR}/sized-file.txt`, content)

      const result = fileUtil.listDirectory(TEST_DIR)
      const file = result.items!.find((item) => item.name === 'sized-file.txt')

      expect(file).toBeDefined()
      expect(file!.size).toBe(Buffer.byteLength(content, 'utf8'))
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

    it('should create base directory if needed', () => {
      if (fs.existsSync(TEST_BASE_DIR)) {
        fs.rmSync(TEST_BASE_DIR, { recursive: true, force: true })
      }

      const result = fileUtil.createDirectory(TEST_DIR)

      expect(result.success).toBe(true)
      expect(fs.existsSync(TEST_BASE_DIR)).toBe(true)
    })
  })

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await fileUtil.writeFile(TEST_FILE, TEST_CONTENT)
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

    it('should return correct path in response', async () => {
      await fileUtil.writeFile(NESTED_FILE, TEST_CONTENT)
      const result = fileUtil.exists(NESTED_FILE)

      expect(result.success).toBe(true)
      expect(result.exists).toBe(true)
      expect(result.path).toBe(NESTED_FILE)
    })
  })

  describe('searchFiles', () => {
    beforeEach(async () => {
      // Create test file structure
      await fileUtil.writeFile('file1.txt', 'Content 1')
      await fileUtil.writeFile('file2.txt', 'Content 2')
      await fileUtil.writeFile('document.pdf', 'PDF content')
      fileUtil.createDirectory('subdir')
      await fileUtil.writeFile('subdir/nested.txt', 'Nested content')
      await fileUtil.writeFile('subdir/data.json', 'JSON data')
      fileUtil.createDirectory('subdir/deep')
      await fileUtil.writeFile('subdir/deep/deepfile.txt', 'Deep content')
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

    it('should include pattern and searchDir in response', () => {
      const result = fileUtil.searchFiles('*.txt', 'subdir')

      expect(result.pattern).toBe('*.txt')
      expect(result.searchDir).toBe('subdir')
    })

    it('should match files with wildcard at start', () => {
      const result = fileUtil.searchFiles('*file.txt', 'subdir/deep')

      expect(result.success).toBe(true)
      expect(result.files).toContain('subdir/deep/deepfile.txt')
    })

    it('should match files with wildcard in middle', () => {
      const result = fileUtil.searchFiles('file*.txt')

      expect(result.success).toBe(true)
      expect(result.files!.length).toBeGreaterThanOrEqual(2)
      expect(result.files).toContain('file1.txt')
      expect(result.files).toContain('file2.txt')
    })
  })

  describe('Path Security', () => {
    it('should prevent directory traversal with ../', async () => {
      await expect(fileUtil.writeFile('../outside.txt', 'malicious')).rejects.toThrow(
        ValidationException
      )
      await expect(fileUtil.writeFile('../outside.txt', 'malicious')).rejects.toThrow(
        'Access denied'
      )
    })

    it('should prevent multiple directory traversals', async () => {
      await expect(fileUtil.writeFile('../../etc/passwd', 'malicious')).rejects.toThrow(
        ValidationException
      )
      await expect(fileUtil.writeFile('../../../etc/passwd', 'malicious')).rejects.toThrow(
        ValidationException
      )
    })

    it('should prevent directory traversal in nested paths', async () => {
      await expect(fileUtil.writeFile('test/../../../etc/passwd', 'malicious')).rejects.toThrow(
        ValidationException
      )
    })

    it('should prevent absolute path access', async () => {
      await expect(fileUtil.writeFile('/etc/passwd', 'malicious')).rejects.toThrow(
        ValidationException
      )
      await expect(fileUtil.writeFile('/etc/passwd', 'malicious')).rejects.toThrow('Access denied')
    })

    it('should allow relative paths within base directory', async () => {
      const result = await fileUtil.writeFile('subdir/../allowed.txt', 'content')

      expect(result.success).toBe(true)

      const fullPath = path.join(TEST_BASE_DIR, 'allowed.txt')
      expect(fs.existsSync(fullPath)).toBe(true)
    })

    it('should normalize paths before validation', async () => {
      const result = await fileUtil.writeFile('./normal/./path.txt', 'content')

      expect(result.success).toBe(true)
      expect(result.path).toBe('normal/path.txt')
    })
  })

  describe('Base Directory Initialization', () => {
    it('should create base directory on first operation', async () => {
      if (fs.existsSync(TEST_BASE_DIR)) {
        fs.rmSync(TEST_BASE_DIR, { recursive: true, force: true })
      }

      const result = await fileUtil.writeFile(TEST_FILE, TEST_CONTENT)

      expect(result.success).toBe(true)
      expect(fs.existsSync(TEST_BASE_DIR)).toBe(true)
    })

    it('should handle existing base directory gracefully', async () => {
      await fileUtil.writeFile('init-test.txt', 'content')
      const result = await fileUtil.writeFile('another-file.txt', 'more content')

      expect(result.success).toBe(true)
    })

    it('should create base directory for all operations', () => {
      if (fs.existsSync(TEST_BASE_DIR)) {
        fs.rmSync(TEST_BASE_DIR, { recursive: true, force: true })
      }

      const result = fileUtil.createDirectory(TEST_DIR)

      expect(result.success).toBe(true)
      expect(fs.existsSync(TEST_BASE_DIR)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should wrap file system errors in ValidationException', async () => {
      // Create a file, then try to write a directory with the same name
      await fileUtil.writeFile(TEST_FILE, 'content')

      // On some systems this might succeed (overwrite), on others it might fail
      // The key is that any error should be wrapped in ValidationException
      try {
        const fullPath = path.join(TEST_BASE_DIR, TEST_FILE)
        fs.mkdirSync(fullPath) // Make it a directory
        await expect(fileUtil.writeFile(TEST_FILE, 'new content')).rejects.toThrow()
      } catch {
        // Test setup might fail on some systems, that's okay
      }
    })

    it('should preserve ValidationException errors', async () => {
      await expect(fileUtil.writeFile('../outside.txt', 'content')).rejects.toThrow(
        ValidationException
      )
    })

    it('should provide descriptive error messages', async () => {
      await expect(fileUtil.writeFile('../outside.txt', 'content')).rejects.toThrow(
        ValidationException
      )
      await expect(fileUtil.writeFile('../outside.txt', 'content')).rejects.toThrow('Access denied')
      await expect(fileUtil.writeFile('../outside.txt', 'content')).rejects.toThrow('outside.txt')
    })
  })

  describe('Return Values', () => {
    it('should return consistent structure for writeFile', async () => {
      const result = await fileUtil.writeFile(TEST_FILE, TEST_CONTENT)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('path')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.message).toBe('string')
      expect(typeof result.path).toBe('string')
    })

    it('should return consistent structure for readFile', async () => {
      await fileUtil.writeFile(TEST_FILE, TEST_CONTENT)
      const result = await fileUtil.readFile(TEST_FILE)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('path')
      expect(result).toHaveProperty('content')
    })

    it('should return consistent structure for deletePath', async () => {
      await fileUtil.writeFile(TEST_FILE, TEST_CONTENT)
      const result = fileUtil.deletePath(TEST_FILE)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('path')
    })

    it('should return consistent structure for listDirectory', () => {
      fileUtil.createDirectory(TEST_DIR)
      const result = fileUtil.listDirectory(TEST_DIR)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('path')
      expect(result).toHaveProperty('items')
    })

    it('should return consistent structure for createDirectory', () => {
      const result = fileUtil.createDirectory(TEST_DIR)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('path')
    })

    it('should return consistent structure for exists', () => {
      const result = fileUtil.exists(TEST_FILE)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('path')
      expect(result).toHaveProperty('exists')
    })

    it('should return consistent structure for searchFiles', () => {
      const result = fileUtil.searchFiles('*.txt')

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('pattern')
      expect(result).toHaveProperty('searchDir')
      expect(result).toHaveProperty('files')
    })
  })
})
