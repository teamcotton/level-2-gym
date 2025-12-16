// Test setup file for Vitest
import '@testing-library/jest-dom'

import { vi } from 'vitest'

// Mock CSS imports
vi.mock('@mui/x-data-grid/esm/index.css', () => ({}))
