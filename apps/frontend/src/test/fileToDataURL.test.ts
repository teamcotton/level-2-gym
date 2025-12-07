import { describe, expect, it } from 'vitest'

import { fileToDataURL } from '../application/services/fileToDataURL.js'

describe('fileToDataURL', () => {
  it('should reject when no file is provided', async () => {
    // @ts-expect-error - Testing invalid input
    await expect(fileToDataURL(null)).rejects.toThrow('No file provided')
    // @ts-expect-error - Testing invalid input
    await expect(fileToDataURL(undefined)).rejects.toThrow('No file provided')
  })

  it('should convert a text file to data URL', async () => {
    const fileContent = 'Hello, World!'
    const file = new File([fileContent], 'test.txt', { type: 'text/plain' })

    const result = await fileToDataURL(file)

    expect(result).toContain('data:text/plain;base64,')
    expect(result).toBeTruthy()
  })

  it('should convert an image file to data URL', async () => {
    const file = new File(['fake-image-data'], 'image.png', { type: 'image/png' })

    const result = await fileToDataURL(file)

    expect(result).toContain('data:image/png;base64,')
    expect(result).toBeTruthy()
  })

  it('should convert a PDF file to data URL', async () => {
    const file = new File(['pdf-content'], 'document.pdf', { type: 'application/pdf' })

    const result = await fileToDataURL(file)

    expect(result).toContain('data:application/pdf;base64,')
    expect(result).toBeTruthy()
  })

  it('should handle empty file', async () => {
    const file = new File([], 'empty.txt', { type: 'text/plain' })

    const result = await fileToDataURL(file)

    expect(result).toContain('data:text/plain;base64,')
    expect(result).toBeTruthy()
  })

  it('should preserve file content in base64 encoding', async () => {
    const content = 'Test content 123'
    const file = new File([content], 'test.txt', { type: 'text/plain' })

    const result = await fileToDataURL(file)

    // Decode the base64 part and verify content
    const base64Data = result.split(',')[1]
    expect(base64Data).toBeDefined()
    const decodedContent = atob(base64Data!)
    expect(decodedContent).toBe(content)
  })

  it('should handle files with special characters', async () => {
    const content = '特殊文字 émojis 🎉 symbols @#$%'
    const file = new File([content], 'special.txt', { type: 'text/plain' })

    const result = await fileToDataURL(file)

    expect(result).toContain('data:text/plain;base64,')
    expect(result).toBeTruthy()
  })

  it('should handle large files', async () => {
    // Create a 1MB file
    const largeContent = 'a'.repeat(1024 * 1024)
    const file = new File([largeContent], 'large.txt', { type: 'text/plain' })

    const result = await fileToDataURL(file)

    expect(result).toContain('data:text/plain;base64,')
    expect(result.length).toBeGreaterThan(1024 * 1024)
  })

  it('should handle different MIME types correctly', async () => {
    const mimeTypes = [
      { type: 'application/json', prefix: 'data:application/json;base64,' },
      { type: 'text/html', prefix: 'data:text/html;base64,' },
      { type: 'image/jpeg', prefix: 'data:image/jpeg;base64,' },
      { type: 'application/octet-stream', prefix: 'data:application/octet-stream;base64,' },
    ]

    for (const { prefix, type } of mimeTypes) {
      const file = new File(['test'], 'test', { type })
      const result = await fileToDataURL(file)
      expect(result).toContain(prefix)
    }
  })

  it('should reject when FileReader encounters an error', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })

    // Mock FileReader to simulate an error
    const originalFileReader = global.FileReader
    const mockError = new Error('Test error message')

    class MockFileReader {
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null
      onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null
      result: string | ArrayBuffer | null = null
      error: DOMException | null = null

      readAsDataURL() {
        setTimeout(() => {
          // @ts-expect-error - Setting error property for test
          this.error = mockError
          if (this.onerror) {
            this.onerror.call(
              this as unknown as FileReader,
              new ProgressEvent('error') as ProgressEvent<FileReader>
            )
          }
        }, 0)
      }
    }

    global.FileReader = MockFileReader as unknown as typeof FileReader

    await expect(fileToDataURL(file)).rejects.toThrow('Failed to read file: Test error message')

    // Restore original FileReader
    global.FileReader = originalFileReader
  })

  it('should reject when FileReader result is not a string', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })

    // Mock FileReader to return non-string result
    const originalFileReader = global.FileReader

    class MockFileReader {
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null
      onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null
      result: string | ArrayBuffer | null = null

      readAsDataURL() {
        setTimeout(() => {
          // Set result to ArrayBuffer instead of string
          this.result = new ArrayBuffer(8)
          if (this.onload) {
            this.onload.call(
              this as unknown as FileReader,
              new ProgressEvent('load') as ProgressEvent<FileReader>
            )
          }
        }, 0)
      }
    }

    global.FileReader = MockFileReader as unknown as typeof FileReader

    await expect(fileToDataURL(file)).rejects.toThrow('Failed to read file as data URL')

    // Restore original FileReader
    global.FileReader = originalFileReader
  })

  it('should return a string', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })

    const result = await fileToDataURL(file)

    expect(typeof result).toBe('string')
  })

  it('should work with binary data', async () => {
    // Create binary data (e.g., image bytes)
    const binaryData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) // PNG header
    const file = new File([binaryData], 'test.png', { type: 'image/png' })

    const result = await fileToDataURL(file)

    expect(result).toContain('data:image/png;base64,')
    expect(result).toBeTruthy()
  })

  it('should handle files without extension', async () => {
    const file = new File(['content'], 'noextension', { type: 'text/plain' })

    const result = await fileToDataURL(file)

    expect(result).toContain('data:text/plain;base64,')
    expect(result).toBeTruthy()
  })

  it('should process files sequentially when called multiple times', async () => {
    const file1 = new File(['file1'], 'test1.txt', { type: 'text/plain' })
    const file2 = new File(['file2'], 'test2.txt', { type: 'text/plain' })
    const file3 = new File(['file3'], 'test3.txt', { type: 'text/plain' })

    const [result1, result2, result3] = await Promise.all([
      fileToDataURL(file1),
      fileToDataURL(file2),
      fileToDataURL(file3),
    ])

    expect(result1).toContain('data:text/plain;base64,')
    expect(result2).toContain('data:text/plain;base64,')
    expect(result3).toContain('data:text/plain;base64,')

    // All results should be different because content is different
    expect(result1).not.toBe(result2)
    expect(result2).not.toBe(result3)
  })
})
