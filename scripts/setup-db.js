#!/usr/bin/env node

/**
 * Database Setup Script for Supabase + Prisma
 * 
 * This script will:
 * 1. Generate Prisma client
 * 2. Push schema changes to database
 * 3. Create initial migration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase database with Prisma...\n');

try {
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Please create it with Supabase credentials.');
    process.exit(1);
  }

  console.log('📦 Step 1: Generating Prisma client...');
  execSync('npm run db:generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully!\n');

  console.log('🗄️  Step 2: Pushing schema to database...');
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('✅ Database schema updated successfully!\n');

  console.log('🎉 Database setup completed successfully!');
  console.log('\n📋 Summary:');
  console.log('- User table with supabaseId field created');
  console.log('- Email confirmation tracking enabled');
  console.log('- Prisma client generated');
  console.log('\n🎯 Next steps:');
  console.log('1. Configure Supabase email settings in your Supabase dashboard');
  console.log('2. Start the app: npm start');
  console.log('3. Test the authentication flow');

} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  
  if (error.message.includes('DATABASE_URL')) {
    console.log('\n💡 Make sure your .env file contains:');
    console.log('DATABASE_URL=postgresql://postgres.jmedmpucaukshmwqumct:FHuYt4WRaJzZiLnb@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true');
  }
  
  process.exit(1);
}
