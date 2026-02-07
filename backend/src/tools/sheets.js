/**
 * Sheets Tool
 * 
 * Handles reading and writing to Google Sheets and Excel Online.
 */

const { google } = require('googleapis');
const { Client } = require('@microsoft/microsoft-graph-client');
const { pool } = require('../utils/db');

/**
 * Get spreadsheet client for the specified integration
 */
async function getSheetsClient(context, integrationTypes) {
    const integration = context.integrations.find(i =>
        integrationTypes.includes(i.integration_type)
    );

    if (!integration) {
        throw new Error('No spreadsheet integration connected. Please connect Google Sheets or Excel first.');
    }

    const tokenResult = await pool.query(
        'SELECT * FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
        [context.userId, integration.integration_type]
    );

    if (tokenResult.rows.length === 0) {
        throw new Error(`${integration.integration_type} credentials not found.`);
    }

    const tokens = tokenResult.rows[0];

    if (integration.integration_type === 'google_sheets') {
        return { type: 'google', client: await getGoogleSheetsClient(tokens) };
    } else if (integration.integration_type === 'excel') {
        return { type: 'excel', client: await getExcelClient(tokens) };
    }

    throw new Error('Unknown spreadsheet provider');
}

/**
 * Initialize Google Sheets client
 */
async function getGoogleSheetsClient(tokens) {
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

    return google.sheets({ version: 'v4', auth: oauth2Client });
}

/**
 * Initialize Excel Online client
 */
async function getExcelClient(tokens) {
    return Client.init({
        authProvider: (done) => {
            done(null, tokens.access_token);
        }
    });
}

/**
 * Read data from a spreadsheet
 */
async function readSpreadsheet(args, context) {
    const { spreadsheet_id, range } = args;

    const { type, client } = await getSheetsClient(context, ['google_sheets', 'excel']);

    if (type === 'google') {
        return await readGoogleSheet(client, spreadsheet_id, range);
    } else {
        return await readExcelOnline(client, spreadsheet_id, range);
    }
}

/**
 * Read from Google Sheets
 */
async function readGoogleSheet(sheets, spreadsheetId, range) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
    });

    const values = response.data.values || [];
    const headers = values[0] || [];
    const rows = values.slice(1);

    // Convert to objects
    const data = rows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = row[i];
        });
        return obj;
    });

    return {
        result: {
            type: 'spreadsheet',
            provider: 'google_sheets',
            spreadsheetId,
            range,
            headers,
            rowCount: rows.length,
            data,
            preview: data.slice(0, 5)
        }
    };
}

/**
 * Read from Excel Online
 */
async function readExcelOnline(client, workbookId, range) {
    const response = await client
        .api(`/me/drive/items/${workbookId}/workbook/worksheets/Sheet1/range(address='${range}')`)
        .get();

    const values = response.values || [];
    const headers = values[0] || [];
    const rows = values.slice(1);

    const data = rows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = row[i];
        });
        return obj;
    });

    return {
        result: {
            type: 'spreadsheet',
            provider: 'excel',
            workbookId,
            range,
            headers,
            rowCount: rows.length,
            data,
            preview: data.slice(0, 5)
        }
    };
}

/**
 * Write data to a spreadsheet
 */
async function writeSpreadsheet(args, context) {
    const { spreadsheet_id, range, values } = args;

    const { type, client } = await getSheetsClient(context, ['google_sheets', 'excel']);

    if (type === 'google') {
        return await writeGoogleSheet(client, spreadsheet_id, range, values);
    } else {
        return await writeExcelOnline(client, spreadsheet_id, range, values);
    }
}

/**
 * Write to Google Sheets
 */
async function writeGoogleSheet(sheets, spreadsheetId, range, values) {
    const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values
        }
    });

    return {
        result: {
            success: true,
            provider: 'google_sheets',
            spreadsheetId,
            range,
            updatedCells: response.data.updatedCells,
            updatedRows: response.data.updatedRows
        }
    };
}

/**
 * Write to Excel Online
 */
async function writeExcelOnline(client, workbookId, range, values) {
    await client
        .api(`/me/drive/items/${workbookId}/workbook/worksheets/Sheet1/range(address='${range}')`)
        .patch({ values });

    return {
        result: {
            success: true,
            provider: 'excel',
            workbookId,
            range,
            rowsWritten: values.length
        }
    };
}

/**
 * List available spreadsheets
 */
async function listSpreadsheets(args, context) {
    const { type, client } = await getSheetsClient(context, ['google_sheets', 'excel']);

    if (type === 'google') {
        const drive = google.drive({ version: 'v3', auth: client.context._options.auth });
        const response = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            fields: 'files(id, name, createdTime, modifiedTime)',
            pageSize: 50
        });

        return {
            result: {
                spreadsheets: response.data.files.map(f => ({
                    id: f.id,
                    name: f.name,
                    created: f.createdTime,
                    modified: f.modifiedTime
                })),
                provider: 'google_sheets'
            }
        };
    } else {
        const response = await client
            .api('/me/drive/root/search(q=\'.xlsx\')')
            .get();

        return {
            result: {
                spreadsheets: response.value.map(f => ({
                    id: f.id,
                    name: f.name,
                    created: f.createdDateTime,
                    modified: f.lastModifiedDateTime
                })),
                provider: 'excel'
            }
        };
    }
}

module.exports = {
    readSpreadsheet,
    writeSpreadsheet,
    listSpreadsheets,
    readGoogleSheet,
    readExcelOnline,
    writeGoogleSheet,
    writeExcelOnline
};
