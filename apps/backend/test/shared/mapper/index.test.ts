import { describe, expect, it } from 'vitest'

import type { MyDBUIMessagePartSelect } from '../../../src/infrastructure/database/schema.js'
import {
  mapDBPartToUIMessagePart,
  mapUIMessagePartsToDBParts,
} from '../../../src/shared/mapper/index.js'
import type { MyUIMessagePart } from '../../../src/shared/types/index.js'

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
        textText: 'Hello world',
      })
    })

    it('should map multiple parts with correct order', () => {
      const uiParts: MyUIMessagePart[] = [
        {
          type: 'text',
          text: 'First message',
        },
        {
          type: 'text',
          text: 'Second message',
        },
        {
          type: 'text',
          text: 'Third message',
        },
      ]

      const dbParts = mapUIMessagePartsToDBParts(uiParts, messageId)

      expect(dbParts).toHaveLength(3)
      expect(dbParts[0]?.order).toBe(0)
      expect(dbParts[1]?.order).toBe(1)
      expect(dbParts[2]?.order).toBe(2)
      expect(dbParts[0]?.type).toBe('text')
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
        toolHeartOfDarknessQAInput: null,
        toolHeartOfDarknessQAOutput: null,
        toolHeartOfDarknessQAErrorText: null,
        dataContent: null,
        providerMetadata: null,
      }

      const uiPart = mapDBPartToUIMessagePart(dbPart)

      expect(uiPart).toEqual({
        type: 'text',
        text: 'Hello world',
      })
    })
  })
})
