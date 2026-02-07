const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { authenticateToken } = require('../utils/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, category } = req.query;
    
    let query = `SELECT a.*, 
                        (SELECT COUNT(*) FROM conversations WHERE agent_id = a.id) as conversation_count
                 FROM agents a 
                 WHERE a.user_id = $1`;
    const params = [req.user.userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category) {
      query += ` AND a.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ agents: result.rows });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, 
              (SELECT json_agg(json_build_object(
                'id', c.id,
                'title', c.title,
                'created_at', c.created_at
              )) FROM conversations c WHERE c.agent_id = a.id ORDER BY c.created_at DESC LIMIT 10) as recent_conversations
       FROM agents a 
       WHERE a.id = $1 AND a.user_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ agent: result.rows[0] });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      agentType, 
      category,
      configuration,
      integrations,
      avatarUrl
    } = req.body;

    if (!name || !agentType) {
      return res.status(400).json({ error: 'Name and agent type are required' });
    }

    const agentId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO agents (id, user_id, name, description, agent_type, category, configuration, integrations, avatar_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
       RETURNING *`,
      [
        agentId,
        req.user.userId,
        name,
        description,
        agentType,
        category || 'general',
        JSON.stringify(configuration || {}),
        JSON.stringify(integrations || []),
        avatarUrl
      ]
    );

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, 'agent_created', $2)`,
      [req.user.userId, JSON.stringify({ agentId, name, agentType })]
    );

    res.status(201).json({ 
      message: 'Agent created successfully',
      agent: result.rows[0]
    });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, configuration, integrations, avatarUrl, status } = req.body;

    const result = await pool.query(
      `UPDATE agents 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           configuration = COALESCE($3, configuration),
           integrations = COALESCE($4, integrations),
           avatar_url = COALESCE($5, avatar_url),
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        name,
        description,
        configuration ? JSON.stringify(configuration) : null,
        integrations ? JSON.stringify(integrations) : null,
        avatarUrl,
        status,
        req.params.id,
        req.user.userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ 
      message: 'Agent updated successfully',
      agent: result.rows[0]
    });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE agents 
       SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, name`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, 'agent_deleted', $2)`,
      [req.user.userId, JSON.stringify({ agentId: req.params.id, name: result.rows[0].name })]
    );

    res.json({ 
      message: 'Agent deleted successfully',
      agent: result.rows[0]
    });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const originalAgent = await pool.query(
      'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );

    if (originalAgent.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = originalAgent.rows[0];
    const newAgentId = uuidv4();

    const result = await pool.query(
      `INSERT INTO agents (id, user_id, name, description, agent_type, category, configuration, integrations, avatar_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
       RETURNING *`,
      [
        newAgentId,
        req.user.userId,
        `${agent.name} (Copy)`,
        agent.description,
        agent.agent_type,
        agent.category,
        agent.configuration,
        agent.integrations,
        agent.avatar_url
      ]
    );

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, 'agent_duplicated', $2)`,
      [req.user.userId, JSON.stringify({ originalId: req.params.id, newId: newAgentId, name: agent.name })]
    );

    res.status(201).json({ 
      message: 'Agent duplicated successfully',
      agent: result.rows[0]
    });
  } catch (error) {
    console.error('Duplicate agent error:', error);
    res.status(500).json({ error: 'Failed to duplicate agent' });
  }
});

router.get('/categories/list', authenticateToken, async (req, res) => {
  try {
    const categories = [
      { id: 'analytics', name: 'Analytics', icon: 'BarChart3', description: 'Data analysis and visualization agents' },
      { id: 'sales', name: 'Sales', icon: 'TrendingUp', description: 'Sales and CRM agents' },
      { id: 'support', name: 'Support', icon: 'Headphones', description: 'Customer support agents' },
      { id: 'marketing', name: 'Marketing', icon: 'Megaphone', description: 'Marketing automation agents' },
      { id: 'operations', name: 'Operations', icon: 'Settings', description: 'Operations and workflow agents' },
      { id: 'research', name: 'Research', icon: 'Search', description: 'Research and analysis agents' },
      { id: 'general', name: 'General', icon: 'Bot', description: 'General purpose agents' }
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
