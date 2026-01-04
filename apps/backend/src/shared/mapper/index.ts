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
          providerMetadata: part.providerMetadata,
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
          providerMetadata: part.providerMetadata,
        }
      case 'source-url':
        return {
          messageId,
          order: index,
          type: part.type,
          sourceUrlSourceId: part.sourceId,
          sourceUrlUrl: part.url,
          sourceUrlTitle: part.title,
          providerMetadata: part.providerMetadata,
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
          tool_toolCallId: part.toolCallId,
          tool_state: part.state,
          tool_heartOfDarknessQA_input:
            part.state === 'input-available' ||
            part.state === 'output-available' ||
            part.state === 'output-error'
              ? part.input
              : undefined,
          tool_heartOfDarknessQA_output:
            part.state === 'output-available' ? part.output : undefined,
          tool_heartOfDarknessQA_errorText:
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
        providerMetadata: part.providerMetadata as any,
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
        providerMetadata: part.providerMetadata as any,
      }
    case 'source-url':
      return {
        type: part.type,
        sourceId: part.sourceUrlSourceId!,
        url: part.sourceUrlUrl!,
        title: part.sourceUrlTitle!,
        providerMetadata: part.providerMetadata as any,
      }
    case 'step-start':
      return {
        type: part.type,
      }
    default:
      throw new Error(`Unsupported part type: ${part.type}`)
  }
}
