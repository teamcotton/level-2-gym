import { describe, it, expect } from 'vitest'
import {
  mapUIMessagePartsToDBParts,
  mapDBPartToUIMessagePart,
} from '../../../src/shared/mapper/index.js'
import type { MyUIMessagePart } from '../../../src/shared/types/index.js'
import type { MyDBUIMessagePartSelect } from '../../../src/infrastructure/database/schema.js'

describe('Mapper', () => {
  const messageId = '01234567-89ab-cdef-0123-456789abcdef'

  describe('mapUIMessagePartsToDBParts', () => {
    it('should map text parts correctly', () => {
      const uiParts: MyUIMessagePart[] = [
        {
          type: 'text',
          text: 'Hello world',
        },
      ]

      const dbParts = mapUIMessagePartsToDBParts(uiParts, messageId)

      expect(dbParts).toHaveLength(1)
      expect(dbParts[0]).toMatchObject({
        messageId,
        order: 0,
        type: 'text',
        text_text: 'Hello world',
      })
    })

    it('should map data parts correctly', () => {
      const uiParts: MyUIMessagePart[] = [
        {
          type: 'data',
          data: {
            darkness: {
              response: 'Sample response from Heart of Darkness',
              loading: false,
            },
          },
        },
      ]

      const dbParts = mapUIMessagePartsToDBParts(uiParts, messageId)

      expect(dbParts).toHaveLength(1)
      expect(dbParts[0]).toMatchObject({
        messageId,
        order: 0,
        type: 'data',
        dataContent: {
          darkness: {
            response: 'Sample response from Heart of Darkness',
            loading: false,
          },
        },
      })
    })

    it('should map multiple parts with correct order', () => {
      const uiParts: MyUIMessagePart[] = [
        {
          type: 'text',
          text: 'First message',
        },
        {
          type: 'data',
          data: {
            darkness: {
              response: 'Quote from the novella',
              loading: false,
            },
          },
        },
        {
          type: 'text',
          text: 'Second message',
        },
      ]

      const dbParts = mapUIMessagePartsToDBParts(uiParts, messageId)

      expect(dbParts).toHaveLength(3)
      expect(dbParts[0].order).toBe(0)
      expect(dbParts[1].order).toBe(1)
      expect(dbParts[2].order).toBe(2)
      expect(dbParts[1].type).toBe('data')
    })
  })

  describe('mapDBPartToUIMessagePart', () => {
    it('should map text parts from DB to UI correctly', () => {
      const dbPart: MyDBUIMessagePartSelect = {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        messageId,
        type: 'text',
        order: 0,
        createdAt: new Date(),
        textText: 'Hello world',
        reasoningText: null,
        fileMediaType: null,
        fileFilename: null,
        fileUrl: null,
        sourceUrlSourceId: null,
        sourceUrlUrl: null,
        sourceUrlTitle: null,
        sourceDocumentSourceId: null,
        sourceDocumentMediaType: null,
        sourceDocumentTitle: null,
        sourceDocumentFilename: null,
        toolToolCallId: null,
        toolState: null,
        toolErrorText: null,
        dataContent: null,
        providerMetadata: null,
      }

      const uiPart = mapDBPartToUIMessagePart(dbPart)

      expect(uiPart).toEqual({
        type: 'text',
        text: 'Hello world',
      })
    })

    it('should map data parts from DB to UI correctly', () => {
      const dbPart: MyDBUIMessagePartSelect = {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        messageId,
        type: 'data',
        order: 0,
        createdAt: new Date(),
        textText: null,
        reasoningText: null,
        fileMediaType: null,
        fileFilename: null,
        fileUrl: null,
        sourceUrlSourceId: null,
        sourceUrlUrl: null,
        sourceUrlTitle: null,
        sourceDocumentSourceId: null,
        sourceDocumentMediaType: null,
        sourceDocumentTitle: null,
        sourceDocumentFilename: null,
        toolToolCallId: null,
        toolState: null,
        toolErrorText: null,
        dataContent: {
          darkness: {
            response: 'Sample response from Heart of Darkness',
            loading: false,
          },
        },
        providerMetadata: null,
      }

      const uiPart = mapDBPartToUIMessagePart(dbPart)

      expect(uiPart).toEqual({
        type: 'data',
        data: {
          darkness: {
            response: 'Sample response from Heart of Darkness',
            loading: false,
          },
        },
      })
    })

    it('should throw error for invalid data part structure from DB', () => {
      const dbPart: MyDBUIMessagePartSelect = {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        messageId,
        type: 'data',
        order: 0,
        createdAt: new Date(),
        textText: null,
        reasoningText: null,
        fileMediaType: null,
        fileFilename: null,
        fileUrl: null,
        sourceUrlSourceId: null,
        sourceUrlUrl: null,
        sourceUrlTitle: null,
        sourceDocumentSourceId: null,
        sourceDocumentMediaType: null,
        sourceDocumentTitle: null,
        sourceDocumentFilename: null,
        toolToolCallId: null,
        toolState: null,
        toolErrorText: null,
        dataContent: {
          // Invalid structure - not matching dataPartSchema
          invalidField: 'this should not be here',
        },
        providerMetadata: null,
      }

      expect(() => mapDBPartToUIMessagePart(dbPart)).toThrow('Invalid data part structure in database')
    })
  })
})
