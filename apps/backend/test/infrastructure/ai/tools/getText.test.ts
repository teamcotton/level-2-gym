import * as fs from 'fs'
import * as path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { GetText, getText } from '../../../../src/infrastructure/ai/tools/getText.js'

describe('getText (legacy function)', () => {
  const TEST_DATA_FOLDER = 'test-data'
  const TEST_DB_NAME = 'test-db'
  const TEST_BASE_DIR = path.join(process.cwd(), TEST_DATA_FOLDER, TEST_DB_NAME)
  const HEART_OF_DARKNESS_FILE = 'heart-of-darkness.txt'
  const HEART_OF_DARKNESS_CONTENT = `The Nellie, a cruising yawl, swung to her anchor without a flutter of
the sails, and was at rest. The flood had made, the wind was nearly
calm, and being bound down the river, the only thing for it was to
come to and wait for the turn of the tide.`

  beforeEach(() => {
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

  describe('Happy Path', () => {
    it('should successfully read heart-of-darkness.txt when file exists', async () => {
      // Arrange: Create the test file
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const filePath = path.join(TEST_BASE_DIR, HEART_OF_DARKNESS_FILE)
      fs.writeFileSync(filePath, HEART_OF_DARKNESS_CONTENT, 'utf8')

      // Act: Call getText
      const result = await getText(HEART_OF_DARKNESS_FILE, TEST_DATA_FOLDER, TEST_DB_NAME)

      // Assert: Verify the content is returned
      expect(result).toBeDefined()
      expect(result).toBe(HEART_OF_DARKNESS_CONTENT)
    })

    it('should successfully read any text file when it exists', async () => {
      // Arrange: Create a different test file
      const testFileName = 'test-novel.txt'
      const testContent = 'This is a test novel content.'
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const filePath = path.join(TEST_BASE_DIR, testFileName)
      fs.writeFileSync(filePath, testContent, 'utf8')

      // Act: Call getText
      const result = await getText(testFileName, TEST_DATA_FOLDER, TEST_DB_NAME)

      // Assert: Verify the content is returned
      expect(result).toBeDefined()
      expect(result).toBe(testContent)
    })

    it('should return undefined for empty files (edge case in current implementation)', async () => {
      // Arrange: Create an empty file
      const emptyFileName = 'empty.txt'
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const filePath = path.join(TEST_BASE_DIR, emptyFileName)
      fs.writeFileSync(filePath, '', 'utf8')

      // Act: Call getText
      const result = await getText(emptyFileName, TEST_DATA_FOLDER, TEST_DB_NAME)

      // Assert: Empty content returns undefined due to truthy check on content
      // Note: This is a limitation in the current implementation
      expect(result).toBeUndefined()
    })

    it('should handle files with special characters', async () => {
      // Arrange: Create file with special characters
      const specialContent = 'Special chars: 特殊文字 émojis 🎉 @#$%\n\tNew line and tab'
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const filePath = path.join(TEST_BASE_DIR, HEART_OF_DARKNESS_FILE)
      fs.writeFileSync(filePath, specialContent, 'utf8')

      // Act: Call getText
      const result = await getText(HEART_OF_DARKNESS_FILE, TEST_DATA_FOLDER, TEST_DB_NAME)

      // Assert: Special characters should be preserved
      expect(result).toBeDefined()
      expect(result).toBe(specialContent)
    })
  })

  describe('Unhappy Path', () => {
    it('should throw an error when file does not exist', async () => {
      // Arrange: No file created, directory may or may not exist
      const nonExistentFile = 'non-existent-file.txt'

      // Act & Assert: Expect an error to be thrown
      await expect(getText(nonExistentFile, TEST_DATA_FOLDER, TEST_DB_NAME)).rejects.toThrow(
        'Error reading file'
      )
    })

    it('should throw an error with descriptive message when file does not exist', async () => {
      // Arrange: No file created
      const nonExistentFile = 'missing-novel.txt'

      // Act & Assert: Expect specific error message
      await expect(getText(nonExistentFile, TEST_DATA_FOLDER, TEST_DB_NAME)).rejects.toThrow(
        /File not found/
      )
    })

    it('should throw an error when trying to access file outside base directory', async () => {
      // Arrange: Try to access file with path traversal
      const maliciousPath = '../../../etc/passwd'

      // Act & Assert: Expect an error to be thrown
      await expect(getText(maliciousPath, TEST_DATA_FOLDER, TEST_DB_NAME)).rejects.toThrow()
    })

    it('should throw an error when directory does not exist and file does not exist', async () => {
      // Arrange: Ensure base directory doesn't exist
      if (fs.existsSync(TEST_BASE_DIR)) {
        fs.rmSync(TEST_BASE_DIR, { recursive: true, force: true })
      }

      // Act & Assert: Expect an error to be thrown
      await expect(getText(HEART_OF_DARKNESS_FILE, TEST_DATA_FOLDER, TEST_DB_NAME)).rejects.toThrow(
        'Error reading file'
      )
    })
  })

  describe('Integration with Different Database Names', () => {
    it('should work with different database names', async () => {
      // Arrange: Use a different database name
      const customDbName = 'custom-db'
      const customBaseDir = path.join(process.cwd(), TEST_DATA_FOLDER, customDbName)
      const content = 'Content in custom database'

      try {
        fs.mkdirSync(customBaseDir, { recursive: true })
        const filePath = path.join(customBaseDir, HEART_OF_DARKNESS_FILE)
        fs.writeFileSync(filePath, content, 'utf8')

        // Act: Call getText with custom db name
        const result = await getText(HEART_OF_DARKNESS_FILE, TEST_DATA_FOLDER, customDbName)

        // Assert: Verify the content is returned
        expect(result).toBeDefined()
        expect(result).toBe(content)
      } finally {
        // Clean up
        if (fs.existsSync(customBaseDir)) {
          fs.rmSync(customBaseDir, { recursive: true, force: true })
        }
      }
    })

    it('should work with different data folders', async () => {
      // Arrange: Use a different data folder
      const customDataFolder = 'custom-data'
      const customBaseDir = path.join(process.cwd(), customDataFolder, TEST_DB_NAME)
      const content = 'Content in custom folder'

      try {
        fs.mkdirSync(customBaseDir, { recursive: true })
        const filePath = path.join(customBaseDir, HEART_OF_DARKNESS_FILE)
        fs.writeFileSync(filePath, content, 'utf8')

        // Act: Call getText with custom data folder
        const result = await getText(HEART_OF_DARKNESS_FILE, customDataFolder, TEST_DB_NAME)

        // Assert: Verify the content is returned
        expect(result).toBeDefined()
        expect(result).toBe(content)
      } finally {
        // Clean up
        if (fs.existsSync(path.join(process.cwd(), customDataFolder))) {
          fs.rmSync(path.join(process.cwd(), customDataFolder), { recursive: true, force: true })
        }
      }
    })
  })
})

describe('GetText (class)', () => {
  const TEST_DATA_FOLDER = 'test-data'
  const TEST_DB_NAME = 'test-db'
  const TEST_BASE_DIR = path.join(process.cwd(), TEST_DATA_FOLDER, TEST_DB_NAME)
  const HEART_OF_DARKNESS_FILE = 'heart-of-darkness.txt'
  const HEART_OF_DARKNESS_CONTENT = `The Nellie, a cruising yawl, swung to her anchor without a flutter of
the sails, and was at rest. The flood had made, the wind was nearly
calm, and being bound down the river, the only thing for it was to
come to and wait for the turn of the tide.`

  let getTextInstance: GetText

  beforeEach(() => {
    // Create a new GetText instance for each test
    getTextInstance = new GetText(TEST_DATA_FOLDER, TEST_DB_NAME)

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
      const instance = new GetText()
      expect(instance).toBeInstanceOf(GetText)
    })

    it('should create instance with custom parameters', () => {
      const instance = new GetText('custom-data', 'custom-db')
      expect(instance).toBeInstanceOf(GetText)
    })
  })

  describe('getText method', () => {
    it('should successfully read and cache file content', async () => {
      // Arrange: Create the test file
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const filePath = path.join(TEST_BASE_DIR, HEART_OF_DARKNESS_FILE)
      fs.writeFileSync(filePath, HEART_OF_DARKNESS_CONTENT, 'utf8')

      // Act: Call getText
      const result = await getTextInstance.getText(HEART_OF_DARKNESS_FILE)

      // Assert: Verify the content is returned and cached
      expect(result).toBeDefined()
      expect(result).toBe(HEART_OF_DARKNESS_CONTENT)
      expect(getTextInstance.hasCachedContent(HEART_OF_DARKNESS_FILE)).toBe(true)
    })

    it('should throw error for non-existent file', async () => {
      // Act & Assert
      await expect(getTextInstance.getText('non-existent.txt')).rejects.toThrow(
        'Error reading file'
      )
    })

    it('should cache multiple files independently', async () => {
      // Arrange: Create multiple test files
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const file1 = 'file1.txt'
      const file2 = 'file2.txt'
      const content1 = 'Content of file 1'
      const content2 = 'Content of file 2'
      fs.writeFileSync(path.join(TEST_BASE_DIR, file1), content1, 'utf8')
      fs.writeFileSync(path.join(TEST_BASE_DIR, file2), content2, 'utf8')

      // Act: Read both files
      const result1 = await getTextInstance.getText(file1)
      const result2 = await getTextInstance.getText(file2)

      // Assert: Both are cached independently
      expect(result1).toBe(content1)
      expect(result2).toBe(content2)
      expect(getTextInstance.hasCachedContent(file1)).toBe(true)
      expect(getTextInstance.hasCachedContent(file2)).toBe(true)
    })
  })

  describe('getCachedContent method', () => {
    it('should return cached content after reading file', async () => {
      // Arrange: Create and read file
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const filePath = path.join(TEST_BASE_DIR, HEART_OF_DARKNESS_FILE)
      fs.writeFileSync(filePath, HEART_OF_DARKNESS_CONTENT, 'utf8')
      await getTextInstance.getText(HEART_OF_DARKNESS_FILE)

      // Act: Get cached content
      const cached = getTextInstance.getCachedContent(HEART_OF_DARKNESS_FILE)

      // Assert: Cached content matches
      expect(cached).toBe(HEART_OF_DARKNESS_CONTENT)
    })

    it('should return undefined for non-cached file', () => {
      // Act: Get cached content for file that was never read
      const cached = getTextInstance.getCachedContent('never-read.txt')

      // Assert: Returns undefined
      expect(cached).toBeUndefined()
    })
  })

  describe('hasCachedContent method', () => {
    it('should return true for cached file', async () => {
      // Arrange: Create and read file
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const filePath = path.join(TEST_BASE_DIR, HEART_OF_DARKNESS_FILE)
      fs.writeFileSync(filePath, HEART_OF_DARKNESS_CONTENT, 'utf8')
      await getTextInstance.getText(HEART_OF_DARKNESS_FILE)

      // Act & Assert
      expect(getTextInstance.hasCachedContent(HEART_OF_DARKNESS_FILE)).toBe(true)
    })

    it('should return false for non-cached file', () => {
      // Act & Assert
      expect(getTextInstance.hasCachedContent('never-read.txt')).toBe(false)
    })
  })

  describe('clearCache method', () => {
    it('should clear specific file from cache', async () => {
      // Arrange: Create and read multiple files
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const file1 = 'file1.txt'
      const file2 = 'file2.txt'
      fs.writeFileSync(path.join(TEST_BASE_DIR, file1), 'Content 1', 'utf8')
      fs.writeFileSync(path.join(TEST_BASE_DIR, file2), 'Content 2', 'utf8')
      await getTextInstance.getText(file1)
      await getTextInstance.getText(file2)

      // Act: Clear only file1
      getTextInstance.clearCache(file1)

      // Assert: file1 is cleared, file2 remains
      expect(getTextInstance.hasCachedContent(file1)).toBe(false)
      expect(getTextInstance.hasCachedContent(file2)).toBe(true)
    })

    it('should clear all files from cache when no path provided', async () => {
      // Arrange: Create and read multiple files
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const file1 = 'file1.txt'
      const file2 = 'file2.txt'
      fs.writeFileSync(path.join(TEST_BASE_DIR, file1), 'Content 1', 'utf8')
      fs.writeFileSync(path.join(TEST_BASE_DIR, file2), 'Content 2', 'utf8')
      await getTextInstance.getText(file1)
      await getTextInstance.getText(file2)

      // Act: Clear all cache
      getTextInstance.clearCache()

      // Assert: All files are cleared
      expect(getTextInstance.hasCachedContent(file1)).toBe(false)
      expect(getTextInstance.hasCachedContent(file2)).toBe(false)
    })
  })

  describe('getCachedPaths method', () => {
    it('should return empty array when no files cached', () => {
      // Act & Assert
      expect(getTextInstance.getCachedPaths()).toEqual([])
    })

    it('should return all cached file paths', async () => {
      // Arrange: Create and read multiple files
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const file1 = 'file1.txt'
      const file2 = 'file2.txt'
      const file3 = 'file3.txt'
      fs.writeFileSync(path.join(TEST_BASE_DIR, file1), 'Content 1', 'utf8')
      fs.writeFileSync(path.join(TEST_BASE_DIR, file2), 'Content 2', 'utf8')
      fs.writeFileSync(path.join(TEST_BASE_DIR, file3), 'Content 3', 'utf8')
      await getTextInstance.getText(file1)
      await getTextInstance.getText(file2)
      await getTextInstance.getText(file3)

      // Act
      const cachedPaths = getTextInstance.getCachedPaths()

      // Assert: All paths are returned
      expect(cachedPaths).toHaveLength(3)
      expect(cachedPaths).toContain(file1)
      expect(cachedPaths).toContain(file2)
      expect(cachedPaths).toContain(file3)
    })
  })

  describe('State Management Integration', () => {
    it('should maintain state across multiple operations', async () => {
      // Arrange: Create test files
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const file1 = 'novel1.txt'
      const file2 = 'novel2.txt'
      const content1 = 'Novel 1 content'
      const content2 = 'Novel 2 content'
      fs.writeFileSync(path.join(TEST_BASE_DIR, file1), content1, 'utf8')
      fs.writeFileSync(path.join(TEST_BASE_DIR, file2), content2, 'utf8')

      // Act: Perform multiple operations
      await getTextInstance.getText(file1)
      await getTextInstance.getText(file2)
      getTextInstance.clearCache(file1)
      const paths = getTextInstance.getCachedPaths()
      const cached2 = getTextInstance.getCachedContent(file2)

      // Assert: State is maintained correctly
      expect(paths).toEqual([file2])
      expect(cached2).toBe(content2)
      expect(getTextInstance.hasCachedContent(file1)).toBe(false)
    })

    it('should allow re-reading after cache clear', async () => {
      // Arrange: Create and read file
      fs.mkdirSync(TEST_BASE_DIR, { recursive: true })
      const filePath = path.join(TEST_BASE_DIR, HEART_OF_DARKNESS_FILE)
      fs.writeFileSync(filePath, HEART_OF_DARKNESS_CONTENT, 'utf8')
      await getTextInstance.getText(HEART_OF_DARKNESS_FILE)

      // Act: Clear and re-read
      getTextInstance.clearCache(HEART_OF_DARKNESS_FILE)
      const result = await getTextInstance.getText(HEART_OF_DARKNESS_FILE)

      // Assert: File is re-read and re-cached
      expect(result).toBe(HEART_OF_DARKNESS_CONTENT)
      expect(getTextInstance.hasCachedContent(HEART_OF_DARKNESS_FILE)).toBe(true)
    })
  })
})
