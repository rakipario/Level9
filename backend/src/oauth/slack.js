/**
 * Slack OAuth Provider
 */

const { OAuthProvider } = require('./base');

class SlackOAuthProvider extends OAuthProvider {
    constructor() {
        super('slack', {
            clientId: process.env.SLACK_CLIENT_ID,
            clientSecret: process.env.SLACK_CLIENT_SECRET,
            redirectUri: process.env.SLACK_REDIRECT_URI || `${process.env.BACKEND_URL}/api/oauth/slack/callback`,
            scopes: [
                'chat:write',
                'channels:read',
                'channels:history',
                'users:read',
                'search:read'
            ],
            authUrl: 'https://slack.com/oauth/v2/authorize',
            tokenUrl: 'https://slack.com/api/oauth.v2.access'
        });
    }

    async exchangeCodeForTokens(code) {
        const axios = require('axios');

        const response = await axios.post(this.tokenUrl, new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code,
            redirect_uri: this.redirectUri
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!response.data.ok) {
            throw new Error(`Slack OAuth error: ${response.data.error}`);
        }

        return {
            access_token: response.data.access_token,
            team_id: response.data.team?.id,
            team_name: response.data.team?.name,
            bot_user_id: response.data.bot_user_id
        };
    }
}

module.exports = {
    SlackOAuthProvider,
    createSlackProvider: () => new SlackOAuthProvider()
};
