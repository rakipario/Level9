/**
 * Notion Tool
 * 
 * Handles creating and querying Notion pages and databases.
 */

const { Client } = require('@notionhq/client');
const { pool } = require('../utils/db');

/**
 * Get Notion client
 */
async function getNotionClient(context) {
    const integration = context.integrations.find(i => i.integration_type === 'notion');

    if (!integration) {
        throw new Error('Notion not connected. Please connect Notion first.');
    }

    const tokenResult = await pool.query(
        'SELECT * FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
        [context.userId, 'notion']
    );

    if (tokenResult.rows.length === 0) {
        throw new Error('Notion credentials not found.');
    }

    return new Client({ auth: tokenResult.rows[0].access_token });
}

/**
 * Create a new Notion page
 */
async function createPage(args, context) {
    const { parent_id, title, content, properties } = args;
    const notion = await getNotionClient(context);

    // Convert markdown content to Notion blocks
    const blocks = markdownToBlocks(content);

    const pageData = {
        parent: parent_id
            ? { page_id: parent_id }
            : { type: 'page_id', page_id: parent_id },
        properties: {
            title: {
                title: [{ text: { content: title } }]
            },
            ...properties
        },
        children: blocks
    };

    const response = await notion.pages.create(pageData);

    return {
        result: {
            success: true,
            pageId: response.id,
            url: response.url,
            title
        }
    };
}

/**
 * Query a Notion database
 */
async function queryDatabase(args, context) {
    const { database_id, filter, sorts } = args;
    const notion = await getNotionClient(context);

    const queryParams = {
        database_id,
        page_size: 100
    };

    if (filter) queryParams.filter = filter;
    if (sorts) queryParams.sorts = sorts;

    const response = await notion.databases.query(queryParams);

    const results = response.results.map(page => ({
        id: page.id,
        url: page.url,
        created: page.created_time,
        modified: page.last_edited_time,
        properties: extractProperties(page.properties)
    }));

    return {
        result: {
            success: true,
            database_id,
            count: results.length,
            hasMore: response.has_more,
            data: results
        }
    };
}

/**
 * Update a Notion page
 */
async function updatePage(args, context) {
    const { page_id, properties, content } = args;
    const notion = await getNotionClient(context);

    const updateData = {};
    if (properties) updateData.properties = properties;

    await notion.pages.update({
        page_id,
        ...updateData
    });

    // Update content if provided
    if (content) {
        const blocks = markdownToBlocks(content);
        for (const block of blocks) {
            await notion.blocks.children.append({
                block_id: page_id,
                children: [block]
            });
        }
    }

    return {
        result: {
            success: true,
            pageId: page_id
        }
    };
}

/**
 * Search Notion
 */
async function searchNotion(args, context) {
    const { query, filter_type } = args;
    const notion = await getNotionClient(context);

    const searchParams = { query };
    if (filter_type) {
        searchParams.filter = { property: 'object', value: filter_type };
    }

    const response = await notion.search(searchParams);

    return {
        result: {
            success: true,
            count: response.results.length,
            results: response.results.map(item => ({
                id: item.id,
                type: item.object,
                title: item.object === 'page'
                    ? item.properties?.title?.title?.[0]?.plain_text || 'Untitled'
                    : item.title?.[0]?.plain_text || 'Untitled',
                url: item.url
            }))
        }
    };
}

/**
 * Convert markdown to Notion blocks
 */
function markdownToBlocks(markdown) {
    if (!markdown) return [];

    const blocks = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
        if (line.startsWith('# ')) {
            blocks.push({
                type: 'heading_1',
                heading_1: { rich_text: [{ text: { content: line.slice(2) } }] }
            });
        } else if (line.startsWith('## ')) {
            blocks.push({
                type: 'heading_2',
                heading_2: { rich_text: [{ text: { content: line.slice(3) } }] }
            });
        } else if (line.startsWith('### ')) {
            blocks.push({
                type: 'heading_3',
                heading_3: { rich_text: [{ text: { content: line.slice(4) } }] }
            });
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            blocks.push({
                type: 'bulleted_list_item',
                bulleted_list_item: { rich_text: [{ text: { content: line.slice(2) } }] }
            });
        } else if (line.match(/^\d+\. /)) {
            blocks.push({
                type: 'numbered_list_item',
                numbered_list_item: { rich_text: [{ text: { content: line.replace(/^\d+\. /, '') } }] }
            });
        } else if (line.startsWith('```')) {
            // Skip code block markers (simplified)
        } else if (line.trim()) {
            blocks.push({
                type: 'paragraph',
                paragraph: { rich_text: [{ text: { content: line } }] }
            });
        }
    }

    return blocks;
}

/**
 * Extract properties from Notion page
 */
function extractProperties(properties) {
    const extracted = {};

    for (const [key, value] of Object.entries(properties)) {
        switch (value.type) {
            case 'title':
                extracted[key] = value.title?.[0]?.plain_text || '';
                break;
            case 'rich_text':
                extracted[key] = value.rich_text?.[0]?.plain_text || '';
                break;
            case 'number':
                extracted[key] = value.number;
                break;
            case 'select':
                extracted[key] = value.select?.name || '';
                break;
            case 'multi_select':
                extracted[key] = value.multi_select?.map(s => s.name) || [];
                break;
            case 'date':
                extracted[key] = value.date?.start || '';
                break;
            case 'checkbox':
                extracted[key] = value.checkbox;
                break;
            case 'url':
                extracted[key] = value.url || '';
                break;
            case 'email':
                extracted[key] = value.email || '';
                break;
            default:
                extracted[key] = value[value.type];
        }
    }

    return extracted;
}

module.exports = {
    createPage,
    queryDatabase,
    updatePage,
    searchNotion,
    markdownToBlocks,
    extractProperties
};
