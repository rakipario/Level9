const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { authenticateToken } = require('../utils/auth');

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.company_name, 
              u.plan_type, u.plan_status, u.created_at, u.updated_at,
              u.avatar_url, u.job_title, u.phone
       FROM users u 
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, companyName, jobTitle, phone, avatarUrl } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           company_name = COALESCE($3, company_name),
           job_title = COALESCE($4, job_title),
           phone = COALESCE($5, phone),
           avatar_url = COALESCE($6, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, email, first_name, last_name, company_name, job_title, phone, avatar_url, plan_type, created_at`,
      [firstName, lastName, companyName, jobTitle, phone, avatarUrl, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/select-plan', authenticateToken, async (req, res) => {
  try {
    const { planType } = req.body;

    if (!['free', 'pro', 'team'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET plan_type = $1, plan_status = 'active', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, plan_type, plan_status`,
      [planType, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, 'plan_selected', $2)`,
      [req.user.userId, JSON.stringify({ planType })]
    );

    res.json({
      message: 'Plan selected successfully',
      plan: result.rows[0]
    });
  } catch (error) {
    console.error('Select plan error:', error);
    res.status(500).json({ error: 'Failed to select plan' });
  }
});

router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT id, action, details, created_at 
       FROM activity_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [req.user.userId, parseInt(limit), parseInt(offset)]
    );

    res.json({ activities: result.rows });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const agentCount = await pool.query(
      'SELECT COUNT(*) FROM agents WHERE user_id = $1 AND status = $2',
      [req.user.userId, 'active']
    );

    const conversationCount = await pool.query(
      `SELECT COUNT(*) FROM conversations WHERE user_id = $1`,
      [req.user.userId]
    );

    const integrationCount = await pool.query(
      `SELECT COUNT(*) FROM integrations WHERE user_id = $1 AND status = $2`,
      [req.user.userId, 'connected']
    );

    const messageCount = await pool.query(
      `SELECT COUNT(*) FROM messages m 
       JOIN conversations c ON m.conversation_id = c.id 
       WHERE c.user_id = $1`,
      [req.user.userId]
    );

    res.json({
      stats: {
        agents: parseInt(agentCount.rows[0].count),
        conversations: parseInt(conversationCount.rows[0].count),
        integrations: parseInt(integrationCount.rows[0].count),
        messages: parseInt(messageCount.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
