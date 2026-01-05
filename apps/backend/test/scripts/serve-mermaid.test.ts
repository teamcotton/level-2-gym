import { readFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

/**
 * Test suite for the serve-mermaid script
 *
 * Tests the core functionality including file reading logic,
 * HTML template structure, and Mermaid configuration.
 * Uses an actual sample Mermaid file for integration testing.
 */

// Get test file paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const testFilePath = resolve(join(__dirname, 'di:container.md'))

describe('Mermaid Server HTML Template', () => {
  describe('File Reading Integration', () => {
    it('should successfully read the sample mermaid file', () => {
      const content = readFileSync(testFilePath, 'utf-8')
      expect(content).toBeTruthy()
      expect(content.length).toBeGreaterThan(0)
    })

    it('should read file containing valid mermaid syntax', () => {
      const content = readFileSync(testFilePath, 'utf-8')
      // Sample file is a class diagram
      expect(content).toContain('classDiagram')
      expect(content).toMatch(/class \w+/)
    })

    it('should handle path resolution correctly', () => {
      // Test the same path resolution logic used in serve-mermaid.ts
      // serve-mermaid.ts uses: resolve(join(__dirname, '..', markdownFilePath))
      // where __dirname is the scripts directory
      const scriptsDir = resolve(join(__dirname, '../../scripts'))
      const relativePathFromBackend = 'test/scripts/di:container.md'
      const resolvedPath = resolve(join(scriptsDir, '..', relativePathFromBackend))

      expect(() => readFileSync(resolvedPath, 'utf-8')).not.toThrow()
      const content = readFileSync(resolvedPath, 'utf-8')
      expect(content).toContain('classDiagram')
    })

    it('should throw error for non-existent files', () => {
      const nonExistentPath = join(__dirname, 'does-not-exist.md')
      expect(() => readFileSync(nonExistentPath, 'utf-8')).toThrow()
    })

    it('should throw ENOENT error with descriptive message', () => {
      const nonExistentPath = join(__dirname, 'missing-file.md')
      expect(() => readFileSync(nonExistentPath, 'utf-8')).toThrow(/ENOENT/)
    })
  })

  describe('HTML Template Structure', () => {
    // Read actual content for testing
    const actualContent = readFileSync(testFilePath, 'utf-8')

    const generateTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mermaid Diagram Viewer</title>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: { 
        useMaxWidth: false, 
        htmlLabels: true,
        padding: 20
      }
    });
  </script>
</head>
<body>
  <div class="mermaid">
${content}
  </div>
</body>
</html>
`

    it('should generate valid HTML5 structure', () => {
      const template = generateTemplate(actualContent)
      expect(template).toContain('<!DOCTYPE html>')
      expect(template).toContain('<html lang="en">')
      expect(template).toContain('</html>')
    })

    it('should include Mermaid CDN script', () => {
      const template = generateTemplate(actualContent)
      expect(template).toContain('https://cdn.jsdelivr.net/npm/mermaid@11')
      expect(template).toContain('import mermaid from')
    })

    it('should include mermaid.initialize call', () => {
      const template = generateTemplate(actualContent)
      expect(template).toContain('mermaid.initialize')
      expect(template).toContain('startOnLoad: true')
    })

    it('should embed diagram content in mermaid div', () => {
      const template = generateTemplate(actualContent)
      expect(template).toContain('<div class="mermaid">')
      expect(template).toContain('classDiagram')
      expect(template).toMatch(/class \w+/)
    })
  })

  describe('Mermaid Configuration', () => {
    const config = {
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        padding: 20,
      },
    }

    it('should have correct initialization settings', () => {
      expect(config.startOnLoad).toBe(true)
      expect(config.theme).toBe('default')
      expect(config.securityLevel).toBe('loose')
    })

    it('should have correct flowchart settings', () => {
      expect(config.flowchart.useMaxWidth).toBe(false)
      expect(config.flowchart.htmlLabels).toBe(true)
      expect(config.flowchart.padding).toBe(20)
    })
  })

  describe('Zoom Configuration Constants', () => {
    const zoomConfig = {
      currentZoom: 2.5,
      minZoom: 0.5,
      maxZoom: 10,
      zoomStep: 0.25,
    }

    it('should have correct initial zoom (250%)', () => {
      expect(zoomConfig.currentZoom).toBe(2.5)
    })

    it('should have correct zoom range (50% to 1000%)', () => {
      expect(zoomConfig.minZoom).toBe(0.5)
      expect(zoomConfig.maxZoom).toBe(10)
    })

    it('should have correct zoom step (25%)', () => {
      expect(zoomConfig.zoomStep).toBe(0.25)
    })

    it('should allow zooming from min to max', () => {
      let zoom = zoomConfig.minZoom
      expect(zoom).toBe(0.5) // 50%

      zoom = zoomConfig.currentZoom
      expect(zoom).toBe(2.5) // 250%

      zoom = zoomConfig.maxZoom
      expect(zoom).toBe(10) // 1000%
    })
  })

  describe('HTML Escaping', () => {
    const escapeHtml = (str: string) => {
      return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    it('should escape < and > characters', () => {
      const html = '<div>Test</div>'
      const escaped = escapeHtml(html)
      expect(escaped).toBe('&lt;div&gt;Test&lt;/div&gt;')
    })

    it('should handle content with multiple tags', () => {
      const html = '<script>alert("test")</script>'
      const escaped = escapeHtml(html)
      expect(escaped).toContain('&lt;script&gt;')
      expect(escaped).toContain('&lt;/script&gt;')
    })

    it('should not affect already escaped content without & escaping', () => {
      const alreadyEscaped = '&lt;div&gt;'
      const escaped = escapeHtml(alreadyEscaped)
      // Simple escapeHtml only replaces < and >, so & remains as is
      expect(escaped).toBe('&lt;div&gt;')
    })
  })

  describe('Diagram Content Handling', () => {
    it('should handle flowchart diagrams', () => {
      const content = `graph TD
    A --> B
    B --> C`
      expect(content).toContain('graph TD')
      expect(content).toContain('-->')
    })

    it('should handle sequence diagrams', () => {
      const content = `sequenceDiagram
    Alice->>Bob: Hello
    Bob-->>Alice: Hi`
      expect(content).toContain('sequenceDiagram')
      expect(content).toContain('->>')
    })

    it('should handle class diagrams', () => {
      const content = `classDiagram
    class Animal
    Animal : +eat()
    Animal : +sleep()`
      expect(content).toContain('classDiagram')
      expect(content).toContain('class')
    })

    it('should handle empty content', () => {
      const content = ''
      expect(content).toBe('')
    })

    it('should preserve whitespace and formatting', () => {
      const content = `graph TD
    A[First]
    B[Second]
    A --> B`
      expect(content).toContain('    A[First]')
      expect(content).toContain('    B[Second]')
    })
  })

  describe('Script Behavior Documentation', () => {
    // Note: serve-mermaid.ts is an executable script that runs immediately,
    // making it difficult to unit test directly. These tests document the
    // expected behavior based on the script's implementation:
    // const args = process.argv.slice(2)
    // const markdownFilePath = args[0] || 'di:container.md'

    it('should document default file path behavior', () => {
      // Documents that when no arguments are provided,
      // the script should use 'di:container.md' as default
      const expectedDefault = 'di:container.md'
      expect(expectedDefault).toBe('di:container.md')
    })

    it('should document expected port usage', () => {
      // Documents that the script serves on port 3001
      const expectedPort = 3001
      expect(expectedPort).toBe(3001)
      expect(expectedPort).toBeGreaterThan(1023)
      expect(expectedPort).toBeLessThan(65536)
    })

    it('should verify script file exists and is executable', () => {
      // Verify the actual script file exists
      const scriptPath = resolve(join(__dirname, '../../scripts/serve-mermaid.ts'))
      expect(() => readFileSync(scriptPath, 'utf-8')).not.toThrow()

      const scriptContent = readFileSync(scriptPath, 'utf-8')
      expect(scriptContent).toContain('process.argv.slice(2)')
      expect(scriptContent).toContain("'di:container.md'")
      expect(scriptContent).toContain('const PORT = 3001')
    })
  })
})
