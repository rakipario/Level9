/**
 * Base OAuth Handler
 * 
 * Abstract OAuth 2.0 handler with token management and refresh.
 */

const { pool } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

class OAuthProvider {
    constructor(providerName, config) {
        this.providerName = providerName;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.redirectUri = config.redirectUri;
        this.scopes = config.scopes || [];
        this.authUrl = config.authUrl;
        this.tokenUrl = config.tokenUrl;
    }

    /**
     * Generate authorization URL
     */
    getAuthorizationUrl(state, additionalParams = {}) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: this.scopes.join(' '),
            state,
            access_type: 'offline',
            prompt: 'consent',
            ...additionalParams
        });

        return `${this.authUrl}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code) {
        const axios = require('axios');

        const response = await axios.post(this.tokenUrl, new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code',
            code
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return response.data;
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken) {
        const axios = require('axios');

        const response = await axios.post(this.tokenUrl, new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return response.data;
    }

    /**
     * Store tokens in database
     */
    async storeTokens(userId, tokens) {
        const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

        const existing = await pool.query(
            'SELECT id FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
            [userId, this.providerName]
        );

        if (existing.rows.length > 0) {
            await pool.query(
                `UPDATE oauth_tokens 
         SET access_token = $1, refresh_token = COALESCE($2, refresh_token), 
             expires_at = $3, scopes = $4, updated_at = NOW()
         WHERE user_id = $5 AND provider = $6`,
                [tokens.access_token, tokens.refresh_token, expiresAt,
                JSON.stringify(this.scopes), userId, this.providerName]
            );
        } else {
            await pool.query(
                `INSERT INTO oauth_tokens (id, user_id, provider, access_token, refresh_token, expires_at, scopes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [uuidv4(), userId, this.providerName, tokens.access_token,
                tokens.refresh_token, expiresAt, JSON.stringify(this.scopes)]
            );
        }
    }

    /**
     * Get valid access token (refresh if needed)
     */
    async getValidToken(userId) {
        const result = await pool.query(
            'SELECT * FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
            [userId, this.providerName]
        );

        if (result.rows.length === 0) {
            throw new Error(`No ${this.providerName} credentials found`);
        }

        const tokenData = result.rows[0];
        const expiresAt = new Date(tokenData.expires_at);

        // Refresh if expired or expiring within 5 minutes
        if (expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
            if (!tokenData.refresh_token) {
                throw new Error(`${this.providerName} token expired and no refresh token available`);
            }

            const newTokens = await this.refreshAccessToken(tokenData.refresh_token);
            await this.storeTokens(userId, newTokens);
            return newTokens.access_token;
        }

        return tokenData.access_token;
    }

    /**
     * Revoke tokens
     */
    async revokeTokens(userId) {
        await pool.query(
            'DELETE FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
            [userId, this.providerName]
        );
    }
}

/**
 * Generate state parameter for OAuth
 */
function generateOAuthState(userId, provider) {
    const state = Buffer.from(JSON.stringify({
        userId,
        provider,
        timestamp: Date.now(),
        nonce: uuidv4()
    })).toString('base64');

    return state;
}

/**
 * Parse and validate OAuth state
 */
function parseOAuthState(state) {
    try {
        const data = JSON.parse(Buffer.from(state, 'base64').toString());

        // Validate timestamp (10 minute expiry)
        if (Date.now() - data.timestamp > 10 * 60 * 1000) {
            throw new Error('OAuth state expired');
        }

        return data;
    } catch (error) {
        throw new Error('Invalid OAuth state');
    }
}

module.exports = {
    OAuthProvider,
    generateOAuthState,
    parseOAuthState
};
