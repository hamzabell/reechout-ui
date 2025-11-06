-- Supabase Database Migration Script for Reechout Application
-- This script creates all the necessary tables for the email sequence management system

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for enums
CREATE TYPE IF NOT EXISTS sequence_status AS ENUM (
  'DRAFT',
  'ACTIVE', 
  'PAUSED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE IF NOT EXISTS prospect_status AS ENUM (
  'NEW',
  'CONTACTED',
  'ENGAGED', 
  'REPLIED',
  'INTERESTED',
  'NOT_INTERESTED',
  'OPTED_OUT',
  'CONVERTED',
  'BOUNCED'
);

CREATE TYPE IF NOT EXISTS email_status AS ENUM (
  'PENDING',
  'SCHEDULED',
  'SENT',
  'DELIVERED',
  'OPENED',
  'REPLIED',
  'BOUNCED',
  'FAILED'
);

CREATE TYPE IF NOT EXISTS task_status AS ENUM (
  'PENDING',
  'COMPLETED',
  'CANCELLED'
);

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS personalized_emails CASCADE;
DROP TABLE IF EXISTS campaign_prospects CASCADE;
DROP TABLE IF EXISTS step_task_actions CASCADE;
DROP TABLE IF EXISTS step_email_actions CASCADE;
DROP TABLE IF EXISTS campaign_steps CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table - Integrated with Supabase Auth
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  supabase_id TEXT UNIQUE NOT NULL, -- Supabase auth user ID
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  email_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table for user session management
CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Templates table
CREATE TABLE email_templates (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prospects table
CREATE TABLE prospects (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company TEXT,
  title TEXT,
  website TEXT,
  industry TEXT,
  linkedin_profile TEXT,
  phone_number TEXT,
  location TEXT,
  notes TEXT,
  research_data JSONB,
  source TEXT,
  is_opted_out BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  status prospect_status DEFAULT 'NEW',
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns (Sequences) table
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  description TEXT,
  status sequence_status DEFAULT 'DRAFT',
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Steps table
CREATE TABLE campaign_steps (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, day)
);

-- Step Email Actions table
CREATE TABLE step_email_actions (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  step_id TEXT UNIQUE NOT NULL REFERENCES campaign_steps(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES email_templates(id),
  custom_subject TEXT,
  custom_body TEXT,
  enable_personalization BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step Task Actions table
CREATE TABLE step_task_actions (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  step_id TEXT UNIQUE NOT NULL REFERENCES campaign_steps(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  task_description TEXT,
  enable_email_notification BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign-Prospect relationship table
CREATE TABLE campaign_prospects (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status prospect_status DEFAULT 'NEW',
  UNIQUE(campaign_id, prospect_id)
);

-- Personalized Emails table
CREATE TABLE personalized_emails (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  campaign_prospect_id TEXT NOT NULL REFERENCES campaign_prospects(id) ON DELETE CASCADE,
  step_email_action_id TEXT NOT NULL REFERENCES step_email_actions(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status email_status DEFAULT 'PENDING',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_prospect_id, step_email_action_id)
);

-- Tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  step_task_action_id TEXT NOT NULL REFERENCES step_task_actions(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  due_date TIMESTAMP WITH TIME ZONE,
  status task_status DEFAULT 'PENDING',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Assignments table
CREATE TABLE task_assignments (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Email Logs table
CREATE TABLE email_logs (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  personalized_email_id TEXT REFERENCES personalized_emails(id),
  "to" TEXT NOT NULL,
  "from" TEXT NOT NULL,
  subject TEXT NOT NULL,
  status email_status DEFAULT 'PENDING',
  provider_id TEXT,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  bounced_reason TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaign_prospects_campaign_id ON campaign_prospects(campaign_id);
CREATE INDEX idx_campaign_prospects_prospect_id ON campaign_prospects(prospect_id);
CREATE INDEX idx_personalized_emails_status ON personalized_emails(status);
CREATE INDEX idx_personalized_emails_campaign_prospect_id ON personalized_emails(campaign_prospect_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_users_supabase_id ON users(supabase_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Create function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_steps_updated_at BEFORE UPDATE ON campaign_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_step_email_actions_updated_at BEFORE UPDATE ON step_email_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_step_task_actions_updated_at BEFORE UPDATE ON step_task_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personalized_emails_updated_at BEFORE UPDATE ON personalized_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate CUID-like IDs
CREATE OR REPLACE FUNCTION generate_cuid()
RETURNS TEXT AS $$
DECLARE
    alphabet TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    -- Generate a simple random ID (similar to CUID format)
    FOR i IN 1..25 LOOP
        result := result || substr(alphabet, floor(random() * length(alphabet)) + 1, 1);
    END LOOP;
    
    -- Ensure it starts with a letter
    result := 'c' || substr(result, 1, 24);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - adjust according to your needs)
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = supabase_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = supabase_id);

-- Users can only see their own prospects
CREATE POLICY "Users can view own prospects" ON prospects FOR SELECT USING (created_by = auth.uid()::text);
CREATE POLICY "Users can insert own prospects" ON prospects FOR INSERT WITH CHECK (created_by = auth.uid()::text);
CREATE POLICY "Users can update own prospects" ON prospects FOR UPDATE USING (created_by = auth.uid()::text);
CREATE POLICY "Users can delete own prospects" ON prospects FOR DELETE USING (created_by = auth.uid()::text);

-- Users can only see their own campaigns
CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (created_by = auth.uid()::text);
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (created_by = auth.uid()::text);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (created_by = auth.uid()::text);
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (created_by = auth.uid()::text);

-- Similar policies for other tables...
CREATE POLICY "Users can view own email templates" ON email_templates FOR SELECT USING (created_by = auth.uid()::text);
CREATE POLICY "Users can insert own email templates" ON email_templates FOR INSERT WITH CHECK (created_by = auth.uid()::text);
CREATE POLICY "Users can update own email templates" ON email_templates FOR UPDATE USING (created_by = auth.uid()::text);
CREATE POLICY "Users can delete own email templates" ON email_templates FOR DELETE USING (created_by = auth.uid()::text);

-- Session policies
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (user_id = auth.uid()::text);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Database migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Created tables:';
    RAISE NOTICE '- ✅ users (with Supabase auth integration)';
    RAISE NOTICE '- ✅ sessions (for session management)';
    RAISE NOTICE '- ✅ email_templates (for email templates)';
    RAISE NOTICE '- ✅ prospects (for prospect management)';
    RAISE NOTICE '- ✅ campaigns (for email sequences)';
    RAISE NOTICE '- ✅ campaign_steps (for campaign steps)';
    RAISE NOTICE '- ✅ step_email_actions (for email actions)';
    RAISE NOTICE '- ✅ step_task_actions (for task actions)';
    RAISE NOTICE '- ✅ campaign_prospects (for campaign-prospect relationships)';
    RAISE NOTICE '- ✅ personalized_emails (for generated emails)';
    RAISE NOTICE '- ✅ tasks (for task management)';
    RAISE NOTICE '- ✅ task_assignments (for task assignments)';
    RAISE NOTICE '- ✅ email_logs (for email tracking)';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Enabled Row Level Security (RLS)';
    RAISE NOTICE '📈 Created indexes for better performance';
    RAISE NOTICE '🔄 Added automatic updated_at triggers';
END $$;
