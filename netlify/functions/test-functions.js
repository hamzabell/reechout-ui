const { PrismaClient } = require('@prisma/client');

// Initialize Prisma
const prisma = new PrismaClient();

async function testListCampaigns() {
  console.log('\n=== Testing campaigns-list-campaigns ===');
  
  try {
    // First, let's get a real user ID from the database
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      console.log('❌ No users found in database. Please create a user first.');
      return null;
    }

    const userId = users[0].id;
    console.log('Using userId:', userId);

    // Test the query logic from campaigns-list-campaigns
    const where = {
      createdBy: userId
    };

    console.log('Query where clause:', where);

    // Get total count
    const total = await prisma.sequence.count({ where });
    console.log('Total sequences:', total);

    // Query sequences with campaignProspects included
    const sequences = await prisma.sequence.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
      skip: 0,
      include: {
        campaignProspects: {
          select: {
            id: true,
            status: true,
            prospect: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log('✅ Found sequences:', sequences.length);
    
    if (sequences.length > 0) {
      sequences.forEach((seq, index) => {
        console.log(`Sequence ${index + 1}:`, {
          id: seq.id,
          name: seq.name,
          status: seq.status,
          prospectCount: seq.campaignProspects.length
        });
      });
    } else {
      console.log('No sequences found. Let\'s create a test sequence.');
      
      // Create a test sequence
      const testSequence = await prisma.sequence.create({
        data: {
          name: 'Test Sequence for API Testing',
          description: 'This is a test sequence created during API testing',
          status: 'DRAFT',
          createdBy: userId
        }
      });
      
      console.log('✅ Created test sequence:', { id: testSequence.id, name: testSequence.name });
      return [testSequence];
    }

    return sequences;

  } catch (error) {
    console.error('❌ Error testing list campaigns:', error);
    return null;
  }
}

async function testAddProspects() {
  console.log('\n=== Testing campaigns-add-prospects ===');
  
  try {
    // Get a real user and sequence
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return null;
    }

    const userId = users[0].id;
    console.log('Using userId:', userId);

    // Get or create a sequence
    let sequence = await prisma.sequence.findFirst({ where: { createdBy: userId } });
    
    if (!sequence) {
      sequence = await prisma.sequence.create({
        data: {
          name: 'Test Sequence for Adding Prospects',
          description: 'Test sequence created for prospect addition testing',
          status: 'DRAFT',
          createdBy: userId
        }
      });
      console.log('✅ Created test sequence:', { id: sequence.id, name: sequence.name });
    } else {
      console.log('✅ Using existing sequence:', { id: sequence.id, name: sequence.name });
    }

    // Get prospects to add
    const prospects = await prisma.prospect.findMany({ 
      where: { createdBy: userId },
      take: 2
    });

    if (prospects.length === 0) {
      console.log('❌ No prospects found. Creating test prospects...');
      
      // Create test prospects
      const testProspects = await Promise.all([
        prisma.prospect.create({
          data: {
            name: 'Test Prospect 1',
            email: 'test1@example.com',
            company: 'Test Company',
            title: 'Test Role',
            status: 'NEW',
            createdBy: userId
          }
        }),
        prisma.prospect.create({
          data: {
            name: 'Test Prospect 2',
            email: 'test2@example.com',
            company: 'Another Company',
            title: 'Another Role',
            status: 'NEW',
            createdBy: userId
          }
        })
      ]);

      console.log('✅ Created test prospects:', testProspects.map(p => ({ id: p.id, name: p.name, email: p.email })));
      prospects.push(...testProspects);
    }

    console.log('✅ Found prospects to add:', prospects.map(p => ({ id: p.id, name: p.name, email: p.email })));

    // Test adding prospects to sequence
    const prospectIds = prospects.map(p => p.id);
    const campaignId = sequence.id;

    console.log('Adding prospects to sequence:', { campaignId, prospectIds });

    // Verify campaign belongs to user (this is already done above)
    // Verify prospects belong to user (already done above)

    // Create campaign prospect associations
    const campaignProspectsToCreate = prospectIds.map(prospectId => ({
      campaignId,
      prospectId,
      status: 'NEW'
    }));

    console.log('Creating associations:', campaignProspectsToCreate);

    // Use createMany to avoid duplicates
    const result = await prisma.campaignProspect.createMany({
      data: campaignProspectsToCreate,
      skipDuplicates: true
    });

    console.log('✅ Created campaign prospects:', result.count);

    // Fetch created associations
    const createdAssociations = await prisma.campaignProspect.findMany({
      where: { campaignId, prospectId: { in: prospectIds } },
      include: {
        prospect: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            title: true,
            status: true
          }
        }
      }
    });

    console.log('✅ Created associations with details:');
    createdAssociations.forEach((assoc, index) => {
      console.log(`  Association ${index + 1}:`, {
        id: assoc.id,
        prospectName: assoc.prospect.name,
        prospectEmail: assoc.prospect.email,
        status: assoc.status
      });
    });

    return { created: result.count, associations: createdAssociations };

  } catch (error) {
    console.error('❌ Error testing add prospects:', error);
    return null;
  }
}

async function checkDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check if tables exist and get counts
    const userCount = await prisma.user.count();
    const sequenceCount = await prisma.sequence.count();
    const prospectCount = await prisma.prospect.count();
    const campaignProspectCount = await prisma.campaignProspect.count();

    console.log('✅ Database stats:');
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Sequences: ${sequenceCount}`);
    console.log(`  - Prospects: ${prospectCount}`);
    console.log(`  - Campaign-Prospect associations: ${campaignProspectCount}`);

    if (userCount === 0) {
      console.log('⚠️  No users found. Creating a test user...');
      
      // Create a test user
      const testUser = await prisma.user.create({
        data: {
          neonUserId: 'test-neon-user-id',
          email: 'test@example.com',
          name: 'Test User',
          company: 'Test Company',
          title: 'Test Role',
          isActive: true,
          emailConfirmed: true
        }
      });
      
      console.log('✅ Created test user:', { id: testUser.id, email: testUser.email, name: testUser.name });
    }

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function testFunctionFiles() {
  console.log('\n=== Testing Function Files ===');
  
  try {
    // Test if the function files exist and can be loaded
    const fs = require('fs');
    const path = require('path');
    
    const listCampaignsPath = './campaigns-list-campaigns.js';
    const addProspectsPath = './campaigns-add-prospects.js';
    
    if (fs.existsSync(listCampaignsPath)) {
      console.log('✅ campaigns-list-campaigns.js exists');
      
      // Try to load the function
      const listFunction = require('./campaigns-list-campaigns.js');
      console.log('✅ campaigns-list-campaigns.js loads successfully');
    } else {
      console.log('❌ campaigns-list-campaigns.js not found');
    }
    
    if (fs.existsSync(addProspectsPath)) {
      console.log('✅ campaigns-add-prospects.js exists');
      
      // Try to load the function
      const addFunction = require('./campaigns-add-prospects.js');
      console.log('✅ campaigns-add-prospects.js loads successfully');
    } else {
      console.log('❌ campaigns-add-prospects.js not found');
    }
    
    // Test CORS utils
    const corsPath = './utils/cors.js';
    if (fs.existsSync(corsPath)) {
      console.log('✅ utils/cors.js exists');
      const cors = require('./utils/cors.js');
      console.log('✅ utils/cors.js loads successfully');
      console.log('Available CORS functions:', Object.keys(cors));
    } else {
      console.log('❌ utils/cors.js not found');
    }
    
  } catch (error) {
    console.error('❌ Error testing function files:', error);
  }
}

async function runTests() {
  console.log('🧪 Starting API Function Tests\n');

  // Test function files first
  await testFunctionFiles();

  // Test database connection
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }

  // Test list campaigns
  await testListCampaigns();

  // Test add prospects
  await testAddProspects();

  console.log('\n🏁 Tests completed');

  // Cleanup
  await prisma.$disconnect();
}

// Run tests
runTests().catch(console.error);
