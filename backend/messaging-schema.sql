-- AutoSphere Messaging Schema
-- Run this in pgAdmin Query Tool

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id               SERIAL PRIMARY KEY,
  participant1     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            VARCHAR(200),
  conversation_type VARCHAR(20) NOT NULL DEFAULT 'direct'
                   CHECK (conversation_type IN ('direct','support','booking_related')),
  related_booking_id  INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  related_vehicle_id  INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  status           VARCHAR(10) NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','archived','blocked')),
  last_message_at  TIMESTAMPTZ,
  last_message_id  INTEGER,
  unread_count_1   INTEGER NOT NULL DEFAULT 0,
  unread_count_2   INTEGER NOT NULL DEFAULT 0,
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_conversation_participants UNIQUE (participant1, participant2),
  CONSTRAINT no_self_conversation CHECK (participant1 <> participant2)
);

CREATE INDEX IF NOT EXISTS idx_conv_participant1    ON conversations(participant1);
CREATE INDEX IF NOT EXISTS idx_conv_participant2    ON conversations(participant2);
CREATE INDEX IF NOT EXISTS idx_conv_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_status          ON conversations(status);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id               SERIAL PRIMARY KEY,
  conversation_id  INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content          TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  message_type     VARCHAR(10) NOT NULL DEFAULT 'text'
                   CHECK (message_type IN ('text','image','file','system')),
  attachments      JSONB DEFAULT '[]',
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  read_at          TIMESTAMPTZ,
  is_edited        BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at        TIMESTAMPTZ,
  reply_to_id      INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msg_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_msg_sender_id       ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_created_at      ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msg_is_read         ON messages(is_read) WHERE is_read = FALSE;

-- Add FK from conversations.last_message_id -> messages.id (deferred to avoid circular)
ALTER TABLE conversations
  ADD CONSTRAINT fk_last_message
  FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_messages_updated_at ON messages;
CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
