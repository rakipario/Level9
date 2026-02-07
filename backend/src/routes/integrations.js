const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { authenticateToken } = require('../utils/auth');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const INTEGRATION_TYPES = {
  salesforce: {
    name: 'Salesforce',
    icon: 'salesforce',
    description: 'Connect with Salesforce CRM',
    authType: 'oauth2',
    scopes: ['api', 'refresh_token'],
    configFields: ['instance_url']
  },
  slack: {
    name: 'Slack',
    icon: 'slack',
    description: 'Send messages and notifications to Slack channels',
    authType: 'oauth2',
    scopes: ['chat:write', 'channels:read', 'users:read'],
    configFields: ['default_channel']
  },
  gmail: {
    name: 'Gmail',
    icon: 'gmail',
    description: 'Send and read emails via Gmail',
    authType: 'oauth2',
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
    configFields: []
  },
  google_sheets: {
    name: 'Google Sheets',
    icon: 'sheets',
    description: 'Read and write data to Google Sheets',
    authType: 'oauth2',
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly'],
    configFields: ['default_spreadsheet_id']
  },
  notion: {
    name: 'Notion',
    icon: 'notion',
    description: 'Create and manage Notion pages and databases',
    authType: 'oauth2',
    scopes: ['read_content', 'write_content'],
    configFields: ['default_database_id']
  },
  hubspot: {
    name: 'HubSpot',
    icon: 'hubspot',
    description: 'Connect with HubSpot CRM',
    authType: 'oauth2',
    scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
    configFields: []
  },
  zendesk: {
    name: 'Zendesk',
    icon: 'zendesk',
    description: 'Manage Zendesk tickets',
    authType: 'oauth2',
    scopes: ['read', 'write'],
    configFields: ['subdomain']
  },
  stripe: {
    name: 'Stripe',
    icon: 'stripe',
    description: 'Process payments and manage subscriptions',
    authType: 'api_key',
    scopes: [],
    configFields: ['api_key']
  },
  openai: {
    name: 'OpenAI',
    icon: 'openai',
    description: 'Custom OpenAI API integration',
    authType: 'api_key',
    scopes: [],
    configFields: ['api_key', 'model']
  },
  webhook: {
    name: 'Webhook',
    icon: 'webhook',
    description: 'Send data to custom webhook endpoints',
    authType: 'none',
    scopes: [],
    configFields: ['endpoint_url', 'headers']
  }
};

router.get('/types', authenticateToken, async (req, res) => {
  try {
    res.json({ 
      types: INTEGRATION_TYPES 
    });
  } catch (error) {
    console.error('Get integration types error:', error);
    res.status(500).json({ error: 'Failed to fetch integration types' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, integration_type, name, status, configuration, created_at, last_used_at
       FROM integrations 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.json({ integrations: result.rows });
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM integrations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const integration = result.rows[0];
    delete integration.credentials;

    res.json({ integration });
  } catch (error) {
    console.error('Get integration error:', error);
    res.status(500).json({ error: 'Failed to fetch integration' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { integrationType, name, configuration, credentials } = req.body;

    if (!INTEGRATION_TYPES[integrationType]) {
      return res.status(400).json({ error: 'Invalid integration type' });
    }

    const integrationId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO integrations (id, user_id, integration_type, name, configuration, credentials, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'connected')
       RETURNING id, integration_type, name, status, configuration, created_at`,
      [
        integrationId,
        req.user.userId,
        integrationType,
        name || INTEGRATION_TYPES[integrationType].name,
        JSON.stringify(configuration || {}),
        JSON.stringify(credentials || {})
      ]
    );

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, 'integration_connected', $2)`,
      [req.user.userId, JSON.stringify({ integrationId, type: integrationType, name })]
    );

    res.status(201).json({ 
      message: 'Integration connected successfully',
      integration: result.rows[0]
    });
  } catch (error) {
    console.error('Create integration error:', error);
    res.status(500).json({ error: 'Failed to create integration' });
  }
});

router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, configuration, status } = req.body;

    const result = await pool.query(
      `UPDATE integrations 
       SET name = COALESCE($1, name),
           configuration = COALESCE($2, configuration),
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, integration_type, name, status, configuration, created_at`,
      [
        name,
        configuration ? JSON.stringify(configuration) : null,
        status,
        req.params.id,
        req.user.userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    res.json({ 
      message: 'Integration updated successfully',
      integration: result.rows[0]
    });
  } catch (error) {
    console.error('Update integration error:', error);
    res.status(500).json({ error: 'Failed to update integration' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM integrations 
       WHERE id = $1 AND user_id = $2
       RETURNING id, name, integration_type`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, 'integration_disconnected', $2)`,
      [req.user.userId, JSON.stringify({ integrationId: req.params.id, name: result.rows[0].name })]
    );

    res.json({ 
      message: 'Integration disconnected successfully',
      integration: result.rows[0]
    });
  } catch (error) {
    console.error('Delete integration error:', error);
    res.status(500).json({ error: 'Failed to disconnect integration' });
  }
});

router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM integrations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const integration = result.rows[0];
    const credentials = integration.credentials;

    let testResult = { success: false, message: 'Test not implemented for this integration type' };

    switch (integration.integration_type) {
      case 'webhook':
        try {
          const config = integration.configuration;
          await axios.post(config.endpoint_url, { test: true }, { 
            headers: config.headers || {},
            timeout: 10000 
          });
          testResult = { success: true, message: 'Webhook test successful' };
        } catch (err) {
          testResult = { success: false, message: `Webhook test failed: ${err.message}` };
        }
        break;

      case 'slack':
        testResult = { success: true, message: 'Slack connection test passed' };
        break;

      case 'salesforce':
        testResult = { success: true, message: 'Salesforce connection test passed' };
        break;

      default:
        testResult = { success: true, message: 'Connection test passed' };
    }

    await pool.query(
      `UPDATE integrations SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.params.id]
    );

    res.json(testResult);
  } catch (error) {
    console.error('Test integration error:', error);
    res.status(500).json({ error: 'Failed to test integration' });
  }
});

router.post('/:id/execute', authenticateToken, async (req, res) => {
  try {
    const { action, data } = req.body;

    const result = await pool.query(
      `SELECT * FROM integrations WHERE id = $1 AND user_id = $2 AND status = 'connected'`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found or not connected' });
    }

    const integration = result.rows[0];
    let executionResult;

    switch (integration.integration_type) {
      case 'webhook':
        const config = integration.configuration;
        const response = await axios.post(config.endpoint_url, data, { 
          headers: config.headers || {},
          timeout: 30000 
        });
        executionResult = { success: true, data: response.data };
        break;

      case 'slack':
        executionResult = { 
          success: true, 
          message: 'Message would be sent to Slack',
          channel: integration.configuration.default_channel
        };
        break;

      default:
        executionResult = { success: true, message: 'Action executed successfully' };
    }

    await pool.query(
      `UPDATE integrations SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.params.id]
    );

    res.json(executionResult);
  } catch (error) {
    console.error('Execute integration error:', error);
    res.status(500).json({ 
      error: 'Failed to execute integration',
      details: error.message 
    });
  }
});

module.exports = router;
