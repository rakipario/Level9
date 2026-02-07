/**
 * Slack Tool
 * 
 * Handles Slack messaging operations.
 */

const { WebClient } = require('@slack/web-api');
const { pool } = require('../utils/db');

/**
 * Get Slack client
 */
async function getSlackClient(context) {
    const integration = context.integrations.find(i => i.integration_type === 'slack');

    if (!integration) {
        throw new Error('Slack not connected. Please connect Slack first.');
    }

    const tokenResult = await pool.query(
        'SELECT * FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
        [context.userId, 'slack']
    );

    if (tokenResult.rows.length === 0) {
        throw new Error('Slack credentials not found.');
    }

    return new WebClient(tokenResult.rows[0].access_token);
}

/**
 * Send a message to a Slack channel
 */
async function sendMessage(args, context) {
    const { channel, message, thread_ts, blocks } = args;
    const slack = await getSlackClient(context);

    const result = await slack.chat.postMessage({
        channel,
        text: message,
        thread_ts,
        blocks
    });

    return {
        result: {
            success: true,
            channel: result.channel,
            timestamp: result.ts,
            message: message
        }
    };
}

/**
 * List channels
 */
async function listChannels(args, context) {
    const { types = 'public_channel,private_channel', limit = 100 } = args;
    const slack = await getSlackClient(context);

    const result = await slack.conversations.list({
        types,
        limit,
        exclude_archived: true
    });

    return {
        result: {
            success: true,
            channels: result.channels.map(ch => ({
                id: ch.id,
                name: ch.name,
                isPrivate: ch.is_private,
                memberCount: ch.num_members
            }))
        }
    };
}

/**
 * Read messages from a channel
 */
async function readMessages(args, context) {
    const { channel, limit = 20 } = args;
    const slack = await getSlackClient(context);

    const result = await slack.conversations.history({
        channel,
        limit
    });

    return {
        result: {
            success: true,
            channel,
            messages: result.messages.map(msg => ({
                user: msg.user,
                text: msg.text,
                timestamp: msg.ts,
                type: msg.type
            }))
        }
    };
}

/**
 * Search messages
 */
async function searchMessages(args, context) {
    const { query, count = 20 } = args;
    const slack = await getSlackClient(context);

    const result = await slack.search.messages({
        query,
        count
    });

    return {
        result: {
            success: true,
            query,
            total: result.messages.total,
            matches: result.messages.matches.map(match => ({
                text: match.text,
                channel: match.channel.name,
                user: match.user,
                timestamp: match.ts,
                permalink: match.permalink
            }))
        }
    };
}

/**
 * Get user info
 */
async function getUserInfo(args, context) {
    const { user_id } = args;
    const slack = await getSlackClient(context);

    const result = await slack.users.info({ user: user_id });

    return {
        result: {
            success: true,
            user: {
                id: result.user.id,
                name: result.user.name,
                realName: result.user.real_name,
                email: result.user.profile.email,
                title: result.user.profile.title,
                avatar: result.user.profile.image_72
            }
        }
    };
}

module.exports = {
    sendMessage,
    listChannels,
    readMessages,
    searchMessages,
    getUserInfo
};
