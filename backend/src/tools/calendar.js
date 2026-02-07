/**
 * Calendar Tool
 * 
 * Handles calendar operations for Google Calendar and Outlook Calendar.
 */

const { google } = require('googleapis');
const { Client } = require('@microsoft/microsoft-graph-client');
const { pool } = require('../utils/db');

/**
 * Get calendar client
 */
async function getCalendarClient(context) {
    const integration = context.integrations.find(i =>
        ['google_calendar', 'outlook_calendar'].includes(i.integration_type)
    );

    if (!integration) {
        throw new Error('No calendar connected. Please connect Google Calendar or Outlook first.');
    }

    const tokenResult = await pool.query(
        'SELECT * FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
        [context.userId, integration.integration_type]
    );

    if (tokenResult.rows.length === 0) {
        throw new Error(`${integration.integration_type} credentials not found.`);
    }

    const tokens = tokenResult.rows[0];

    if (integration.integration_type === 'google_calendar') {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token
        });
        return { type: 'google', client: google.calendar({ version: 'v3', auth: oauth2Client }) };
    } else {
        return {
            type: 'outlook',
            client: Client.init({ authProvider: (done) => done(null, tokens.access_token) })
        };
    }
}

/**
 * Create a calendar event
 */
async function createEvent(args, context) {
    const { title, start, end, description, attendees, location } = args;
    const { type, client } = await getCalendarClient(context);

    if (type === 'google') {
        const event = {
            summary: title,
            description,
            location,
            start: { dateTime: start, timeZone: 'UTC' },
            end: { dateTime: end, timeZone: 'UTC' },
            attendees: attendees?.map(email => ({ email }))
        };

        const response = await client.events.insert({
            calendarId: 'primary',
            resource: event,
            sendUpdates: attendees?.length > 0 ? 'all' : 'none'
        });

        return {
            result: {
                success: true,
                eventId: response.data.id,
                htmlLink: response.data.htmlLink,
                provider: 'google_calendar'
            }
        };
    } else {
        const event = {
            subject: title,
            body: { contentType: 'text', content: description || '' },
            start: { dateTime: start, timeZone: 'UTC' },
            end: { dateTime: end, timeZone: 'UTC' },
            location: location ? { displayName: location } : undefined,
            attendees: attendees?.map(email => ({
                emailAddress: { address: email },
                type: 'required'
            }))
        };

        const response = await client.api('/me/events').post(event);

        return {
            result: {
                success: true,
                eventId: response.id,
                webLink: response.webLink,
                provider: 'outlook_calendar'
            }
        };
    }
}

/**
 * List upcoming events
 */
async function listEvents(args, context) {
    const { start_date, end_date, max_results = 10 } = args;
    const { type, client } = await getCalendarClient(context);

    const timeMin = start_date || new Date().toISOString();
    const timeMax = end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (type === 'google') {
        const response = await client.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            maxResults: max_results,
            singleEvents: true,
            orderBy: 'startTime'
        });

        return {
            result: {
                success: true,
                events: response.data.items.map(event => ({
                    id: event.id,
                    title: event.summary,
                    start: event.start.dateTime || event.start.date,
                    end: event.end.dateTime || event.end.date,
                    description: event.description,
                    location: event.location,
                    attendees: event.attendees?.map(a => a.email)
                })),
                provider: 'google_calendar'
            }
        };
    } else {
        const response = await client
            .api('/me/calendarview')
            .query({ startDateTime: timeMin, endDateTime: timeMax })
            .top(max_results)
            .get();

        return {
            result: {
                success: true,
                events: response.value.map(event => ({
                    id: event.id,
                    title: event.subject,
                    start: event.start.dateTime,
                    end: event.end.dateTime,
                    description: event.bodyPreview,
                    location: event.location?.displayName,
                    attendees: event.attendees?.map(a => a.emailAddress.address)
                })),
                provider: 'outlook_calendar'
            }
        };
    }
}

/**
 * Update a calendar event
 */
async function updateEvent(args, context) {
    const { event_id, title, start, end, description, location } = args;
    const { type, client } = await getCalendarClient(context);

    if (type === 'google') {
        const updates = {};
        if (title) updates.summary = title;
        if (description) updates.description = description;
        if (location) updates.location = location;
        if (start) updates.start = { dateTime: start, timeZone: 'UTC' };
        if (end) updates.end = { dateTime: end, timeZone: 'UTC' };

        await client.events.patch({
            calendarId: 'primary',
            eventId: event_id,
            resource: updates
        });

        return { result: { success: true, eventId: event_id, provider: 'google_calendar' } };
    } else {
        const updates = {};
        if (title) updates.subject = title;
        if (description) updates.body = { contentType: 'text', content: description };
        if (location) updates.location = { displayName: location };
        if (start) updates.start = { dateTime: start, timeZone: 'UTC' };
        if (end) updates.end = { dateTime: end, timeZone: 'UTC' };

        await client.api(`/me/events/${event_id}`).patch(updates);

        return { result: { success: true, eventId: event_id, provider: 'outlook_calendar' } };
    }
}

/**
 * Delete a calendar event
 */
async function deleteEvent(args, context) {
    const { event_id } = args;
    const { type, client } = await getCalendarClient(context);

    if (type === 'google') {
        await client.events.delete({ calendarId: 'primary', eventId: event_id });
    } else {
        await client.api(`/me/events/${event_id}`).delete();
    }

    return { result: { success: true, eventId: event_id, deleted: true } };
}

module.exports = {
    createEvent,
    listEvents,
    updateEvent,
    deleteEvent
};
