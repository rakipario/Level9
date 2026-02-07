/**
 * AI Routes - Updated to use Agent Executor
 * 
 * Handles AI chat with full agent execution capabilities.
 */

const express = require('express');
const { query, pool } = require('../utils/db');
const { AgentExecutor } = require('../services/executor');
const { chatCompletion, analyzeIntent, generateReport } = require('../services/ai');

const router = express.Router();

// Middleware to verify token
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Chat with AI using Agent Executor
 * This is the main endpoint that powers all agentic functionality
 */
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, conversationId, agentId, context } = req.body;
    const userId = req.userId;

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const convResult = await query(
        'INSERT INTO conversations (user_id, agent_id, title) VALUES ($1, $2, $3) RETURNING id',
        [userId, agentId || null, message.substring(0, 50) + '...']
      );
      convId = convResult.rows[0].id;
    }

    // Save user message
    await query(
      'INSERT INTO messages (conversation_id, role, content, metadata) VALUES ($1, $2, $3, $4)',
      [convId, 'user', message, JSON.stringify(context || {})]
    );

    // Get conversation history
    const historyResult = await query(
      'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 20',
      [convId]
    );

    const conversationHistory = historyResult.rows.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Get agent config if specified
    let agentConfig = {
      name: 'Relay Assistant',
      tools: ['execute_code', 'analyze_data', 'read_file', 'web_search', 'fetch_url'],
      systemPrompt: null
    };

    if (agentId) {
      const agentResult = await pool.query(
        'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
        [agentId, userId]
      );
      if (agentResult.rows.length > 0) {
        const agent = agentResult.rows[0];
        agentConfig = {
          name: agent.name,
          tools: agent.configuration?.tools || agentConfig.tools,
          systemPrompt: agent.configuration?.systemPrompt || null
        };
      }
    }

    // Get user's connected integrations
    const integrationsResult = await pool.query(
      "SELECT * FROM integrations WHERE user_id = $1 AND status = 'connected'",
      [userId]
    );
    const userIntegrations = integrationsResult.rows;

    // Create and run agent executor
    const executor = new AgentExecutor(agentConfig, userIntegrations);
    const result = await executor.run(conversationHistory, message, userId);

    // Save AI response
    await query(
      'INSERT INTO messages (conversation_id, role, content, metadata) VALUES ($1, $2, $3, $4)',
      [convId, 'assistant', result.response, JSON.stringify({
        executionLog: result.executionLog,
        tokensUsed: result.tokensUsed
      })]
    );

    // Update conversation timestamp
    await query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
      [convId]
    );

    res.json({
      conversationId: convId,
      response: result.response,
      executionLog: result.executionLog,
      state: result.state
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat failed', message: error.message });
  }
});

/**
 * Streaming chat endpoint
 */
router.post('/chat/stream', authenticate, async (req, res) => {
  try {
    const { message, conversationId, agentId, context } = req.body;
    const userId = req.userId;

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const convResult = await query(
        'INSERT INTO conversations (user_id, agent_id, title) VALUES ($1, $2, $3) RETURNING id',
        [userId, agentId || null, message.substring(0, 50) + '...']
      );
      convId = convResult.rows[0].id;
    }

    // Save user message
    await query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [convId, 'user', message]
    );

    // Get conversation history
    const historyResult = await query(
      'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 20',
      [convId]
    );

    const conversationHistory = historyResult.rows.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Get agent config
    let agentConfig = {
      name: 'Relay Assistant',
      tools: ['execute_code', 'analyze_data', 'read_file', 'web_search', 'fetch_url']
    };

    if (agentId) {
      const agentResult = await pool.query(
        'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
        [agentId, userId]
      );
      if (agentResult.rows.length > 0) {
        const agent = agentResult.rows[0];
        agentConfig = {
          name: agent.name,
          tools: agent.configuration?.tools || agentConfig.tools,
          systemPrompt: agent.configuration?.systemPrompt
        };
      }
    }

    // Get user's integrations
    const integrationsResult = await pool.query(
      "SELECT * FROM integrations WHERE user_id = $1 AND status = 'connected'",
      [userId]
    );

    // Create executor and stream
    const executor = new AgentExecutor(agentConfig, integrationsResult.rows);
    let fullResponse = '';

    for await (const event of executor.runStreaming(conversationHistory, message, userId)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);

      if (event.type === 'content') {
        fullResponse += event.content;
      } else if (event.type === 'complete') {
        fullResponse = event.response;
      }
    }

    // Save response
    if (fullResponse) {
      await query(
        'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
        [convId, 'assistant', fullResponse]
      );
    }

    res.write(`data: ${JSON.stringify({ type: 'done', conversationId: convId })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Streaming chat error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * Execute a specific tool directly
 */
router.post('/execute-tool', authenticate, async (req, res) => {
  try {
    const { tool, args } = req.body;
    const userId = req.userId;

    if (!tool || !args) {
      return res.status(400).json({ error: 'Tool and args are required' });
    }

    // Get user's integrations
    const integrationsResult = await pool.query(
      "SELECT * FROM integrations WHERE user_id = $1 AND status = 'connected'",
      [userId]
    );

    const { executeTool } = require('../tools');
    const result = await executeTool(tool, args, {
      userId,
      integrations: integrationsResult.rows,
      state: {}
    });

    res.json({ result });
  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({ error: 'Tool execution failed', message: error.message });
  }
});

/**
 * Get available tools for the current user
 */
router.get('/tools', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's integrations
    const integrationsResult = await pool.query(
      "SELECT * FROM integrations WHERE user_id = $1 AND status = 'connected'",
      [userId]
    );

    const { getAllTools, getToolDefinitions } = require('../tools');
    const allTools = getAllTools();

    // Mark which tools are available based on integrations
    const integrationTypes = integrationsResult.rows.map(i => i.integration_type);
    const toolsWithStatus = allTools.map(tool => ({
      ...tool,
      available: !tool.requiresIntegration ||
        (Array.isArray(tool.requiresIntegration) &&
          tool.requiresIntegration.some(t => integrationTypes.includes(t)))
    }));

    res.json({ tools: toolsWithStatus });
  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({ error: 'Failed to get tools' });
  }
});

// Analyze user intent for agent creation
router.post('/analyze-intent', authenticate, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const analysis = await analyzeIntent(prompt);

    res.json(analysis);
  } catch (error) {
    console.error('Intent analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Generate report
router.post('/generate-report', authenticate, async (req, res) => {
  try {
    const { prompt, data } = req.body;
    const userId = req.userId;

    const report = await generateReport(prompt, data);

    // Save output
    const outputResult = await query(
      'INSERT INTO outputs (user_id, type, title, content) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, 'report', report.title, JSON.stringify(report)]
    );

    res.json({
      outputId: outputResult.rows[0].id,
      ...report
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

// Get conversation history
router.get('/conversations/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const convResult = await query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messagesResult = await query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({
      conversation: convResult.rows[0],
      messages: messagesResult.rows
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Get user's conversations
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await query(
      `SELECT c.*, 
        (SELECT content FROM messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) as first_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
       FROM conversations c 
       WHERE c.user_id = $1 
       ORDER BY c.updated_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

module.exports = router;
