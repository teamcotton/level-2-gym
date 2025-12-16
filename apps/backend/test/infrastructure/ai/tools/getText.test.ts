import * as fs from 'fs'
import * as path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { GetText, getText } from '../../../../src/infrastructure/ai/tools/getText.js'

describe('GetText', () => {
  const TEST_DATA_FOLDER = 'data'
  const TEST_FILE_NAME = 'test-file.txt'
  const TEST_CONTENT = 'This is test content for GetText'
  // FileUtil creates baseDir as: process.cwd()/dataFolder/dbName
  // GetText passes fileName as dbName, so: process.cwd()/data/test-file.txt
  // Then tries to read 'test-file.txt' from that baseDir: process.cwd()/data/test-file.txt
  const TEST_BASE_DIR = path.join(process.cwd(), TEST_DATA_FOLDER, TEST_FILE_NAME)

  let getTextInstance: GetText

  beforeEach(() => {
    // Create test file in the correct location
    const dir = path.dirname(TEST_BASE_DIR)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(TEST_BASE_DIR, TEST_CONTENT, 'utf8')

    // Create new instance for each test
    getTextInstance = new GetText(TEST_DATA_FOLDER, TEST_FILE_NAME)
  })

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(TEST_BASE_DIR)) {
      fs.unlinkSync(TEST_BASE_DIR)
    }
  })

  describe('Constructor', () => {
    it('should create instance with required parameters', () => {
      const instance = new GetText('data', 'test.txt')
      expect(instance).toBeInstanceOf(GetText)
    })

    it('should set filePath correctly', () => {
      const instance = new GetText('data', 'test.txt')
      const expectedPath = path.join(process.cwd(), 'data', 'test.txt')
      expect(instance.filePath).toBe(expectedPath)
    })

    it('should initialize empty cache', () => {
      const instance = new GetText('data', 'test.txt')
      expect(instance.getCachedPaths()).toHaveLength(0)
    })

    it('should handle nested file paths', () => {
      const instance = new GetText('data', 'nested/deep/file.txt')
      const expectedPath = path.join(process.cwd(), 'data', 'nested/deep/file.txt')
      expect(instance.filePath).toBe(expectedPath)
    })
  })

  describe('getText', () => {
    it('should read file content successfully', async () => {
      const content = await getTextInstance.getText()

      expect(content).toBe(TEST_CONTENT)
    })

    it('should cache content after reading', async () => {
      await getTextInstance.getText()

      expect(getTextInstance.hasCachedContent(getTextInstance.filePath)).toBe(true)
      expect(getTextInstance.getCachedContent(getTextInstance.filePath)).toBe(TEST_CONTENT)
    })

    it('should return same content on multiple calls', async () => {
      const firstRead = await getTextInstance.getText()
      const secondRead = await getTextInstance.getText()

      expect(firstRead).toBe(secondRead)
      expect(firstRead).toBe(TEST_CONTENT)
    })

    it('should throw error for non-existent file', async () => {
      const instance = new GetText(TEST_DATA_FOLDER, 'non-existent.txt')
      const expectedPath = path.join(process.cwd(), TEST_DATA_FOLDER, 'non-existent.txt')

      await expect(instance.getText()).rejects.toThrow(`Error reading file "${expectedPath}"`)
      await expect(instance.getText()).rejects.toThrow('File not found')
    })

    it('should handle empty file content', async () => {
      fs.writeFileSync(TEST_BASE_DIR, '', 'utf8')

      const content = await getTextInstance.getText()

      expect(content).toBeUndefined()
    })

    it('should update cache with latest content', async () => {
      await getTextInstance.getText()
      expect(getTextInstance.getCachedContent(getTextInstance.filePath)).toBe(TEST_CONTENT)

      // Modify file
      const newContent = 'Updated content'
      fs.writeFileSync(TEST_BASE_DIR, newContent, 'utf8')

      // Read again
      await getTextInstance.getText()
      expect(getTextInstance.getCachedContent(getTextInstance.filePath)).toBe(newContent)
    })

    it('should handle special characters in content', async () => {
      const specialContent = 'Special chars: 特殊文字 émojis 🎉 @#$%'
      fs.writeFileSync(TEST_BASE_DIR, specialContent, 'utf8')

      const content = await getTextInstance.getText()

      expect(content).toBe(specialContent)
    })

    it('should handle large file content', async () => {
      const largeContent = 'x'.repeat(10000)
      fs.writeFileSync(TEST_BASE_DIR, largeContent, 'utf8')

      const content = await getTextInstance.getText()

      expect(content).toBe(largeContent)
      expect(content?.length).toBe(10000)
    })

    it('should handle multiline content', async () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3\n'
      fs.writeFileSync(TEST_BASE_DIR, multilineContent, 'utf8')

      const content = await getTextInstance.getText()

      expect(content).toBe(multilineContent)
    })
  })

  describe('getCachedContent', () => {
    it('should return undefined for uncached file', () => {
      const content = getTextInstance.getCachedContent(getTextInstance.filePath)

      expect(content).toBeUndefined()
    })

    it('should return cached content after getText', async () => {
      await getTextInstance.getText()
      const cached = getTextInstance.getCachedContent(getTextInstance.filePath)

      expect(cached).toBe(TEST_CONTENT)
    })

    it('should return undefined for different file path', async () => {
      await getTextInstance.getText()
      const cached = getTextInstance.getCachedContent('different/path.txt')

      expect(cached).toBeUndefined()
    })

    it('should return correct content for multiple cached files', async () => {
      // Cache first file
      await getTextInstance.getText()

      // Create and cache second file
      const secondFileName = 'second-test.txt'
      const secondBaseDir = path.join(process.cwd(), TEST_DATA_FOLDER, secondFileName)
      fs.writeFileSync(secondBaseDir, 'Second content', 'utf8')

      const secondInstance = new GetText(TEST_DATA_FOLDER, secondFileName)
      await secondInstance.getText()

      // Verify both caches
      expect(getTextInstance.getCachedContent(getTextInstance.filePath)).toBe(TEST_CONTENT)
      expect(secondInstance.getCachedContent(secondInstance.filePath)).toBe('Second content')

      // Clean up
      if (fs.existsSync(secondBaseDir)) {
        fs.unlinkSync(secondBaseDir)
      }
    })
  })

  describe('hasCachedContent', () => {
    it('should return false for uncached file', () => {
      expect(getTextInstance.hasCachedContent(getTextInstance.filePath)).toBe(false)
    })

    it('should return true after caching content', async () => {
      await getTextInstance.getText()

      expect(getTextInstance.hasCachedContent(getTextInstance.filePath)).toBe(true)
    })

    it('should return false after clearing specific cache', async () => {
      await getTextInstance.getText()
      getTextInstance.clearCache(getTextInstance.filePath)

      expect(getTextInstance.hasCachedContent(getTextInstance.filePath)).toBe(false)
    })

    it('should return false after clearing all cache', async () => {
      await getTextInstance.getText()
      getTextInstance.clearCache()

      expect(getTextInstance.hasCachedContent(getTextInstance.filePath)).toBe(false)
    })

    it('should return false for different file path', async () => {
      await getTextInstance.getText()

      expect(getTextInstance.hasCachedContent('different/path.txt')).toBe(false)
    })
  })

  describe('clearCache', () => {
    it('should clear specific file from cache', async () => {
      await getTextInstance.getText()
      expect(getTextInstance.hasCachedContent(getTextInstance.filePath)).toBe(true)

      getTextInstance.clearCache(getTextInstance.filePath)

      expect(getTextInstance.hasCachedContent(getTextInstance.filePath)).toBe(false)
      expect(getTextInstance.getCachedContent(getTextInstance.filePath)).toBeUndefined()
    })

    it('should clear all files from cache when no path provided', async () => {
      await getTextInstance.getText()
      expect(getTextInstance.getCachedPaths()).toHaveLength(1)

      getTextInstance.clearCache()

      expect(getTextInstance.getCachedPaths()).toHaveLength(0)
      expect(getTextInstance.hasCachedContent(getTextInstance.filePath)).toBe(false)
    })

    it('should not affect other cached files when clearing specific file', async () => {
      // Cache first file
      await getTextInstance.getText()

      // Create and cache second file
      const secondFileName = 'second-clear-test.txt'
      const secondBaseDir = path.join(process.cwd(), TEST_DATA_FOLDER, secondFileName)
      fs.writeFileSync(secondBaseDir, 'Second content', 'utf8')

      const secondInstance = new GetText(TEST_DATA_FOLDER, secondFileName)
      await secondInstance.getText()

      // Clear only first file
      getTextInstance.clearCache(getTextInstance.filePath)

      expect(getTextInstance.hasCachedContent(getTextInstance.filePath)).toBe(false)
      expect(secondInstance.hasCachedContent(secondInstance.filePath)).toBe(true)

      // Clean up
      if (fs.existsSync(secondBaseDir)) {
        fs.unlinkSync(secondBaseDir)
      }
    })

    it('should handle clearing non-existent cache gracefully', () => {
      expect(() => getTextInstance.clearCache('non-existent.txt')).not.toThrow()
    })

    it('should handle clearing empty cache gracefully', () => {
      expect(() => getTextInstance.clearCache()).not.toThrow()
      expect(getTextInstance.getCachedPaths()).toHaveLength(0)
    })
  })

  describe('getCachedPaths', () => {
    it('should return empty array initially', () => {
      expect(getTextInstance.getCachedPaths()).toEqual([])
    })

    it('should return array with single path after caching', async () => {
      await getTextInstance.getText()
      const paths = getTextInstance.getCachedPaths()

      expect(paths).toHaveLength(1)
      expect(paths[0]).toBe(getTextInstance.filePath)
    })

    it('should return empty array after clearing cache', async () => {
      await getTextInstance.getText()
      getTextInstance.clearCache()

      expect(getTextInstance.getCachedPaths()).toEqual([])
    })

    it('should return array of paths for multiple cached files', async () => {
      await getTextInstance.getText()

      // Create second instance with different file
      const secondFileName = 'paths-test.txt'
      const secondBaseDir = path.join(process.cwd(), TEST_DATA_FOLDER, secondFileName)
      fs.writeFileSync(secondBaseDir, 'Content', 'utf8')

      const secondInstance = new GetText(TEST_DATA_FOLDER, secondFileName)
      await secondInstance.getText()

      const firstPaths = getTextInstance.getCachedPaths()
      const secondPaths = secondInstance.getCachedPaths()

      expect(firstPaths).toHaveLength(1)
      expect(secondPaths).toHaveLength(1)
      expect(firstPaths[0]).toBe(getTextInstance.filePath)
      expect(secondPaths[0]).toBe(secondInstance.filePath)

      // Clean up
      if (fs.existsSync(secondBaseDir)) {
        fs.unlinkSync(secondBaseDir)
      }
    })
  })

  describe('filePath property', () => {
    it('should be publicly accessible', () => {
      expect(getTextInstance.filePath).toBeDefined()
      expect(typeof getTextInstance.filePath).toBe('string')
    })

    it('should construct correct absolute path', () => {
      const expectedPath = path.join(process.cwd(), TEST_DATA_FOLDER, TEST_FILE_NAME)
      expect(getTextInstance.filePath).toBe(expectedPath)
    })

    it('should handle different data folders', () => {
      const instance = new GetText('custom-data', 'file.txt')
      const expectedPath = path.join(process.cwd(), 'custom-data', 'file.txt')
      expect(instance.filePath).toBe(expectedPath)
    })
  })

  describe('Legacy getText function', () => {
    it('should read file content using legacy function', async () => {
      const content = await getText('test-file.txt', TEST_DATA_FOLDER)

      expect(content).toBe(TEST_CONTENT)
    })

    it('should create new instance each time', async () => {
      const firstCall = await getText('test-file.txt', TEST_DATA_FOLDER)
      const secondCall = await getText('test-file.txt', TEST_DATA_FOLDER)

      expect(firstCall).toBe(secondCall)
      expect(firstCall).toBe(TEST_CONTENT)
    })

    it('should throw error for non-existent file', async () => {
      await expect(getText('non-existent.txt', TEST_DATA_FOLDER)).rejects.toThrow(
        'Error reading file'
      )
    })

    it('should handle empty file', async () => {
      fs.writeFileSync(TEST_BASE_DIR, '', 'utf8')

      const content = await getText('test-file.txt', TEST_DATA_FOLDER)

      expect(content).toBeUndefined()
    })

    it('should work with different data folders', async () => {
      const customFolder = 'custom-legacy'
      const customFile = 'legacy.txt'
      const customBaseDir = path.join(process.cwd(), customFolder, customFile)

      // Create directory and file
      const dir = path.dirname(customBaseDir)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(customBaseDir, 'Legacy content', 'utf8')

      const content = await getText('legacy.txt', customFolder)

      expect(content).toBe('Legacy content')

      // Clean up
      const customDir = path.join(process.cwd(), customFolder)
      if (fs.existsSync(customDir)) {
        fs.rmSync(customDir, { recursive: true, force: true })
      }
    })
  })

  describe('State Management', () => {
    it('should maintain separate cache per instance', async () => {
      const instance1 = new GetText(TEST_DATA_FOLDER, TEST_FILE_NAME)
      const secondFileName = 'state-test.txt'
      const secondBaseDir = path.join(process.cwd(), TEST_DATA_FOLDER, secondFileName)

      fs.writeFileSync(secondBaseDir, 'Second content', 'utf8')
      const instance2 = new GetText(TEST_DATA_FOLDER, secondFileName)

      await instance1.getText()
      await instance2.getText()

      expect(instance1.getCachedPaths()).toHaveLength(1)
      expect(instance2.getCachedPaths()).toHaveLength(1)
      expect(instance1.getCachedPaths()[0]).not.toBe(instance2.getCachedPaths()[0])

      // Clean up
      if (fs.existsSync(secondBaseDir)) {
        fs.unlinkSync(secondBaseDir)
      }
    })

    it('should preserve cache across multiple getText calls', async () => {
      await getTextInstance.getText()
      await getTextInstance.getText()
      await getTextInstance.getText()

      expect(getTextInstance.getCachedPaths()).toHaveLength(1)
      expect(getTextInstance.getCachedContent(getTextInstance.filePath)).toBe(TEST_CONTENT)
    })

    it('should allow cache inspection without modification', async () => {
      await getTextInstance.getText()

      const pathsBefore = getTextInstance.getCachedPaths()
      const contentBefore = getTextInstance.getCachedContent(getTextInstance.filePath)
      const hasCacheBefore = getTextInstance.hasCachedContent(getTextInstance.filePath)

      // Call getters again
      getTextInstance.getCachedPaths()
      getTextInstance.getCachedContent(getTextInstance.filePath)
      getTextInstance.hasCachedContent(getTextInstance.filePath)

      expect(getTextInstance.getCachedPaths()).toEqual(pathsBefore)
      expect(getTextInstance.getCachedContent(getTextInstance.filePath)).toBe(contentBefore)
      expect(getTextInstance.hasCachedContent(getTextInstance.filePath)).toBe(hasCacheBefore)
    })
  })

  describe('Error Scenarios', () => {
    it('should provide descriptive error message with file path', async () => {
      const instance = new GetText(TEST_DATA_FOLDER, 'missing-file.txt')

      await expect(instance.getText()).rejects.toThrow(Error)
      await expect(instance.getText()).rejects.toThrow('Error reading file')
      await expect(instance.getText()).rejects.toThrow('missing-file.txt')
    })

    it('should include detailed error information', async () => {
      const instance = new GetText(TEST_DATA_FOLDER, 'error-test.txt')

      await expect(instance.getText()).rejects.toThrow('File not found')
    })

    it('should not cache content when read fails', async () => {
      const instance = new GetText(TEST_DATA_FOLDER, 'fail-cache.txt')

      try {
        await instance.getText()
      } catch {
        // Error expected
      }

      expect(instance.hasCachedContent(instance.filePath)).toBe(false)
      expect(instance.getCachedPaths()).toHaveLength(0)
    })
  })
})
