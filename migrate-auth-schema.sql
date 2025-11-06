-- Migration script: Rename supabaseUserId to neonUserId
-- This script updates the database schema to work with Neon Auth instead of Supabase

-- Rename the column from supabaseUserId to neonUserId
ALTER TABLE users RENAME COLUMN "supabaseUserId" TO "neonUserId";

-- Update any existing constraints or indexes if needed
-- The unique constraint should be automatically renamed

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'neonUserId';
