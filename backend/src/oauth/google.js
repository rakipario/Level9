/**
 * Google OAuth Provider
 * 
 * Handles OAuth for Gmail, Google Sheets, Calendar, and Drive.
 */

const { OAuthProvider } = require('./base');

const GOOGLE_SCOPES = {
    gmail: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly'
    ],
    sheets: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
    ],
    calendar: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ],
    drive: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file'
    ]
};

class GoogleOAuthProvider extends OAuthProvider {
    constructor(services = ['gmail', 'sheets', 'calendar']) {
        // Combine scopes for all requested services
        const scopes = services.flatMap(service => GOOGLE_SCOPES[service] || []);

        super('google', {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/oauth/google/callback`,
            scopes: [...new Set(scopes)], // Deduplicate scopes
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token'
        });

        this.services = services;
    }

    /**
     * Get authorization URL with Google-specific options
     */
    getAuthorizationUrl(state) {
        return super.getAuthorizationUrl(state, {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true'
        });
    }

    /**
     * Get user profile from Google
     */
    async getUserProfile(accessToken) {
        const axios = require('axios');

        const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        return {
            id: response.data.id,
            email: response.data.email,
            name: response.data.name,
            picture: response.data.picture
        };
    }
}

/**
 * Create Gmail provider
 */
function createGmailProvider() {
    return new GoogleOAuthProvider(['gmail']);
}

/**
 * Create Google Sheets provider
 */
function createSheetsProvider() {
    return new GoogleOAuthProvider(['sheets', 'drive']);
}

/**
 * Create Google Calendar provider
 */
function createCalendarProvider() {
    return new GoogleOAuthProvider(['calendar']);
}

/**
 * Create full Google provider with all services
 */
function createFullGoogleProvider() {
    return new GoogleOAuthProvider(['gmail', 'sheets', 'calendar', 'drive']);
}

module.exports = {
    GoogleOAuthProvider,
    createGmailProvider,
    createSheetsProvider,
    createCalendarProvider,
    createFullGoogleProvider,
    GOOGLE_SCOPES
};
