
-- PostgreSQL 18 Schema with UUIDv7 and Audit Logging
-- ==================================================

-- 1. users
CREATE TABLE users (
    user_id     UUID PRIMARY KEY DEFAULT uuidv7(),
    name        TEXT NOT NULL,
    password    TEXT NOT NULL CHECK (length(password) = 60), -- bcrypt hash
    email       CITEXT      NOT NULL UNIQUE,
    role        TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. questions
CREATE TABLE questions (
    question_id     UUID PRIMARY KEY DEFAULT uuidv7(),
    question_text   TEXT NOT NULL,
    answer_a        TEXT NOT NULL,
    answer_b        TEXT NOT NULL,
    answer_c        TEXT NOT NULL,
    answer_d        TEXT NOT NULL,
    correct_answers TEXT[] NOT NULL CHECK (
        array_length(correct_answers, 1) >= 1
        AND correct_answers <@ ARRAY['A','B','C','D']
    ),
    topic           TEXT,
    difficulty      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. answers
CREATE TABLE answers (
    answer_id     UUID PRIMARY KEY DEFAULT uuidv7(),
    question_id   UUID NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    answer_text   TEXT NOT NULL,
    is_correct    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX one_correct_answer_per_question
ON answers (question_id)
WHERE is_correct = TRUE;

-- 4. test_attempts
CREATE TABLE test_attempts (
    attempt_id    UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_test_attempts_user_id
ON test_attempts (user_id);

-- 5. user_answers
CREATE TABLE user_answers (
    attempt_id    UUID NOT NULL REFERENCES test_attempts(attempt_id) ON DELETE CASCADE,
    question_id   UUID NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    answer_id     UUID NOT NULL REFERENCES answers(answer_id) ON DELETE CASCADE,
    answered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (attempt_id, question_id)
);

CREATE INDEX idx_user_answers_attempt
ON user_answers (attempt_id);

CREATE INDEX idx_user_answers_question
ON user_answers (question_id);

-- 6. audit_log
CREATE TABLE audit_log (
    audit_id     UUID PRIMARY KEY DEFAULT uuidv7(),
    table_name   TEXT NOT NULL,
    operation    TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    row_id       UUID,
    old_data     JSONB,
    new_data     JSONB,
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id      UUID NULL
);

-- 7. audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_fn() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name,
        operation,
        row_id,
        old_data,
        new_data,
        user_id
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(
            (to_jsonb(NEW)->>'user_id'),
            (to_jsonb(NEW)->>'question_id'),
            (to_jsonb(NEW)->>'answer_id'),
            (to_jsonb(NEW)->>'attempt_id'),
            (to_jsonb(OLD)->>'user_id'),
            (to_jsonb(OLD)->>'question_id'),
            (to_jsonb(OLD)->>'answer_id'),
            (to_jsonb(OLD)->>'attempt_id')
        )::uuid,
        CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) END,
        NULL
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. audit triggers
CREATE TRIGGER audit_user_answers
AFTER INSERT OR UPDATE OR DELETE ON user_answers
FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_test_attempts
AFTER INSERT OR UPDATE OR DELETE ON test_attempts
FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_questions
AFTER INSERT OR UPDATE OR DELETE ON questions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_answers
AFTER INSERT OR UPDATE OR DELETE ON answers
FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
