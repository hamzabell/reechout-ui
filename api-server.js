const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 8888;

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Tasks API - simplified implementation
app.get('/api/tasks', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const where = status && status !== 'all' ? { status: status.toUpperCase() } : {};

    // For now, return mock data since we don't have campaigns/steps created yet
    const tasks = [];
    const total = 0;

    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      campaignName: 'Sample Campaign',
      day: 1,
      stepName: 'Sample Step',
      isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED',
      daysUntilDue: task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));

    res.json({
      tasks: formattedTasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.query;

    const updateData = {};
    if (action === 'complete') {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    } else if (action === 'uncomplete') {
      updateData.status = 'PENDING';
      updateData.completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, task });
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Templates API
app.get('/api/templates', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.emailTemplate.count({ where })
    ]);

    res.json({
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const { name, subject, body, variables } = req.body;

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body,
        variables: variables || []
      }
    });

    res.json(template);
  } catch (error) {
    console.error('Template creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Prospects API
app.get('/api/prospects', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.prospect.count({ where })
    ]);

    res.json({
      prospects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Prospects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/prospects', async (req, res) => {
  try {
    const { name, email, company, title, website, industry, linkedinProfile } = req.body;

    const prospect = await prisma.prospect.create({
      data: {
        name,
        email,
        company,
        title,
        website,
        industry,
        linkedinProfile,
        status: 'NEW',
        score: 0,
        tags: []
      }
    });

    res.json(prospect);
  } catch (error) {
    console.error('Prospect creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Campaigns API
app.get('/api/campaigns', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.campaign.count({ where })
    ]);

    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Campaigns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const { name, description, settings } = req.body;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        status: 'DRAFT',
        settings: settings || {},
        createdBy: 'user-id-placeholder' // TODO: Get from auth
      }
    });

    res.json(campaign);
  } catch (error) {
    console.error('Campaign creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});