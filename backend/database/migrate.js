const { pool } = require('../src/utils/db');

const migrations = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  plan VARCHAR(50) DEFAULT 'free',
  plan_status VARCHAR(50) DEFAULT 'active',
  subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100) NOT NULL,
  config JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'inactive',
  last_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  title VARCHAR(255),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL, -- 'salesforce', 'slack', 'gmail', etc.
  name VARCHAR(255),
  config JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'disconnected',
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports/Outputs table
CREATE TABLE IF NOT EXISTS outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- 'report', 'chart', 'analysis', etc.
  title VARCHAR(255),
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_outputs_user_id ON outputs(user_id);

-- OAuth tokens table
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  scopes JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

-- OAuth states table (for CSRF protection)
CREATE TABLE IF NOT EXISTS oauth_states (
  state VARCHAR(500) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Widgets table
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  config JSONB DEFAULT '{}',
  allowed_domains TEXT[] DEFAULT ARRAY['*']::TEXT[],
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Executions table (code execution logs)
CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  tool_name VARCHAR(100) NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add integration_type column if missing
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS integration_type VARCHAR(100);

-- Add configuration column to agents if using different name
ALTER TABLE agents ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}';

-- Add metadata column to conversations if not exists
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_widgets_agent ON widgets(agent_id);
CREATE INDEX IF NOT EXISTS idx_executions_user ON executions(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_conversation ON executions(conversation_id);
`;

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    await pool.query(migrations);
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
