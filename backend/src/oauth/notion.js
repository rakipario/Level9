/**
 * Notion OAuth Provider
 */

const { OAuthProvider } = require('./base');

class NotionOAuthProvider extends OAuthProvider {
    constructor() {
        super('notion', {
            clientId: process.env.NOTION_CLIENT_ID,
            clientSecret: process.env.NOTION_CLIENT_SECRET,
            redirectUri: process.env.NOTION_REDIRECT_URI || `${process.env.BACKEND_URL}/api/oauth/notion/callback`,
            scopes: [],
            authUrl: 'https://api.notion.com/v1/oauth/authorize',
            tokenUrl: 'https://api.notion.com/v1/oauth/token'
        });
    }

    getAuthorizationUrl(state) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            owner: 'user',
            state
        });

        return `${this.authUrl}?${params.toString()}`;
    }

    async exchangeCodeForTokens(code) {
        const axios = require('axios');
        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        const response = await axios.post(this.tokenUrl, {
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.redirectUri
        }, {
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            access_token: response.data.access_token,
            workspace_id: response.data.workspace_id,
            workspace_name: response.data.workspace_name,
            bot_id: response.data.bot_id
        };
    }
}

module.exports = {
    NotionOAuthProvider,
    createNotionProvider: () => new NotionOAuthProvider()
};
