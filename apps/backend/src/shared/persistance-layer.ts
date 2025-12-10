import { promises as fs } from 'fs'
import { join } from 'path'
import type { UIMessage } from 'ai'

export namespace DB {
  // Types for our persistence layer
  export interface Chat {
    id: string
    messages: UIMessage[]
    createdAt: string
    updatedAt: string
  }

  export interface PersistenceData {
    chats: DB.Chat[]
  }
}

// File path for storing the data
const DATA_FILE_PATH = join(process.cwd(), 'data', 'chats.local.json')
const LOCK_FILE_PATH = join(process.cwd(), 'data', 'chats.lock')

// Lock management
const LOCK_TIMEOUT = 10000 // 10 seconds timeout
const LOCK_RETRY_DELAY = 50 // 50ms retry delay

/**
 * Acquire a file lock with timeout
 */
async function acquireLock(): Promise<void> {
  const startTime = Date.now()

  while (true) {
    try {
      // Try to create the lock file exclusively (fails if it exists)
      await fs.writeFile(LOCK_FILE_PATH, String(process.pid), { flag: 'wx' })
      return // Lock acquired successfully
    } catch (error) {
      // Check if the error is because the file already exists
      const isLockHeld =
        error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST'

      if (!isLockHeld) {
        // Re-throw unexpected errors (e.g., permission issues)
        throw error
      }

      // Lock file exists, check if we've timed out
      if (Date.now() - startTime > LOCK_TIMEOUT) {
        throw new Error('Failed to acquire lock: timeout exceeded')
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_DELAY))
    }
  }
}

/**
 * Release the file lock
 */
async function releaseLock(): Promise<void> {
  try {
    await fs.unlink(LOCK_FILE_PATH)
  } catch (error) {
    // Only ignore "file not found" errors
    const isNotFound =
      error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'
    if (!isNotFound) {
      // Log or re-throw other errors (e.g., permission issues)
      console.error('Failed to release lock:', error)
    }
  }
}

/**
 * Execute a function with file locking
 */
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  await acquireLock()
  try {
    return await fn()
  } finally {
    await releaseLock()
  }
}

/**
 * Ensure the data directory exists
 */
async function ensureDataDirectory(): Promise<void> {
  const dataDir = join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

/**
 * Load all chats from the JSON file
 */
export async function loadChats(): Promise<DB.Chat[]> {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8')
    const parsed: DB.PersistenceData = JSON.parse(data)
    return parsed.chats || []
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return []
  }
}

/**
 * Save all chats to the JSON file (internal function, assumes lock is held)
 */
async function saveChatsInternal(chats: DB.Chat[]): Promise<void> {
  await ensureDataDirectory()
  const data: DB.PersistenceData = { chats }
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * Save all chats to the JSON file with locking
 */
export async function saveChats(chats: DB.Chat[]): Promise<void> {
  await withLock(() => saveChatsInternal(chats))
}

/**
 * Create a new chat with locking to prevent race conditions
 */
export async function createChat(id: string, initialMessages: UIMessage[] = []): Promise<DB.Chat> {
  return withLock(async () => {
    const chats = await loadChats()
    const now = new Date().toISOString()

    const newChat: DB.Chat = {
      id,
      messages: initialMessages,
      createdAt: now,
      updatedAt: now,
    }

    chats.push(newChat)
    await saveChatsInternal(chats)

    return newChat
  })
}

/**
 * Get a chat by ID
 */
export async function getChat(chatId: string): Promise<DB.Chat | null> {
  const chats = await loadChats()
  return chats.find((chat) => chat.id === chatId) || null
}

/**
 * Update a chat's messages with locking to prevent race conditions
 */
export async function appendToChatMessages(
  chatId: string,
  messages: UIMessage[]
): Promise<DB.Chat | null> {
  return withLock(async () => {
    const chats = await loadChats()
    const chatIndex = chats.findIndex((chat) => chat.id === chatId)

    if (chatIndex === -1) {
      return null
    }

    chats[chatIndex]!.messages = [...chats[chatIndex]!.messages, ...messages]
    chats[chatIndex]!.updatedAt = new Date().toISOString()

    await saveChatsInternal(chats)
    return chats[chatIndex]!
  })
}

/**
 * Delete a chat with locking to prevent race conditions
 */
export async function deleteChat(chatId: string): Promise<boolean> {
  return withLock(async () => {
    const chats = await loadChats()
    const initialLength = chats.length
    const filteredChats = chats.filter((chat) => chat.id !== chatId)

    if (filteredChats.length === initialLength) {
      return false // Chat not found
    }

    await saveChatsInternal(filteredChats)
    return true
  })
}
