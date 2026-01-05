/**
 * Configuration for domain-specific keyword mappings
 *
 * Defines how question content triggers additional domain-specific keywords
 * to improve text passage extraction accuracy.
 */

/**
 * Represents a mapping rule from question triggers to additional keywords
 */
export interface KeywordMappingRule {
  /** Keywords or phrases to look for in the question (case-insensitive) */
  triggers: string[]
  /** Additional keywords to add when triggers are found */
  keywords: string[]
}

/**
 * Collection of keyword mapping rules for a specific domain
 */
export interface DomainKeywordMapping {
  /** Name or identifier for this domain configuration */
  domain: string
  /** Array of keyword mapping rules */
  rules: KeywordMappingRule[]
}

/**
 * Heart of Darkness domain keyword mappings
 *
 * These mappings improve accuracy for questions about Joseph Conrad's novella
 * by adding relevant domain-specific terms based on question content.
 *
 * @example
 * Question: "What river does the story start on?"
 * Triggers: ["river"]
 * Additional keywords: ["thames", "congo", "river", "water"]
 */
export const HEART_OF_DARKNESS_MAPPINGS: DomainKeywordMapping = {
  domain: 'heart-of-darkness',
  rules: [
    {
      triggers: ['river'],
      keywords: ['thames', 'congo', 'river', 'water'],
    },
    {
      triggers: ['position', 'hired'],
      keywords: ['captain', 'steamboat', 'command', 'skipper', 'appointed'],
    },
    {
      triggers: ['kurtz'],
      keywords: ['kurtz', 'ivory', 'station', 'agent'],
    },
    {
      triggers: ['death', 'words'],
      keywords: ['horror', 'died', 'death', 'last', 'whispered'],
    },
    {
      triggers: ['attack'],
      keywords: ['arrows', 'natives', 'spears', 'attack', 'savages'],
    },
    {
      triggers: ['repair', 'steamboat'],
      keywords: ['rivets', 'repair', 'boiler', 'steam', 'wreck'],
    },
    {
      triggers: ['poles', 'station'],
      keywords: ['heads', 'skulls', 'poles', 'ornamental'],
    },
  ],
}
