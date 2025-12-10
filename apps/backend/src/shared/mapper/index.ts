import type { MyUIMessagePart, MyDataPart } from '../types/index.js'
import { dataPartSchema } from '../types/index.js'
import type {
  MyDBUIMessagePart,
  MyDBUIMessagePartSelect,
} from '../../infrastructure/database/schema.js'

export const mapUIMessagePartsToDBParts = (
  messageParts: MyUIMessagePart[],
  messageId: string
): MyDBUIMessagePart[] => {
  return messageParts.map((part, index) => {
    switch (part.type) {
      case 'text':
        return {
          messageId,
          order: index,
          type: part.type,
          text_text: part.text,
        }
      case 'reasoning':
        return {
          messageId,
          order: index,
          type: part.type,
          reasoning_text: part.text,
          providerMetadata: part.providerMetadata,
        }
      case 'file':
        return {
          messageId,
          order: index,
          type: part.type,
          file_mediaType: part.mediaType,
          file_filename: part.filename,
          file_url: part.url,
        }
      case 'source-document':
        return {
          messageId,
          order: index,
          type: part.type,
          source_document_sourceId: part.sourceId,
          source_document_mediaType: part.mediaType,
          source_document_title: part.title,
          source_document_filename: part.filename,
          providerMetadata: part.providerMetadata,
        }
      case 'source-url':
        return {
          messageId,
          order: index,
          type: part.type,
          source_url_sourceId: part.sourceId,
          source_url_url: part.url,
          source_url_title: part.title,
          providerMetadata: part.providerMetadata,
        }
      case 'step-start':
        return {
          messageId,
          order: index,
          type: part.type,
        }
      case 'data':
        return {
          messageId,
          order: index,
          type: part.type,
          dataContent: part.data,
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
    case 'data':
      // Validate data structure at runtime to ensure database integrity
      try {
        const validatedData = dataPartSchema.parse(part.dataContent)
        return {
          type: part.type,
          data: validatedData,
        }
      } catch (error) {
        throw new Error(
          `Invalid data part structure in database: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    default:
      throw new Error(`Unsupported part type: ${part.type}`)
  }
}
