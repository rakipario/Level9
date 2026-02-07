/**
 * OAuth Routes
 * 
 * Handles OAuth flows for all integration providers.
 * Provides one-click connection and guided setup.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const { generateOAuthState, parseOAuthState } = require('../oauth/base');
const { createFullGoogleProvider } = require('../oauth/google');
const { createFullMicrosoftProvider } = require('../oauth/microsoft');
const { createNotionProvider } = require('../oauth/notion');
const { createSlackProvider } = require('../oauth/slack');

// Provider factory
const PROVIDERS = {
    google: createFullGoogleProvider,
    gmail: createFullGoogleProvider,
    google_sheets: createFullGoogleProvider,
    google_calendar: createFullGoogleProvider,
    microsoft: createFullMicrosoftProvider,
    outlook: createFullMicrosoftProvider,
    excel: createFullMicrosoftProvider,
    outlook_calendar: createFullMicrosoftProvider,
    notion: createNotionProvider,
    slack: createSlackProvider
};

/**
 * Middleware to verify token
 */
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.query.token;
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
 * Get available OAuth providers
 */
router.get('/providers', (req, res) => {
    const providers = [
        {
            id: 'google',
            name: 'Google',
            description: 'Connect Gmail, Google Sheets, and Calendar',
            services: ['Gmail', 'Google Sheets', 'Google Calendar', 'Google Drive'],
            icon: 'google'
        },
        {
            id: 'microsoft',
            name: 'Microsoft',
            description: 'Connect Outlook, Excel Online, and Calendar',
            services: ['Outlook', 'Excel Online', 'OneDrive', 'Calendar'],
            icon: 'microsoft'
        },
        {
            id: 'notion',
            name: 'Notion',
            description: 'Connect Notion pages and databases',
            services: ['Pages', 'Databases'],
            icon: 'notion'
        },
        {
            id: 'slack',
            name: 'Slack',
            description: 'Send messages and read channels',
            services: ['Messaging', 'Channels'],
            icon: 'slack'
        }
    ];

    res.json({ providers });
});

/**
 * Initiate OAuth flow
 * Returns the authorization URL for the user to visit
 */
router.get('/connect/:provider', authenticate, async (req, res) => {
    try {
        const { provider } = req.params;
        const userId = req.userId;

        const providerFactory = PROVIDERS[provider];
        if (!providerFactory) {
            return res.status(400).json({ error: `Unknown provider: ${provider}` });
        }

        const oauthProvider = providerFactory();
        const state = generateOAuthState(userId, provider);

        // Store state temporarily
        await pool.query(
            `INSERT INTO oauth_states (state, user_id, provider, created_at) 
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (state) DO UPDATE SET user_id = $2, provider = $3, created_at = NOW()`,
            [state, userId, provider]
        );

        const authUrl = oauthProvider.getAuthorizationUrl(state);

        res.json({
            authUrl,
            provider,
            message: 'Redirect the user to authUrl to complete authorization'
        });
    } catch (error) {
        console.error('OAuth connect error:', error);
        res.status(500).json({ error: 'Failed to initiate OAuth' });
    }
});

/**
 * OAuth callback handler
 */
router.get('/callback/:provider', async (req, res) => {
    try {
        const { provider } = req.params;
        const { code, state, error } = req.query;

        if (error) {
            return res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth=error&message=${encodeURIComponent(error)}`);
        }

        if (!code || !state) {
            return res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth=error&message=missing_params`);
        }

        // Validate state
        let stateData;
        try {
            stateData = parseOAuthState(state);
        } catch (e) {
            return res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth=error&message=invalid_state`);
        }

        const { userId } = stateData;

        // Get provider
        const providerFactory = PROVIDERS[provider];
        if (!providerFactory) {
            return res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth=error&message=unknown_provider`);
        }

        const oauthProvider = providerFactory();

        // Exchange code for tokens
        const tokens = await oauthProvider.exchangeCodeForTokens(code);

        // Store tokens
        await oauthProvider.storeTokens(userId, tokens);

        // Create or update integration record
        const integrationId = uuidv4();
        await pool.query(
            `INSERT INTO integrations (id, user_id, integration_type, name, status, configuration)
       VALUES ($1, $2, $3, $4, 'connected', $5)
       ON CONFLICT (user_id, integration_type) 
       DO UPDATE SET status = 'connected', updated_at = NOW()`,
            [integrationId, userId, provider, `${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
                JSON.stringify(tokens.workspace_name ? { workspace: tokens.workspace_name } : {})]
        );

        // Clean up state
        await pool.query('DELETE FROM oauth_states WHERE state = $1', [state]);

        // Redirect back to dashboard with success
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth=success&provider=${provider}`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth=error&message=${encodeURIComponent(error.message)}`);
    }
});

/**
 * Disconnect an OAuth integration
 */
router.post('/disconnect/:provider', authenticate, async (req, res) => {
    try {
        const { provider } = req.params;
        const userId = req.userId;

        // Remove tokens
        await pool.query(
            'DELETE FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
            [userId, provider]
        );

        // Update integration status
        await pool.query(
            "UPDATE integrations SET status = 'disconnected', updated_at = NOW() WHERE user_id = $1 AND integration_type = $2",
            [userId, provider]
        );

        res.json({ success: true, message: `${provider} disconnected` });
    } catch (error) {
        console.error('OAuth disconnect error:', error);
        res.status(500).json({ error: 'Failed to disconnect' });
    }
});

/**
 * Get connection status for all providers
 */
router.get('/status', authenticate, async (req, res) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            `SELECT i.integration_type, i.status, i.updated_at, 
              CASE WHEN t.id IS NOT NULL THEN true ELSE false END as has_tokens
       FROM integrations i
       LEFT JOIN oauth_tokens t ON t.user_id = i.user_id AND t.provider = i.integration_type
       WHERE i.user_id = $1`,
            [userId]
        );

        const status = {};
        for (const row of result.rows) {
            status[row.integration_type] = {
                connected: row.status === 'connected' && row.has_tokens,
                lastUpdated: row.updated_at
            };
        }

        res.json({ status });
    } catch (error) {
        console.error('OAuth status error:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
});

/**
 * Test a connection
 */
router.post('/test/:provider', authenticate, async (req, res) => {
    try {
        const { provider } = req.params;
        const userId = req.userId;

        const providerFactory = PROVIDERS[provider];
        if (!providerFactory) {
            return res.status(400).json({ error: `Unknown provider: ${provider}` });
        }

        const oauthProvider = providerFactory();

        try {
            const accessToken = await oauthProvider.getValidToken(userId);
            const profile = await oauthProvider.getUserProfile?.(accessToken);

            res.json({
                success: true,
                provider,
                profile: profile || { message: 'Connection valid' }
            });
        } catch (e) {
            res.json({
                success: false,
                provider,
                error: e.message
            });
        }
    } catch (error) {
        console.error('OAuth test error:', error);
        res.status(500).json({ error: 'Failed to test connection' });
    }
});

module.exports = router;
