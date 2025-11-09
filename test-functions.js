const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config({ path: '.env' });

// Initialize Prisma
const prisma = new PrismaClient();

async function testListCampaigns() {
  console.log('\n=== Testing campaigns-list-campaigns ===');
  
  try {
    // Test data
    const testEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        userId: 'test-user-id', // We'll need to use a real user ID
        filters: {
          limit: 10,
          offset: 0
        }
      })
    };

    console.log('Test payload:', testEvent.body);

    // Simulate the function logic
    const { userId, ...filters } = JSON.parse(testEvent.body);
    
    if (!userId) {
      console.log('❌ Missing userId');
      return;
    }

    const { search, status, sortBy = 'createdAt', sortOrder = 'desc', limit = 50, offset = 0 } = filters || {};

    // Build where clause
    const where = {
      createdBy: userId,
      ...(status && { status: status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    console.log('Query where clause:', where);

    // Get total count
    const total = await prisma.sequence.count({ where });
    console.log('Total sequences:', total);

    // Query sequences
    const sequences = await prisma.sequence.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: parseInt(limit),
      skip: parseInt(offset),
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
    console.log('Sample sequence:', sequences[0] ? {
      id: sequences[0].id,
      name: sequences[0].name,
      status: sequences[0].status,
      prospectCount: sequences[0].campaignProspects.length
    } : 'No sequences found');

    return sequences;

  } catch (error) {
    console.error('❌ Error testing list campaigns:', error);
    return null;
  }
}

async function testAddProspects() {
  console.log('\n=== Testing campaigns-add-prospects ===');
  
  try {
    // Test data - we'll need real IDs
    const testEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        campaignId: 'test-campaign-id',
        prospectIds: ['test-prospect-id-1', 'test-prospect-id-2'],
        userId: 'test-user-id'
      })
    };

    console.log('Test payload:', testEvent.body);

    const { campaignId, prospectIds, userId } = JSON.parse(testEvent.body);

    if (!campaignId || !prospectIds || !Array.isArray(prospectIds) || !userId) {
      console.log('❌ Missing required fields');
      return;
    }

    if (prospectIds.length === 0) {
      console.log('❌ Empty prospectIds array');
      return;
    }

    // Verify campaign belongs to user
    const campaign = await prisma.sequence.findFirst({
      where: { id: campaignId, createdBy: userId }
    });

    if (!campaign) {
      console.log('❌ Campaign not found or access denied');
      return;
    }

    console.log('✅ Campaign found:', { id: campaign.id, name: campaign.name });

    // Verify prospects belong to user
    const prospects = await prisma.prospect.findMany({
      where: { id: { in: prospectIds }, createdBy: userId }
    });

    if (prospects.length !== prospectIds.length) {
      console.log('❌ Some prospects not found or access denied');
      return;
    }

    console.log('✅ Found prospects:', prospects.length);

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

    console.log('✅ Created associations with details:', createdAssociations.length);

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

    // Check if tables exist
    const sequenceCount = await prisma.sequence.count();
    const prospectCount = await prisma.prospect.count();
    const campaignProspectCount = await prisma.campaignProspect.count();

    console.log('✅ Database stats:');
    console.log(`  - Sequences: ${sequenceCount}`);
    console.log(`  - Prospects: ${prospectCount}`);
    console.log(`  - Campaign-Prospect associations: ${campaignProspectCount}`);

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting API Function Tests\n');

  // Test database connection first
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
