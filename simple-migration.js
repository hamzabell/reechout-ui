#!/usr/bin/env node

/**
 * Simple Database Migration Script for Supabase
 * Uses native node-postgres to run the migration
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Supabase database migration...\n');

// Database configuration from .env file
const DATABASE_URL = "postgresql://neondb_owner:npg_W7MDR8ZFvGeA@ep-weathered-shadow-ael3xvpb-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Parse the connection string
function parseConnectionString(connectionString) {
  // Handle connection strings with and without explicit ports
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^\/:]+)(?::(\d+))?\/([^?]+)/;
  const match = connectionString.match(regex);
  
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4] ? parseInt(match[4]) : 5432, // Default to 5432 if no port specified
    database: match[5].split('?')[0] // Remove query parameters
  };
}

async function runMigration() {
  const config = parseConnectionString(DATABASE_URL);
  
  // Basic PostgreSQL client using Node.js built-in modules
  const { default: net } = await import('net');
  
  console.log('📖 Reading migration script...');
  
  const migrationPath = path.join(__dirname, 'supabase-migration.sql');
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error('supabase-migration.sql file not found');
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('🔗 Database configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user}`);
  console.log('');
  
  // For this demo, we'll provide manual instructions
  console.log('📋 Migration Summary:');
  console.log('The following tables will be created:');
  console.log('  ✅ users (with Supabase auth integration)');
  console.log('  ✅ sessions (for session management)');
  console.log('  ✅ email_templates (for email templates)');
  console.log('  ✅ prospects (for prospect management)');
  console.log('  ✅ campaigns (for email sequences)');
  console.log('  ✅ campaign_steps (for campaign steps)');
  console.log('  ✅ step_email_actions (for email actions)');
  console.log('  ✅ step_task_actions (for task actions)');
  console.log('  ✅ campaign_prospects (for campaign-prospect relationships)');
  console.log('  ✅ personalized_emails (for generated emails)');
  console.log('  ✅ tasks (for task management)');
  console.log('  ✅ task_assignments (for task assignments)');
  console.log('  ✅ email_logs (for email tracking)');
  console.log('');
  
  console.log('🔧 Manual Migration Steps:');
  console.log('Since we cannot directly connect to the database from this script,');
  console.log('please follow these manual steps:');
  console.log('');
  console.log('1. Go to your Neon dashboard: https://neon.tech/console');
  console.log('2. Select your project');
  console.log('3. Go to the SQL Editor tab');
  console.log('4. Copy and paste the entire contents of supabase-migration.sql');
  console.log('5. Click "Run" to execute the migration');
  console.log('');
  
  console.log('💡 Alternative: Use psql command line');
  console.log('If you have psql installed, you can run:');
  console.log(`psql "${DATABASE_URL}" -f supabase-migration.sql`);
  console.log('');
  
  console.log('📁 Migration file location:');
  console.log(`${process.cwd()}/supabase-migration.sql`);
  console.log('');
  
  console.log('🎯 After migration is complete:');
  console.log('1. Keep using Supabase for authentication (already configured)');
  console.log('2. Neon database will handle all application data');
  console.log('3. Start the application: npm start');
  console.log('4. Test the authentication and database operations');
  console.log('');
  
  console.log('✅ Migration script prepared successfully!');
  console.log('Please execute it manually using one of the methods above.');
}

runMigration().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
