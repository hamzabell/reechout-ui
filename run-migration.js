#!/usr/bin/env node

/**
 * Direct Database Migration Script
 * Executes the SQL migration script against Supabase database
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');

console.log('🚀 Starting Supabase database migration...\n');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check if .env file exists and DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    console.log('📖 Reading migration script...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'supabase-migration.sql'), 
      'utf8'
    );

    console.log('🔗 Connecting to Supabase database...');
    const client = await pool.connect();

    try {
      console.log('🚀 Executing migration script...');
      await client.query(migrationSQL);
      console.log('✅ Migration completed successfully!\n');

      // Verify tables were created
      console.log('🔍 Verifying table creation...');
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);

      console.log('📋 Created tables:');
      result.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });

      console.log('\n🎉 Database migration completed successfully!');
      console.log('\n🎯 Next steps:');
      console.log('1. Configure Supabase email settings in your Supabase dashboard');
      console.log('2. Start the application: npm start');
      console.log('3. Test the authentication flow');

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused. Check your DATABASE_URL and network connection.');
    } else if (error.code === '28000') {
      console.log('\n💡 Authentication failed. Check your database credentials.');
    } else if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 Make sure your .env file contains:');
      console.log('DATABASE_URL=postgresql://postgres.jmedmpucaukshmwqumct:FHuYt4WRaJzZiLnb@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Check if pg module is available
try {
  require('pg');
} catch (error) {
  console.error('❌ pg module not found. Installing...');
  console.log('Please run: npm install pg');
  process.exit(1);
}

runMigration();
