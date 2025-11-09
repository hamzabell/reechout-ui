const { PrismaClient } = require('@prisma/client');
const { handleCors, addCorsHeaders } = require('./cors-helper');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

// Simple CSV parser function
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length === headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      records.push(record);
    }
  }

  return records;
}

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return addCorsHeaders({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    });
  }

  try {
    const { csvContent, userId } = JSON.parse(event.body);

    if (!csvContent || !userId) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: csvContent, userId'
        })
      });
    }

    // Parse CSV
    const records = parseCSV(csvContent);

    if (records.length === 0) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({
          error: 'CSV file is empty or invalid'
        })
      });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return addCorsHeaders({
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      });
    }

    const results = {
      imported: [],
      errors: [],
      duplicates: []
    };

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      try {
        // Extract and validate required fields
        const name = record.name || record.Name || `${record.firstName || ''} ${record.lastName || ''}`.trim();
        const email = record.email || record.Email || '';

        if (!name || !email) {
          results.errors.push({
            row: i + 2, // +2 because CSV rows are 1-indexed and header is row 1
            error: 'Missing required fields: name or email'
          });
          continue;
        }

        // Check for existing prospect
        const existingProspect = await prisma.prospect.findFirst({
          where: {
            email: email.toLowerCase(),
            createdBy: userId
          }
        });

        if (existingProspect) {
          results.duplicates.push({
            row: i + 2,
            email,
            name,
            error: 'Prospect with this email already exists'
          });
          continue;
        }

        // Create prospect
        const newProspect = await prisma.prospect.create({
          data: {
            name: name,
            email: email.toLowerCase(),
            company: record.company || record.Company || null,
            title: record.title || record.Title || null,
            website: record.website || record.Website || null,
            industry: record.industry || record.Industry || null,
            linkedinProfile: record.linkedinProfile || record.LinkedIn || null,
            phoneNumber: record.phone || record.Phone || record.phoneNumber || null,
            location: record.location || record.Location || null,
            notes: record.notes || record.Notes || null,
            source: 'CSV Import',
            isOptedOut: record.isOptedOut === 'true' || record.optedOut === 'true',
            tags: record.tags ? record.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
            status: record.status || 'NEW',
            createdBy: userId,
            score: parseInt(record.score) || 50,
            lastContacted: record.lastContacted || null,
          }
        });

        results.imported.push({
          id: newProspect.id,
          name: newProspect.name,
          email: newProspect.email,
          row: i + 2
        });

      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error);
        results.errors.push({
          row: i + 2,
          error: error.message || 'Failed to process record'
        });
      }
    }

    return addCorsHeaders({
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        summary: {
          totalProcessed: records.length,
          imported: results.imported.length,
          errors: results.errors.length,
          duplicates: results.duplicates.length
        },
        imported: results.imported,
        errors: results.errors,
        duplicates: results.duplicates
      })
    });

  } catch (error) {
    console.error('Error importing CSV:', error);

    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    });
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};

