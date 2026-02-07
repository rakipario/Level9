/**
 * Microsoft OAuth Provider
 * 
 * Handles OAuth for Outlook, Excel Online, and OneDrive.
 */

const { OAuthProvider } = require('./base');

const MICROSOFT_SCOPES = {
    outlook: [
        'Mail.Read',
        'Mail.Send',
        'Mail.ReadWrite'
    ],
    excel: [
        'Files.Read',
        'Files.ReadWrite'
    ],
    calendar: [
        'Calendars.Read',
        'Calendars.ReadWrite'
    ],
    onedrive: [
        'Files.Read.All',
        'Files.ReadWrite.All'
    ]
};

class MicrosoftOAuthProvider extends OAuthProvider {
    constructor(services = ['outlook', 'excel', 'calendar']) {
        const scopes = [
            'openid',
            'profile',
            'email',
            'offline_access',
            ...services.flatMap(service => MICROSOFT_SCOPES[service] || [])
        ];

        super('microsoft', {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            redirectUri: process.env.MICROSOFT_REDIRECT_URI || `${process.env.BACKEND_URL}/api/oauth/microsoft/callback`,
            scopes: [...new Set(scopes)],
            authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
        });

        this.services = services;
    }

    /**
     * Get user profile from Microsoft Graph
     */
    async getUserProfile(accessToken) {
        const axios = require('axios');

        const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        return {
            id: response.data.id,
            email: response.data.mail || response.data.userPrincipalName,
            name: response.data.displayName,
            givenName: response.data.givenName,
            surname: response.data.surname
        };
    }
}

/**
 * Create Outlook provider
 */
function createOutlookProvider() {
    return new MicrosoftOAuthProvider(['outlook']);
}

/**
 * Create Excel Online provider
 */
function createExcelProvider() {
    return new MicrosoftOAuthProvider(['excel', 'onedrive']);
}

/**
 * Create Outlook Calendar provider
 */
function createOutlookCalendarProvider() {
    return new MicrosoftOAuthProvider(['calendar']);
}

/**
 * Create full Microsoft provider with all services
 */
function createFullMicrosoftProvider() {
    return new MicrosoftOAuthProvider(['outlook', 'excel', 'calendar', 'onedrive']);
}

module.exports = {
    MicrosoftOAuthProvider,
    createOutlookProvider,
    createExcelProvider,
    createOutlookCalendarProvider,
    createFullMicrosoftProvider,
    MICROSOFT_SCOPES
};
