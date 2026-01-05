import { beforeEach, describe, expect, it } from 'vitest'

import { HEART_OF_DARKNESS_MAPPINGS } from '../../../src/application/services/domain-keyword-mapping.config.js'
import { TextAnalysisService } from '../../../src/application/services/text-analysis.service.js'

describe('TextAnalysisService', () => {
  let service: TextAnalysisService
  let serviceWithDomainMappings: TextAnalysisService

  beforeEach(() => {
    service = new TextAnalysisService()
    serviceWithDomainMappings = new TextAnalysisService(HEART_OF_DARKNESS_MAPPINGS)
  })

  describe('extractRelevantPassages', () => {
    it('should extract passages containing question keywords', () => {
      const fullText = `
        The Nellie, a cruising yawl, swung to her anchor without a flutter of the sails.
        Marlow sat cross-legged right aft, leaning against the mizzen-mast.
        He had sunken cheeks, a yellow complexion, a straight back.
        The Director of Companies was our captain and our host.
        Kurtz was a remarkable man who collected ivory.
      `

      const question = 'Who was Kurtz?'
      const result = service.extractRelevantPassages(fullText, question)

      // Should extract passages containing "Kurtz"
      expect(result).toContain('Kurtz')
      expect(result).toContain('remarkable man')
    })

    it('should filter out stopwords from question', () => {
      const fullText = 'The river flowed through the jungle. Marlow traveled upriver.'
      const question = 'What is the river like?'

      const result = service.extractRelevantPassages(fullText, question)

      // Should find passages with "river" keyword (stopwords like "what", "is", "the" are filtered)
      expect(result).toContain('river')
    })

    it('should add domain-specific keywords for river questions', () => {
      const fullText = `
        The Thames was calm. Later, the Congo river proved treacherous.
        The water was dark and mysterious.
      `
      const question = 'What about the river?'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should include passages about rivers (thames, congo, river, water)
      expect(result.length).toBeGreaterThan(0)
      expect(result).toMatch(/thames|congo|river|water/i)
    })

    it('should add domain-specific keywords for Kurtz questions', () => {
      const fullText = `
        The ivory trade was profitable. The station agent reported to Kurtz.
        Kurtz collected more ivory than anyone.
      `
      const question = 'Tell me about Kurtz'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should include passages about Kurtz, ivory, station, agent
      expect(result).toContain('Kurtz')
      expect(result).toMatch(/ivory|station|agent/i)
    })

    it('should return beginning and end when no keywords match', () => {
      const fullText = 'A'.repeat(30000)
      const question = 'XYZ123 nonexistent keyword'

      const result = service.extractRelevantPassages(fullText, question)

      // Should return fallback format with beginning, [...], and ending
      expect(result).toContain('[...]')
      // add an extra 9 characters accounts for the separator: '\n\n[...]\n\n'
      expect(result.length).toBeLessThanOrEqual(25009)
    })

    it('should respect MAX_CONTEXT_LENGTH limit', () => {
      const fullText = 'A'.repeat(100000)
      const question = 'test'

      const result = service.extractRelevantPassages(fullText, question)

      // Should not exceed ~25000 characters
      expect(result.length).toBeLessThanOrEqual(25100) // Allow small buffer for separators
    })

    it('should merge overlapping passages', () => {
      const fullText = `
        Marlow began his story about Kurtz.
        Kurtz was in the Congo.
        The journey to find Kurtz was long.
      `
      const question = 'Marlow Kurtz'

      const result = service.extractRelevantPassages(fullText, question)

      // Should merge passages that overlap (both keywords appear close together)
      expect(result).toContain('Marlow')
      expect(result).toContain('Kurtz')
    })

    it('should separate non-overlapping passages with separators', () => {
      const text1 = 'First section with keyword alpha. '.repeat(30)
      const text2 = 'Middle section without keywords. '.repeat(50)
      const text3 = 'Last section with keyword alpha. '.repeat(30)
      const fullText = text1 + text2 + text3

      const question = 'alpha'
      const result = service.extractRelevantPassages(fullText, question)

      // Should contain separator between non-overlapping passages
      expect(result).toContain('---')
    })

    it('should prioritize passages with more keyword matches', () => {
      const fullText = `
        Section one mentions alpha once.
        ${'Middle boring section. '.repeat(100)}
        Section three mentions alpha beta gamma delta multiple keywords here.
      `
      const question = 'alpha beta gamma delta'

      const result = service.extractRelevantPassages(fullText, question)

      // Should prioritize section with more matches
      expect(result).toContain('Section three')
      expect(result).toContain('multiple keywords')
    })

    it('should handle empty text gracefully', () => {
      const fullText = ''
      const question = 'test'

      const result = service.extractRelevantPassages(fullText, question)

      // Should return empty result
      expect(result).toBe('')
    })

    it('should handle very short text', () => {
      const fullText = 'Short text.'
      const question = 'text'

      const result = service.extractRelevantPassages(fullText, question)

      // Should include the short text
      expect(result).toContain('Short text')
    })

    it('should extract passages for death/last words questions', () => {
      const fullText = `
        Kurtz died at the station. His last words were whispered.
        "The horror! The horror!" he said before death took him.
      `
      const question = 'What were his last words?'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should find passages about death, horror, whispered, died, last
      expect(result).toMatch(/horror|died|death|last|whispered/i)
    })

    it('should extract passages for attack questions', () => {
      const fullText = `
        The natives attacked with arrows and spears.
        The savages launched their attack at dawn.
      `
      const question = 'What happened during the attack?'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should find passages about arrows, natives, spears, attack, savages
      expect(result).toMatch(/arrows|natives|spears|attack|savages/i)
    })

    it('should extract passages for steamboat repair questions', () => {
      const fullText = `
        The steamboat needed repair. We waited for rivets to fix the boiler.
        The steam wreck was finally repaired.
      `
      const question = 'How was the steamboat repaired?'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should find passages about rivets, repair, boiler, steam, wreck
      expect(result).toMatch(/rivets|repair|boiler|steam|wreck/i)
    })

    it('should extract passages for poles/station questions', () => {
      const fullText = `
        The station had ornamental poles with heads.
        The skulls on the poles were a grim sight.
      `
      const question = 'What was at the station with the poles?'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should find passages about heads, skulls, poles, ornamental
      expect(result).toMatch(/heads|skulls|poles|ornamental/i)
    })
  })
})
