CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"changes" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_options" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"message_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"max_tokens" integer NOT NULL,
    "temperature" numeric NOT NULL,
    "top_p" numeric NOT NULL,
    "frequency_penalty" numeric NOT NULL,
    "presence_penalty" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "max_tokens_check" CHECK ("ai_options"."max_tokens" > 0),
    CONSTRAINT "temperature_range" CHECK ("ai_options"."temperature" >= 0 AND "ai_options"."temperature" <= 2),
    CONSTRAINT "top_p_range" CHECK ("ai_options"."top_p" >= 0 AND "ai_options"."top_p" <= 1),
    CONSTRAINT "frequency_penalty_range" CHECK ("ai_options"."frequency_penalty" >= -2 AND "ai_options"."frequency_penalty" <= 2),
    CONSTRAINT "presence_penalty_range" CHECK ("ai_options"."presence_penalty" >= -2 AND "ai_options"."presence_penalty" <= 2)
);
COMMENT ON TABLE "ai_options" IS 'Per-message AI request options (e.g. prompt, max_tokens, temperature, penalties) persisted for auditing and observability. Many of these columns correspond to fields in AISchema in packages/shared/src/schemas/ai.ts; AISchema is the application-level schema used when making AI calls, while this table stores a historical snapshot of the options that were actually used.';
COMMENT ON COLUMN "ai_options"."prompt" IS 'Full prompt text associated with a message. Stored intentionally for audit/debugging and traceability, even though it may be large. Consider normalizing or de-duplicating at the application level if storage becomes a concern.';
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"chat_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" varchar NOT NULL,
	CONSTRAINT "role_length_check" CHECK (char_length("messages"."role") <= 15)
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"message_id" uuid NOT NULL,
	"type" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"text_text" text,
	"reasoning_text" text,
	"file_media_type" varchar,
	"file_filename" varchar,
	"file_url" varchar,
	"source_url_source_id" varchar,
	"source_url_url" varchar,
	"source_url_title" varchar,
	"source_document_source_id" varchar,
	"source_document_media_type" varchar,
	"source_document_title" varchar,
	"source_document_filename" varchar,
	"tool_tool_call_id" varchar,
	"tool_state" varchar,
	"tool_error_text" varchar,
	"data_content" jsonb,
	"provider_metadata" jsonb,
	"tool_heart_of_darkness_qa_input" jsonb,
	"tool_heart_of_darkness_qa_output" jsonb,
	"tool_heart_of_darkness_qa_error_text" varchar,
	CONSTRAINT "text_text_required_if_type_is_text" CHECK (CASE WHEN "parts"."type" = 'text' THEN "parts"."text_text" IS NOT NULL ELSE TRUE END),
	CONSTRAINT "reasoning_text_required_if_type_is_reasoning" CHECK (CASE WHEN "parts"."type" = 'reasoning' THEN "parts"."reasoning_text" IS NOT NULL ELSE TRUE END),
	CONSTRAINT "file_fields_required_if_type_is_file" CHECK (CASE WHEN "parts"."type" = 'file' THEN "parts"."file_media_type" IS NOT NULL AND "parts"."file_url" IS NOT NULL ELSE TRUE END),
	CONSTRAINT "source_url_fields_required_if_type_is_source_url" CHECK (CASE WHEN "parts"."type" = 'source_url' THEN "parts"."source_url_source_id" IS NOT NULL AND "parts"."source_url_url" IS NOT NULL ELSE TRUE END),
	CONSTRAINT "source_document_fields_required_if_type_is_source_document" CHECK (CASE WHEN "parts"."type" = 'source_document' THEN "parts"."source_document_source_id" IS NOT NULL AND "parts"."source_document_media_type" IS NOT NULL AND "parts"."source_document_title" IS NOT NULL ELSE TRUE END),
	CONSTRAINT "data_content_required_if_type_is_data" CHECK (CASE WHEN "parts"."type" = 'data' THEN "parts"."data_content" IS NOT NULL ELSE TRUE END)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"email" "citext" NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "password_length_check" CHECK (length("users"."password") = 60),
	CONSTRAINT "role_check" CHECK ("users"."role" IN ('user', 'admin', 'moderator')),
	CONSTRAINT "name_length_check" CHECK (length("users"."name") >= 2 AND length("users"."name") <= 100)
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_options" ADD CONSTRAINT "ai_options_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at" DESC);--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "ai_options_message_id_idx" ON "ai_options" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "chats_user_id_idx" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chats_user_id_updated_at_idx" ON "chats" USING btree ("user_id","updated_at" DESC);--> statement-breakpoint
CREATE INDEX "messages_chat_id_idx" ON "messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "messages_chat_id_created_at_idx" ON "messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "parts_message_id_idx" ON "parts" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "parts_message_id_order_idx" ON "parts" USING btree ("message_id","order");