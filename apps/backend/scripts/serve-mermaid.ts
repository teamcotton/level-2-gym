#!/usr/bin/env node
import { readFileSync } from 'fs'
import { createServer } from 'http'
import { dirname, join, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Escapes HTML special characters in a string
 */
export function escapeHtml(str: string): string {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Generates the HTML template for displaying a Mermaid diagram
 */
export function generateHtmlTemplate(markdownContent: string, markdownFilePath: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Diagram Viewer - ${markdownFilePath}</title>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'default',
       // from diagram content. Only relax this if all diagrams are fully trusted.
      securityLevel: 'strict',
      flowchart: { 
        useMaxWidth: false, 
        htmlLabels: true,
        padding: 20
      },
      class: {
        useMaxWidth: false
      },
      themeVariables: {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif'
      }
    });
  </script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      width: 98%;
      max-height: 90vh;
      overflow: visible;
    }
    .diagram-wrapper {
      width: 100%;
      height: 70vh;
      overflow: auto;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
      position: relative;
      cursor: grab;
    }
    .diagram-wrapper.dragging {
      cursor: grabbing;
      user-select: none;
    }
    .diagram-content {
      display: inline-block;
      min-width: 100%;
      min-height: 100%;
      padding: 20px;
    }
    .header {
      margin-bottom: 30px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 20px;
    }
    h1 {
      color: #333;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .file-path {
      color: #666;
      font-size: 14px;
      font-family: 'Monaco', 'Courier New', monospace;
      background: #f5f5f5;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
    }
    .mermaid {
      display: inline-block;
      transform-origin: top left;
      transition: transform 0.2s ease;
    }
    .mermaid svg {
      max-width: none !important;
      height: auto !important;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    .controls {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .zoom-controls {
      display: flex;
      gap: 5px;
      align-items: center;
      margin-left: auto;
    }
    .zoom-level {
      font-size: 14px;
      color: #666;
      min-width: 80px;
      text-align: center;
      font-weight: bold;
    }
    .zoom-info {
      font-size: 12px;
      color: #999;
      margin-left: 10px;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.3s;
    }
    button:hover {
      background: #5568d3;
    }
    pre {
      display: none;
      background: #f5f5f5;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 12px;
      margin-top: 20px;
    }
    pre.show {
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧜‍♀️ Mermaid Diagram Viewer</h1>
      <div class="file-path">${markdownFilePath}</div>
    </div>
    
    <div class="controls">
      <button onclick="toggleSource()">Toggle Source</button>
      <button onclick="window.print()">Print Diagram</button>
      <div class="zoom-controls">
        <button onclick="zoomOut()">- Zoom Out</button>
        <span class="zoom-level" id="zoom-level">250%</span>
        <button onclick="zoomIn()">+ Zoom In</button>
        <button onclick="resetZoom()">Reset</button>
        <span class="zoom-info">Use mouse wheel to zoom</span>
      </div>
    </div>
    
    <p style="text-align: center; color: #999; font-size: 12px; margin-bottom: 15px;">
      💡 <strong>Tip:</strong> Click and drag to pan the diagram when zoomed in
    </p>

    <div class="diagram-wrapper" id="diagram-wrapper">
      <div class="diagram-content">
        <div class="mermaid" id="mermaid-diagram">
${markdownContent}
        </div>
      </div>
    </div>

    <pre id="source"><code>${escapeHtml(markdownContent)}</code></pre>

    <div class="footer">
      Powered by <a href="https://mermaid.js.org/" target="_blank">Mermaid.js</a>
    </div>
  </div>

  <script>
    let currentZoom = 2.5; // Start at 250% for maximum legibility
    const minZoom = 0.5;
    const maxZoom = 10;
    const zoomStep = 0.25;

    // Panning state
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    function updateZoom() {
      const diagram = document.getElementById('mermaid-diagram');
      diagram.style.transform = \`scale(\${currentZoom})\`;
      document.getElementById('zoom-level').textContent = Math.round(currentZoom * 100) + '%';
    }

    function zoomIn() {
      currentZoom = Math.min(currentZoom + zoomStep, maxZoom);
      updateZoom();
    }

    function zoomOut() {
      currentZoom = Math.max(currentZoom - zoomStep, minZoom);
      updateZoom();
    }

    function resetZoom() {
      currentZoom = 2.5;
      updateZoom();
    }

    function toggleSource() {
      const source = document.getElementById('source');
      source.classList.toggle('show');
    }

    // Mouse wheel zoom support
    document.getElementById('diagram-wrapper').addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    }, { passive: false });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          resetZoom();
        }
      }
    });

    // Panning with mouse drag
    const wrapper = document.getElementById('diagram-wrapper');
    
    wrapper.addEventListener('mousedown', (e) => {
      // Only start dragging on left click and not on links
      if (e.button === 0 && e.target.tagName !== 'A') {
        isDragging = true;
        wrapper.classList.add('dragging');
        startX = e.pageX - wrapper.offsetLeft;
        startY = e.pageY - wrapper.offsetTop;
        scrollLeft = wrapper.scrollLeft;
        scrollTop = wrapper.scrollTop;
      }
    });

    wrapper.addEventListener('mouseleave', () => {
      isDragging = false;
      wrapper.classList.remove('dragging');
    });

    wrapper.addEventListener('mouseup', () => {
      isDragging = false;
      wrapper.classList.remove('dragging');
    });

    wrapper.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - wrapper.offsetLeft;
      const y = e.pageY - wrapper.offsetTop;
      const walkX = (x - startX) * 2; // Multiply by 2 for faster panning
      const walkY = (y - startY) * 2;
      wrapper.scrollLeft = scrollLeft - walkX;
      wrapper.scrollTop = scrollTop - walkY;
    });

     // Apply initial zoom after page loads, once Mermaid has rendered
    window.addEventListener('load', () => {
      const waitForMermaidAndZoom = () => {
        const svg = document.querySelector('.mermaid svg');
        if (svg) {
          updateZoom();
        } else {
          window.requestAnimationFrame(waitForMermaidAndZoom);
        }
      };
      window.requestAnimationFrame(waitForMermaidAndZoom);
    });
  </script>
</body>
</html>
`
}

/**
 * Reads markdown content from a file path
 */
export function readMarkdownFile(fullPath: string): string {
  try {
    return readFileSync(fullPath, 'utf-8')
  } catch (error) {
    throw new Error(
      `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Resolves the full path to a markdown file relative to the backend directory
 */
export function resolveMarkdownPath(markdownFilePath: string, scriptDir: string): string {
  return resolve(join(scriptDir, '..', markdownFilePath))
}

/**
 * Gets the markdown file path from command line arguments or returns default
 */
export function getMarkdownFilePath(args: string[]): string {
  return args[0] || 'di:container.md'
}

/**
 * Configuration constants for zoom functionality
 */
export const ZOOM_CONFIG = {
  currentZoom: 2.5,
  minZoom: 0.5,
  maxZoom: 10,
  zoomStep: 0.25,
} as const

/**
 * Mermaid configuration object
 */
export const MERMAID_CONFIG = {
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
    padding: 20,
  },
} as const

/**
 * Server port configuration
 */
export const PORT = 3001

// Only run the server if this module is the main module
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Get the markdown file path from command line arguments
  const args = process.argv.slice(2)
  const markdownFilePath = getMarkdownFilePath(args)

  // Resolve the path relative to the backend directory
  const fullPath = resolveMarkdownPath(markdownFilePath, __dirname)

  console.log(`📖 Reading file: ${fullPath}`)

  // Read the markdown/mermaid file
  let markdownContent: string
  try {
    markdownContent = readMarkdownFile(fullPath)
  } catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : 'Unknown error'}`)
    process.exit(1)
  }

  // Create HTML template with Mermaid support
  const htmlTemplate = generateHtmlTemplate(markdownContent, markdownFilePath)

  // Create HTTP server
  const server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(htmlTemplate)
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
    }
  })

  server.listen(PORT, () => {
    console.log(`\n✨ Mermaid viewer is running!`)
    console.log(`📊 Open your browser at: http://localhost:${PORT}`)
    console.log(`📝 Viewing: ${markdownFilePath}`)
    console.log(`\n🛑 Press Ctrl+C to stop the server\n`)
  })

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down server...')
    server.close(() => {
      console.log('✅ Server closed')
      process.exit(0)
    })
  })
}
