
CREATE TABLE users (
    user_id     UUID PRIMARY KEY DEFAULT uuidv7(),
    name        TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
    password    TEXT NOT NULL CHECK (length(password) = 60), -- bcrypt hash
    email       CITEXT      NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chats table: Stores chat sessions
CREATE TABLE chats (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for chats table
CREATE INDEX chats_user_id_idx ON chats(user_id);
CREATE INDEX chats_user_id_updated_at_idx ON chats(user_id, updated_at DESC);

-- Messages table: Stores individual messages within chats
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    created_at TIMESTAMPZ NOT NULL DEFAULT now(),
    role VARCHAR NOT NULL CONSTRAINT role_length_check CHECK (char_length(role) <= 15)
);

-- Indexes for messages table
CREATE INDEX messages_chat_id_idx ON messages(chat_id);
CREATE INDEX messages_chat_id_created_at_idx ON messages(chat_id, created_at);

-- AI options table: Stores model configuration parameters for each message
CREATE TABLE ai_options (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    max_output_tokens INTEGER NOT NULL CHECK (max_tokens > 0),
    temperature FLOAT NOT NULL,
    top_p FLOAT NOT NULL,
    frequency_penalty FLOAT NOT NULL,
    presence_penalty FLOAT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_options_message_id_idx ON ai_options(message_id);

-- Parts table: Stores message parts (text, files, tools, etc.)
CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    "order" INTEGER NOT NULL DEFAULT 0,

    -- Text fields
    text_text TEXT,

    -- Reasoning fields
    reasoning_text TEXT,

    -- File fields
    file_media_type VARCHAR,
    file_filename VARCHAR,
    file_url VARCHAR,

    -- Source URL fields
    source_url_source_id VARCHAR,
    source_url_url VARCHAR,
    source_url_title VARCHAR,

    -- Source document fields
    source_document_source_id VARCHAR,
    source_document_media_type VARCHAR,
    source_document_title VARCHAR,
    source_document_filename VARCHAR,

    -- Shared tool call columns
    tool_tool_call_id VARCHAR,
    tool_state VARCHAR,
    tool_error_text VARCHAR,

    -- Provider metadata
    provider_metadata JSONB,

    -- tools-specific fields
    tool_heart_of_darkness_qa_input JSONB,
    /* the input will be a JSON object:
     * "input": {
     *     "question": "Summarize Heart of Darkness"
     * }
     */
    tool_heart_of_darkness_qa_output JSONB,
    /* the output will be a JSON object:
     * "output": {
     *     "question": "Summarize Heart of Darkness",
     *     "textLength": 232885,
     *     "context": "﻿The Project Gutenberg eBook of Heart of"
     * }
     */
    tool_heart_of_darkness_qa_error_text VARCHAR,
    -- Check constraints: Enforce required fields based on part type
    CONSTRAINT text_text_required_if_type_is_text 
        CHECK (CASE WHEN type = 'text' THEN text_text IS NOT NULL ELSE TRUE END),
    
    CONSTRAINT reasoning_text_required_if_type_is_reasoning 
        CHECK (CASE WHEN type = 'reasoning' THEN reasoning_text IS NOT NULL ELSE TRUE END),
    
    CONSTRAINT file_fields_required_if_type_is_file 
        CHECK (CASE WHEN type = 'file' THEN file_media_type IS NOT NULL AND file_url IS NOT NULL ELSE TRUE END),
    
    CONSTRAINT source_url_fields_required_if_type_is_source_url 
        CHECK (CASE WHEN type = 'source_url' THEN source_url_source_id IS NOT NULL AND source_url_url IS NOT NULL ELSE TRUE END),
    
    CONSTRAINT source_document_fields_required_if_type_is_source_document 
        CHECK (CASE WHEN type = 'source_document' THEN source_document_source_id IS NOT NULL AND source_document_media_type IS NOT NULL AND source_document_title IS NOT NULL ELSE TRUE END)
);

-- Indexes for parts table
CREATE INDEX parts_message_id_idx ON parts(message_id);
CREATE INDEX parts_message_id_order_idx ON parts(message_id, "order");

-- Comments for documentation
COMMENT ON TABLE chats IS 'Stores chat sessions linked to users';
COMMENT ON TABLE messages IS 'Stores individual messages within chats';
COMMENT ON TABLE parts IS 'Stores message parts with polymorphic structure based on type field';

COMMENT ON COLUMN chats.user_id IS 'Foreign key linking chat to the user who created it';
COMMENT ON COLUMN chats.updated_at IS 'Timestamp of last activity in this chat, useful for sorting chat history';
COMMENT ON COLUMN parts.type IS 'Discriminator field - values: text, reasoning, file, source_url, source_document, tool-getWeatherInformation, tool-getLocation, data-weather';
COMMENT ON COLUMN parts."order" IS 'Order of parts within a message for proper sequencing';

-- Audit log table: Tracks all significant actions and changes in the system
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit_log table
CREATE INDEX audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX audit_log_entity_type_entity_id_idx ON audit_log(entity_type, entity_id);
CREATE INDEX audit_log_created_at_idx ON audit_log(created_at DESC);
CREATE INDEX audit_log_action_idx ON audit_log(action);

-- Comments for audit_log documentation
COMMENT ON TABLE audit_log IS 'Tracks all significant actions and changes across the system for security and compliance';
COMMENT ON COLUMN audit_log.user_id IS 'User who performed the action (nullable if action performed by system)';
COMMENT ON COLUMN audit_log.entity_type IS 'Type of entity affected (e.g., user, chat, message, part)';
COMMENT ON COLUMN audit_log.entity_id IS 'UUID of the affected entity';
COMMENT ON COLUMN audit_log.action IS 'Action performed (e.g., create, update, delete, login, logout)';
COMMENT ON COLUMN audit_log.changes IS 'JSONB object containing before/after values for updates, or relevant metadata';
COMMENT ON COLUMN audit_log.ip_address IS 'IP address from which the action was performed';
COMMENT ON COLUMN audit_log.user_agent IS 'User agent string of the client that performed the action';
COMMENT ON COLUMN audit_log.created_at IS 'Timestamp when the action was performed';
