const { getPrismaClient } = require('../../../lib/prisma');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let prisma;
  try {
    // Verify JWT token
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const {
      page = '1',
      limit = '20',
      search,
      status,
      industry,
      score_min,
      score_max,
      tags,
      sort_by = 'createdAt',
      sort_order = 'desc',
      date_from,
      date_to
    } = queryParams;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    prisma = getPrismaClient();

    // Build where clause
    const where = {};

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Industry filter
    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }

    // Score range filter
    if (score_min || score_max) {
      where.score = {};
      if (score_min) where.score.gte = parseInt(score_min);
      if (score_max) where.score.lte = parseInt(score_max);
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagArray };
    }

    // Date range filter
    if (date_from || date_to) {
      where.createdAt = {};
      if (date_from) where.createdAt.gte = new Date(date_from);
      if (date_to) where.createdAt.lte = new Date(date_to);
    }

    // Build order by clause
    const orderBy = {};
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'company', 'score', 'status', 'lastContacted'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'createdAt';
    orderBy[sortField] = sort_order.toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Execute query with pagination
    const [leads, totalCount] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy,
        skip: offset,
        take: limitNum,
        include: {
          _count: {
            select: {
              campaigns: true,
              emailLogs: true,
              activities: true
            }
          }
        }
      }),
      prisma.lead.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          leads,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalCount,
            limit: limitNum,
            hasNextPage,
            hasPreviousPage
          },
          filters: {
            search,
            status,
            industry,
            scoreRange: { min: score_min, max: score_max },
            tags: tags ? tags.split(',').map(tag => tag.trim()) : null,
            dateRange: { from: date_from, to: date_to }
          }
        }
      })
    };

  } catch (error) {
    console.error('List leads error:', error);

    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch leads',
        details: error.message
      })
    };
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
};