#!/usr/bin/env node

/**
 * Database Migration Script for Supabase + Prisma
 * 
 * This script will:
 * 1. Load environment variables
 * 2. Generate Prisma client
 * 3. Push schema changes to Supabase database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

console.log('🚀 Setting up Supabase database with Prisma...\n');

try {
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Please create it with Supabase credentials.');
    process.exit(1);
  }

  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables.');
    console.log('💡 Make sure your .env file contains:');
    console.log('DATABASE_URL=postgresql://postgres.jmedmpucaukshmwqumct:FHuYt4WRaJzZiLnb@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true');
    process.exit(1);
  }

  console.log('📦 Step 1: Generating Prisma client...');
  execSync('npx prisma generate --schema=prisma/schema.prisma', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Prisma client generated successfully!\n');

  console.log('🗄️  Step 2: Testing database connection...');
  // Test connection first
  execSync('npx prisma db pull --schema=prisma/schema.prisma', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Database connection successful!\n');

  console.log('🚀 Step 3: Pushing schema to database...');
  execSync('npx prisma db push --schema=prisma/schema.prisma', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Database schema updated successfully!\n');

  console.log('🎉 Database migration completed successfully!');
  console.log('\n📋 Summary:');
  console.log('- ✅ User table with supabaseId field created');
  console.log('- ✅ Prospect management tables created');
  console.log('- ✅ Email sequence/campaign tables created');
  console.log('- ✅ Task management tables created');
  console.log('- ✅ Email tracking tables created');
  console.log('- ✅ Prisma client generated');
  
  console.log('\n🎯 Next steps:');
  console.log('1. Configure Supabase email settings in your Supabase dashboard');
  console.log('2. Start the app: npm start');
  console.log('3. Test the authentication flow');

} catch (error) {
  console.error('❌ Database migration failed:', error.message);
  
  if (error.message.includes('DATABASE_URL')) {
    console.log('\n💡 Make sure your .env file contains:');
    console.log('DATABASE_URL=postgresql://postgres.jmedmpucaukshmwqumct:FHuYt4WRaJzZiLnb@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true');
  }
  
  if (error.message.includes('connection')) {
    console.log('\n💡 Check your Supabase database credentials and network connection');
  }
  
  process.exit(1);
}
