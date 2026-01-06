import type { MyUIMessagePart } from '../types/index.js'
import type {
  MyDBUIMessagePart,
  MyDBUIMessagePartSelect,
} from '../../infrastructure/database/schema.js'
import type { LoggerPort } from '../../application/ports/logger.port.js'

export const mapUIMessagePartsToDBParts = (
  messageParts: MyUIMessagePart[],
  messageId: string,
  logger?: LoggerPort
): MyDBUIMessagePart[] => {
  if (logger) {
    logger.info('messageParts keys:', {
      parts: messageParts.map((part, idx) => ({ index: idx, keys: Object.keys(part) })),
    })
  }
  return messageParts.map((part, index) => {
    switch (part.type) {
      case 'text':
        return {
          messageId,
          order: index,
          type: part.type,
          textText: part.text,
        }
      case 'reasoning':
        return {
          messageId,
          order: index,
          type: part.type,
          reasoningText: part.text,
        }
      case 'file':
        return {
          messageId,
          order: index,
          type: part.type,
          fileMediaType: part.mediaType,
          fileFilename: part.filename,
          fileUrl: part.url,
        }
      case 'source-document':
        return {
          messageId,
          order: index,
          type: part.type,
          sourceDocumentSourceId: part.sourceId,
          sourceDocumentMediaType: part.mediaType,
          sourceDocumentTitle: part.title,
          sourceDocumentFilename: part.filename,
        }
      case 'source-url':
        return {
          messageId,
          order: index,
          type: part.type,
          sourceUrlSourceId: part.sourceId,
          sourceUrlUrl: part.url,
          sourceUrlTitle: part.title,
        }
      case 'step-start':
        return {
          messageId,
          order: index,
          type: part.type,
        }
      case 'tool-heartOfDarknessQA':
        return {
          messageId,
          order: index,
          type: part.type,
          toolToolCallId: part.toolCallId,
          toolState: part.state,
          toolHeartOfDarknessQAInput:
            part.state === 'input-available' ||
            part.state === 'output-available' ||
            part.state === 'output-error'
              ? part.input
              : undefined,
          toolHeartOfDarknessQAOutput: part.state === 'output-available' ? part.output : undefined,
          toolHeartOfDarknessQAErrorText:
            part.state === 'output-error' ? part.errorText : undefined,
        }
      default:
        throw new Error(`Unsupported part type: ${JSON.stringify(part)}`)
    }
  })
}

export const mapDBPartToUIMessagePart = (part: MyDBUIMessagePartSelect): MyUIMessagePart => {
  switch (part.type) {
    case 'text':
      return {
        type: part.type,
        text: part.textText!,
      }
    case 'reasoning':
      return {
        type: part.type,
        text: part.reasoningText!,
      }
    case 'file':
      return {
        type: part.type,
        mediaType: part.fileMediaType!,
        filename: part.fileFilename!,
        url: part.fileUrl!,
      }
    case 'source-document':
      return {
        type: part.type,
        sourceId: part.sourceDocumentSourceId!,
        mediaType: part.sourceDocumentMediaType!,
        title: part.sourceDocumentTitle!,
        filename: part.sourceDocumentFilename!,
      }
    case 'source-url':
      return {
        type: part.type,
        sourceId: part.sourceUrlSourceId!,
        url: part.sourceUrlUrl!,
        title: part.sourceUrlTitle!,
      }
    case 'step-start':
      return {
        type: part.type,
      }
    case 'tool-heartOfDarknessQA': {
      const baseToolPart = {
        type: 'dynamic-tool' as const,
        toolCallId: part.toolToolCallId!,
        toolName: 'heartOfDarknessQA' as const,
      }

      // Return appropriate structure based on state
      if (part.toolState === 'input-available') {
        return {
          ...baseToolPart,
          state: 'input-available' as const,
          input: part.toolHeartOfDarknessQAInput,
        }
      } else if (part.toolState === 'output-available') {
        return {
          ...baseToolPart,
          state: 'output-available' as const,
          input: part.toolHeartOfDarknessQAInput,
          output: part.toolHeartOfDarknessQAOutput,
        }
      } else if (part.toolState === 'output-error') {
        return {
          ...baseToolPart,
          state: 'output-error' as const,
          input: part.toolHeartOfDarknessQAInput,
          errorText: part.toolHeartOfDarknessQAErrorText!,
        }
      } else {
        // Treat missing or unknown tool state as a data integrity error
        throw new Error(`Invalid tool state for heartOfDarknessQA: ${String(part.toolState)}`)
      }
    }
    default:
      throw new Error(`Unsupported part type: ${part.type}`)
  }
}
