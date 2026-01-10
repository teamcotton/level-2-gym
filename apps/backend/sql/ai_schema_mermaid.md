erDiagram
users ||--o{ chats : "creates"
users ||--o{ audit_log : "performs"
chats ||--o{ messages : "contains"
messages ||--o{ parts : "has"
messages ||--o| ai_options : "configures"

    users {
        uuid user_id PK "Default: uuidv7()"
        text name "NOT NULL, 2-100 chars"
        text password "NULL or 60 chars (bcrypt)"
        citext email "NOT NULL, UNIQUE"
        text role "user|admin|moderator"
        text provider "NULL or 'google'"
        text provider_id "OAuth provider ID"
        timestamptz created_at "Default: now()"
    }

    chats {
        uuid id PK
        uuid user_id FK "REFERENCES users"
        timestamptz created_at "Default: now()"
        timestamptz updated_at "Default: now()"
    }

    messages {
        uuid id PK "Default: uuidv7()"
        uuid chat_id FK "REFERENCES chats"
        timestamptz created_at "Default: now()"
        varchar role "Max 15 chars"
    }

    ai_options {
        uuid id PK "Default: uuidv7()"
        uuid message_id FK "REFERENCES messages"
        text prompt "NOT NULL"
        integer max_tokens "CHECK > 0"
        numeric temperature "CHECK 0-2"
        numeric top_p "CHECK 0-1"
        numeric frequency_penalty "CHECK -2 to 2"
        numeric presence_penalty "CHECK -2 to 2"
        timestamptz created_at "Default: now()"
    }

    parts {
        uuid id PK "Default: uuidv7()"
        uuid message_id FK "REFERENCES messages"
        varchar type "Discriminator field"
        timestamptz created_at "Default: now()"
        integer order "Default: 0"
        text text_text "For type=text"
        text reasoning_text "For type=reasoning"
        varchar file_media_type "For type=file"
        varchar file_filename "For type=file"
        varchar file_url "For type=file"
        varchar source_url_source_id "For type=source_url"
        varchar source_url_url "For type=source_url"
        varchar source_url_title "For type=source_url"
        varchar source_document_source_id "For type=source_document"
        varchar source_document_media_type "For type=source_document"
        varchar source_document_title "For type=source_document"
        varchar source_document_filename "For type=source_document"
        varchar tool_tool_call_id "For tool types"
        varchar tool_state "For tool types"
        varchar tool_error_text "For tool types"
        jsonb tool_heart_of_darkness_qa_input "Tool-specific"
        jsonb tool_heart_of_darkness_qa_output "Tool-specific"
        varchar tool_heart_of_darkness_qa_error_text "Tool-specific"
        jsonb data_content "For type=data"
        jsonb provider_metadata "Provider-specific data"
    }

    audit_log {
        uuid id PK "Default: uuidv7()"
        uuid user_id FK "REFERENCES users, NULL"
        varchar entity_type "50 chars"
        uuid entity_id "Affected entity"
        varchar action "50 chars"
        jsonb changes "Before/after values"
        inet ip_address "Client IP"
        text user_agent "Client user agent"
        timestamptz created_at "Default: now()"
    }
