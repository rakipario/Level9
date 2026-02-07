/**
 * Widget Routes
 * 
 * Handles embeddable widget generation and public chat API.
 * Enables users to deploy agents to their websites.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const { AgentExecutor } = require('../services/executor');
const rateLimit = require('express-rate-limit');

// Rate limiter for public widget API
const widgetLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per IP
    message: { error: 'Too many requests, please try again later' }
});

/**
 * Authenticate widget requests using widget key
 */
const authenticateWidget = async (req, res, next) => {
    try {
        const widgetId = req.params.widgetId || req.query.widgetId;

        if (!widgetId) {
            return res.status(400).json({ error: 'Widget ID required' });
        }

        // Get widget and agent info
        const result = await pool.query(
            `SELECT w.*, a.*, u.id as owner_id 
       FROM widgets w 
       JOIN agents a ON a.id = w.agent_id 
       JOIN users u ON u.id = a.user_id
       WHERE w.id = $1 AND w.status = 'active'`,
            [widgetId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Widget not found or inactive' });
        }

        const widget = result.rows[0];

        // Check allowed domains (if configured)
        if (widget.allowed_domains && widget.allowed_domains.length > 0) {
            const origin = req.get('origin') || req.get('referer');
            if (origin) {
                const originDomain = new URL(origin).hostname;
                if (!widget.allowed_domains.includes(originDomain) && !widget.allowed_domains.includes('*')) {
                    return res.status(403).json({ error: 'Domain not allowed' });
                }
            }
        }

        req.widget = widget;
        req.agentId = widget.agent_id;
        req.ownerId = widget.owner_id;
        next();
    } catch (error) {
        console.error('Widget auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Get widget embed script
 */
router.get('/:widgetId/embed.js', async (req, res) => {
    try {
        const { widgetId } = req.params;

        const result = await pool.query(
            'SELECT w.*, a.name as agent_name FROM widgets w JOIN agents a ON a.id = w.agent_id WHERE w.id = $1',
            [widgetId]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('// Widget not found');
        }

        const widget = result.rows[0];
        const config = widget.config || {};

        // Generate the embed script
        const script = `
(function() {
  const WIDGET_ID = '${widgetId}';
  const API_URL = '${process.env.BACKEND_URL || 'http://localhost:3001'}/api/widget';
  const CONFIG = ${JSON.stringify({
            position: config.position || 'bottom-right',
            theme: config.theme || 'light',
            primaryColor: config.primaryColor || '#000000',
            title: config.title || widget.agent_name || 'Chat with us',
            subtitle: config.subtitle || 'Ask anything',
            placeholder: config.placeholder || 'Type your message...',
            greeting: config.greeting || 'Hi! How can I help you today?'
        })};

  // Create widget container
  const container = document.createElement('div');
  container.id = 'relay-widget-container';
  container.innerHTML = \`
    <style>
      #relay-widget-container {
        position: fixed;
        \${CONFIG.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        \${CONFIG.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #relay-widget-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: \${CONFIG.primaryColor};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }
      #relay-widget-button:hover {
        transform: scale(1.05);
      }
      #relay-widget-button svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
      #relay-chat-window {
        display: none;
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 380px;
        height: 520px;
        background: \${CONFIG.theme === 'dark' ? '#1a1a1a' : 'white'};
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        overflow: hidden;
        flex-direction: column;
      }
      #relay-chat-window.open {
        display: flex;
      }
      #relay-chat-header {
        padding: 16px;
        background: \${CONFIG.primaryColor};
        color: white;
      }
      #relay-chat-header h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
      }
      #relay-chat-header p {
        margin: 0;
        font-size: 13px;
        opacity: 0.9;
      }
      #relay-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      .relay-message {
        margin-bottom: 12px;
        max-width: 85%;
      }
      .relay-message.user {
        margin-left: auto;
      }
      .relay-message-content {
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.4;
      }
      .relay-message.user .relay-message-content {
        background: \${CONFIG.primaryColor};
        color: white;
        border-bottom-right-radius: 4px;
      }
      .relay-message.assistant .relay-message-content {
        background: \${CONFIG.theme === 'dark' ? '#333' : '#f0f0f0'};
        color: \${CONFIG.theme === 'dark' ? 'white' : '#333'};
        border-bottom-left-radius: 4px;
      }
      #relay-chat-input-container {
        padding: 12px;
        border-top: 1px solid \${CONFIG.theme === 'dark' ? '#333' : '#eee'};
        display: flex;
        gap: 8px;
      }
      #relay-chat-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid \${CONFIG.theme === 'dark' ? '#333' : '#ddd'};
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        background: \${CONFIG.theme === 'dark' ? '#333' : 'white'};
        color: \${CONFIG.theme === 'dark' ? 'white' : '#333'};
      }
      #relay-chat-input:focus {
        border-color: \${CONFIG.primaryColor};
      }
      #relay-send-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: \${CONFIG.primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #relay-send-button svg {
        width: 18px;
        height: 18px;
        fill: white;
      }
      .relay-typing {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
      }
      .relay-typing span {
        width: 8px;
        height: 8px;
        background: #999;
        border-radius: 50%;
        animation: typing 1.4s infinite;
      }
      .relay-typing span:nth-child(2) { animation-delay: 0.2s; }
      .relay-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-4px); }
      }
    </style>
    <button id="relay-widget-button" aria-label="Open chat">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </button>
    <div id="relay-chat-window">
      <div id="relay-chat-header">
        <h3>\${CONFIG.title}</h3>
        <p>\${CONFIG.subtitle}</p>
      </div>
      <div id="relay-chat-messages"></div>
      <div id="relay-chat-input-container">
        <input type="text" id="relay-chat-input" placeholder="\${CONFIG.placeholder}">
        <button id="relay-send-button">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  \`;

  document.body.appendChild(container);

  // Widget state
  let sessionId = localStorage.getItem('relay_session_' + WIDGET_ID);
  if (!sessionId) {
    sessionId = 'ws_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('relay_session_' + WIDGET_ID, sessionId);
  }

  const messagesContainer = document.getElementById('relay-chat-messages');
  const chatWindow = document.getElementById('relay-chat-window');
  const widgetButton = document.getElementById('relay-widget-button');
  const input = document.getElementById('relay-chat-input');
  const sendButton = document.getElementById('relay-send-button');

  // Toggle chat
  widgetButton.addEventListener('click', () => {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open') && messagesContainer.children.length === 0) {
      addMessage('assistant', CONFIG.greeting);
    }
  });

  // Send message
  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage('user', message);
    input.value = '';

    // Show typing indicator
    const typing = document.createElement('div');
    typing.className = 'relay-message assistant';
    typing.innerHTML = '<div class="relay-typing"><span></span><span></span><span></span></div>';
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const response = await fetch(API_URL + '/' + WIDGET_ID + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId })
      });

      const data = await response.json();
      typing.remove();

      if (data.response) {
        addMessage('assistant', data.response);
      } else if (data.error) {
        addMessage('assistant', 'Sorry, something went wrong. Please try again.');
      }
    } catch (error) {
      typing.remove();
      addMessage('assistant', 'Sorry, I couldn\\'t connect. Please try again.');
    }
  }

  function addMessage(role, content) {
    const msg = document.createElement('div');
    msg.className = 'relay-message ' + role;
    msg.innerHTML = '<div class="relay-message-content">' + escapeHtml(content) + '</div>';
    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();
`;

        res.type('application/javascript').send(script);
    } catch (error) {
        console.error('Widget script error:', error);
        res.status(500).send('// Error generating widget');
    }
});

/**
 * Widget chat endpoint (public)
 */
router.post('/:widgetId/chat', widgetLimiter, authenticateWidget, async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const widget = req.widget;

        if (!message) {
            return res.status(400).json({ error: 'Message required' });
        }

        // Get or create session conversation
        let conversationId;
        const sessionKey = `widget_${widget.id}_${sessionId}`;

        const convResult = await pool.query(
            'SELECT id FROM conversations WHERE metadata->>\'session_key\' = $1',
            [sessionKey]
        );

        if (convResult.rows.length > 0) {
            conversationId = convResult.rows[0].id;
        } else {
            const newConv = await pool.query(
                `INSERT INTO conversations (user_id, agent_id, title, metadata) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
                [req.ownerId, req.agentId, 'Widget Chat', JSON.stringify({ session_key: sessionKey, widget_id: widget.id })]
            );
            conversationId = newConv.rows[0].id;
        }

        // Save user message
        await pool.query(
            'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
            [conversationId, 'user', message]
        );

        // Get conversation history
        const historyResult = await pool.query(
            'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 10',
            [conversationId]
        );

        // Get agent config
        const agentConfig = {
            name: widget.name || 'Assistant',
            tools: widget.configuration?.tools || ['web_search'],
            systemPrompt: widget.configuration?.systemPrompt || null
        };

        // Get owner's integrations
        const integrationsResult = await pool.query(
            "SELECT * FROM integrations WHERE user_id = $1 AND status = 'connected'",
            [req.ownerId]
        );

        // Run agent
        const executor = new AgentExecutor(agentConfig, integrationsResult.rows);
        const result = await executor.run(historyResult.rows, message, req.ownerId);

        // Save response
        await pool.query(
            'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
            [conversationId, 'assistant', result.response]
        );

        res.json({
            response: result.response,
            sessionId
        });
    } catch (error) {
        console.error('Widget chat error:', error);
        res.status(500).json({ error: 'Chat failed' });
    }
});

/**
 * Get widget configuration
 */
router.get('/:widgetId/config', authenticateWidget, async (req, res) => {
    try {
        const widget = req.widget;

        res.json({
            id: widget.id,
            agentName: widget.name,
            config: widget.config || {}
        });
    } catch (error) {
        console.error('Widget config error:', error);
        res.status(500).json({ error: 'Failed to get config' });
    }
});

// ============ Authenticated endpoints for widget management ============

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
 * Create a widget for an agent
 */
router.post('/create', authenticate, async (req, res) => {
    try {
        const { agentId, config, allowedDomains } = req.body;
        const userId = req.userId;

        // Verify agent ownership
        const agentResult = await pool.query(
            'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
            [agentId, userId]
        );

        if (agentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        const widgetId = uuidv4();

        await pool.query(
            `INSERT INTO widgets (id, agent_id, config, allowed_domains, status)
       VALUES ($1, $2, $3, $4, 'active')`,
            [widgetId, agentId, JSON.stringify(config || {}), allowedDomains || ['*']]
        );

        const embedCode = `<script src="${process.env.BACKEND_URL || 'http://localhost:3001'}/api/widget/${widgetId}/embed.js" async></script>`;

        res.json({
            widgetId,
            embedCode,
            directLink: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/widget/${widgetId}/embed.js`
        });
    } catch (error) {
        console.error('Create widget error:', error);
        res.status(500).json({ error: 'Failed to create widget' });
    }
});

/**
 * Update widget configuration
 */
router.patch('/:widgetId', authenticate, async (req, res) => {
    try {
        const { widgetId } = req.params;
        const { config, allowedDomains, status } = req.body;
        const userId = req.userId;

        // Verify ownership
        const result = await pool.query(
            `UPDATE widgets w
       SET config = COALESCE($1, w.config),
           allowed_domains = COALESCE($2, w.allowed_domains),
           status = COALESCE($3, w.status),
           updated_at = NOW()
       FROM agents a
       WHERE w.id = $4 AND w.agent_id = a.id AND a.user_id = $5
       RETURNING w.*`,
            [config ? JSON.stringify(config) : null, allowedDomains, status, widgetId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        res.json({ widget: result.rows[0] });
    } catch (error) {
        console.error('Update widget error:', error);
        res.status(500).json({ error: 'Failed to update widget' });
    }
});

/**
 * Delete a widget
 */
router.delete('/:widgetId', authenticate, async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.userId;

        const result = await pool.query(
            `DELETE FROM widgets w
       USING agents a
       WHERE w.id = $1 AND w.agent_id = a.id AND a.user_id = $2
       RETURNING w.id`,
            [widgetId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        res.json({ deleted: true });
    } catch (error) {
        console.error('Delete widget error:', error);
        res.status(500).json({ error: 'Failed to delete widget' });
    }
});

/**
 * List user's widgets
 */
router.get('/list', authenticate, async (req, res) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            `SELECT w.*, a.name as agent_name
       FROM widgets w
       JOIN agents a ON a.id = w.agent_id
       WHERE a.user_id = $1
       ORDER BY w.created_at DESC`,
            [userId]
        );

        res.json({ widgets: result.rows });
    } catch (error) {
        console.error('List widgets error:', error);
        res.status(500).json({ error: 'Failed to list widgets' });
    }
});

module.exports = router;
