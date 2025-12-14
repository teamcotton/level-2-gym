import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  inet,
  index,
  check,
  customType,
} from 'drizzle-orm/pg-core'

// Define CITEXT custom type for case-insensitive text
const citext = customType<{ data: string }>({
  dataType() {
    return 'citext'
  },
})

/**
 * User table: Stores user account information
 */
export const user = pgTable(
  'users',
  {
    userId: uuid('user_id')
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text('name').notNull(),
    password: text('password').notNull(),
    email: citext('email').notNull().unique(),
    role: text('role').notNull().default('user'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    passwordLengthCheck: check('password_length_check', sql`length(${table.password}) = 60`),
    roleCheck: check('role_check', sql`${table.role} IN ('user', 'admin', 'moderator')`),
  })
)

/**
 * The DBUser type uses $inferInsert which is meant for insert operations.
 * Since this repository also performs read operations (findById, findByEmail),
 * you should also export a type for select operations using $inferSelect.
 * This would be: export type DBUserSelect = typeof user.$inferSelect
 *
 * The select type will include generated/default fields with their proper types,
 * while the insert type represents the input shape for inserts.
 */
export type DBUser = typeof user.$inferInsert
export type DBUserSelect = typeof user.$inferSelect

/**
 * Chats table: Stores chat sessions linked to users
 */
export const chats = pgTable(
  'chats',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.userId, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    userIdIdx: index('chats_user_id_idx').on(table.userId),
    userIdUpdatedAtIdx: index('chats_user_id_updated_at_idx').on(
      table.userId,
      sql`${table.updatedAt} DESC`
    ),
  })
)

/**
 * Messages table: Stores individual messages within chats
 */
export const messages = pgTable(
  'messages',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    role: varchar('role').notNull(),
  },
  (table) => ({
    chatIdIdx: index('messages_chat_id_idx').on(table.chatId),
    chatIdCreatedAtIdx: index('messages_chat_id_created_at_idx').on(table.chatId, table.createdAt),
    roleLengthCheck: check('role_length_check', sql`char_length(${table.role}) <= 15`),
  })
)

/**
 * Parts table: Stores message parts with polymorphic structure based on type field
 * Type discriminator values: text, reasoning, file, source_url, source_document,
 * step-start, data (for custom data parts - currently supports darkness, extensible for weather, etc.)
 */
export const parts = pgTable(
  'parts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    type: varchar('type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    order: integer('order').notNull().default(0),

    // Text fields
    textText: text('text_text'),

    // Reasoning fields
    reasoningText: text('reasoning_text'),

    // File fields
    fileMediaType: varchar('file_media_type'),
    fileFilename: varchar('file_filename'),
    fileUrl: varchar('file_url'),

    // Source URL fields
    sourceUrlSourceId: varchar('source_url_source_id'),
    sourceUrlUrl: varchar('source_url_url'),
    sourceUrlTitle: varchar('source_url_title'),

    // Source document fields
    sourceDocumentSourceId: varchar('source_document_source_id'),
    sourceDocumentMediaType: varchar('source_document_media_type'),
    sourceDocumentTitle: varchar('source_document_title'),
    sourceDocumentFilename: varchar('source_document_filename'),

    // Shared tool call columns
    toolToolCallId: varchar('tool_tool_call_id'),
    toolState: varchar('tool_state'),
    toolErrorText: varchar('tool_error_text'),

    // Data part fields (for custom data like darkness, weather, etc.)
    dataContent: jsonb('data_content'),

    // Provider metadata
    providerMetadata: jsonb('provider_metadata'),
  },
  (table) => ({
    messageIdIdx: index('parts_message_id_idx').on(table.messageId),
    messageIdOrderIdx: index('parts_message_id_order_idx').on(table.messageId, table.order),
    textTextRequiredIfTypeIsText: check(
      'text_text_required_if_type_is_text',
      sql`CASE WHEN ${table.type} = 'text' THEN ${table.textText} IS NOT NULL ELSE TRUE END`
    ),
    reasoningTextRequiredIfTypeIsReasoning: check(
      'reasoning_text_required_if_type_is_reasoning',
      sql`CASE WHEN ${table.type} = 'reasoning' THEN ${table.reasoningText} IS NOT NULL ELSE TRUE END`
    ),
    fileFieldsRequiredIfTypeIsFile: check(
      'file_fields_required_if_type_is_file',
      sql`CASE WHEN ${table.type} = 'file' THEN ${table.fileMediaType} IS NOT NULL AND ${table.fileUrl} IS NOT NULL ELSE TRUE END`
    ),
    sourceUrlFieldsRequiredIfTypeIsSourceUrl: check(
      'source_url_fields_required_if_type_is_source_url',
      sql`CASE WHEN ${table.type} = 'source_url' THEN ${table.sourceUrlSourceId} IS NOT NULL AND ${table.sourceUrlUrl} IS NOT NULL ELSE TRUE END`
    ),
    sourceDocumentFieldsRequiredIfTypeIsSourceDocument: check(
      'source_document_fields_required_if_type_is_source_document',
      sql`CASE WHEN ${table.type} = 'source_document' THEN ${table.sourceDocumentSourceId} IS NOT NULL AND ${table.sourceDocumentMediaType} IS NOT NULL AND ${table.sourceDocumentTitle} IS NOT NULL ELSE TRUE END`
    ),
    dataContentRequiredIfTypeIsData: check(
      'data_content_required_if_type_is_data',
      sql`CASE WHEN ${table.type} = 'data' THEN ${table.dataContent} IS NOT NULL ELSE TRUE END`
    ),
  })
)

/**
 * Audit log table: Tracks all significant actions and changes across the system
 * for security and compliance
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid('user_id').references(() => user.userId, {
      onDelete: 'set null',
    }),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    changes: jsonb('changes'),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    userIdIdx: index('audit_log_user_id_idx').on(table.userId),
    entityTypeEntityIdIdx: index('audit_log_entity_type_entity_id_idx').on(
      table.entityType,
      table.entityId
    ),
    createdAtIdx: index('audit_log_created_at_idx').on(sql`${table.createdAt} DESC`),
    actionIdx: index('audit_log_action_idx').on(table.action),
  })
)

export type MyDBUIMessagePart = typeof parts.$inferInsert
export type MyDBUIMessagePartSelect = typeof parts.$inferSelect
