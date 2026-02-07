/**
 * Email Tool
 * 
 * Handles sending and reading emails through Gmail and Outlook.
 */

const { google } = require('googleapis');
const { Client } = require('@microsoft/microsoft-graph-client');
const { query, pool } = require('../utils/db');

/**
 * Get OAuth client for the specified integration
 */
async function getEmailClient(context, integrationTypes) {
    const integration = context.integrations.find(i =>
        integrationTypes.includes(i.integration_type)
    );

    if (!integration) {
        throw new Error('No email integration connected. Please connect Gmail or Outlook first.');
    }

    // Get tokens from database
    const tokenResult = await pool.query(
        'SELECT * FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
        [context.userId, integration.integration_type]
    );

    if (tokenResult.rows.length === 0) {
        throw new Error(`${integration.integration_type} credentials not found. Please reconnect the integration.`);
    }

    const tokens = tokenResult.rows[0];

    if (integration.integration_type === 'gmail') {
        return { type: 'gmail', client: await getGmailClient(tokens) };
    } else if (integration.integration_type === 'outlook') {
        return { type: 'outlook', client: await getOutlookClient(tokens) };
    }

    throw new Error('Unknown email provider');
}

/**
 * Initialize Gmail client
 */
async function getGmailClient(tokens) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: new Date(tokens.expires_at).getTime()
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Initialize Outlook client
 */
async function getOutlookClient(tokens) {
    return Client.init({
        authProvider: (done) => {
            done(null, tokens.access_token);
        }
    });
}

/**
 * Send an email
 */
async function sendEmail(args, context) {
    const { to, subject, body, cc, attachments } = args;

    const { type, client } = await getEmailClient(context, ['gmail', 'outlook']);

    if (type === 'gmail') {
        return await sendGmailEmail(client, { to, subject, body, cc, attachments });
    } else {
        return await sendOutlookEmail(client, { to, subject, body, cc, attachments });
    }
}

/**
 * Send email via Gmail
 */
async function sendGmailEmail(gmail, { to, subject, body, cc }) {
    const toHeader = Array.isArray(to) ? to.join(', ') : to;
    const ccHeader = cc && cc.length > 0 ? `Cc: ${cc.join(', ')}\n` : '';

    const message = [
        `To: ${toHeader}`,
        ccHeader,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body
    ].join('\n');

    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage
        }
    });

    return {
        result: {
            success: true,
            messageId: result.data.id,
            provider: 'gmail',
            recipients: to
        }
    };
}

/**
 * Send email via Outlook
 */
async function sendOutlookEmail(client, { to, subject, body, cc }) {
    const message = {
        subject,
        body: {
            contentType: 'HTML',
            content: body
        },
        toRecipients: (Array.isArray(to) ? to : [to]).map(email => ({
            emailAddress: { address: email }
        })),
        ccRecipients: (cc || []).map(email => ({
            emailAddress: { address: email }
        }))
    };

    await client.api('/me/sendMail').post({ message, saveToSentItems: true });

    return {
        result: {
            success: true,
            provider: 'outlook',
            recipients: to
        }
    };
}

/**
 * Read emails
 */
async function readEmails(args, context) {
    const { query: searchQuery, limit = 10, folder = 'inbox' } = args;

    const { type, client } = await getEmailClient(context, ['gmail', 'outlook']);

    if (type === 'gmail') {
        return await readGmailEmails(client, { searchQuery, limit, folder });
    } else {
        return await readOutlookEmails(client, { searchQuery, limit, folder });
    }
}

/**
 * Read emails from Gmail
 */
async function readGmailEmails(gmail, { searchQuery, limit, folder }) {
    const labelId = folder === 'inbox' ? 'INBOX' : folder.toUpperCase();

    const listResult = await gmail.users.messages.list({
        userId: 'me',
        labelIds: [labelId],
        q: searchQuery,
        maxResults: limit
    });

    if (!listResult.data.messages) {
        return { result: { emails: [], count: 0 } };
    }

    const emails = await Promise.all(
        listResult.data.messages.map(async (msg) => {
            const detail = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'metadata',
                metadataHeaders: ['From', 'To', 'Subject', 'Date']
            });

            const headers = detail.data.payload.headers;
            return {
                id: msg.id,
                from: headers.find(h => h.name === 'From')?.value,
                to: headers.find(h => h.name === 'To')?.value,
                subject: headers.find(h => h.name === 'Subject')?.value,
                date: headers.find(h => h.name === 'Date')?.value,
                snippet: detail.data.snippet
            };
        })
    );

    return {
        result: {
            emails,
            count: emails.length,
            provider: 'gmail'
        }
    };
}

/**
 * Read emails from Outlook
 */
async function readOutlookEmails(client, { searchQuery, limit, folder }) {
    const folderPath = folder === 'inbox' ? 'inbox' : `mailFolders/${folder}`;

    let request = client.api(`/me/${folderPath}/messages`)
        .top(limit)
        .select('id,subject,from,toRecipients,receivedDateTime,bodyPreview');

    if (searchQuery) {
        request = request.filter(`contains(subject, '${searchQuery}') or contains(body/content, '${searchQuery}')`);
    }

    const result = await request.get();

    const emails = result.value.map(msg => ({
        id: msg.id,
        from: msg.from?.emailAddress?.address,
        to: msg.toRecipients?.map(r => r.emailAddress?.address).join(', '),
        subject: msg.subject,
        date: msg.receivedDateTime,
        snippet: msg.bodyPreview
    }));

    return {
        result: {
            emails,
            count: emails.length,
            provider: 'outlook'
        }
    };
}

module.exports = {
    sendEmail,
    readEmails,
    sendGmailEmail,
    sendOutlookEmail,
    readGmailEmails,
    readOutlookEmails
};
