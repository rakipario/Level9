/**
 * Website Builder Tool
 * 
 * Generates and hosts simple HTML/CSS/JS websites.
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const SITES_DIR = path.join(process.cwd(), 'generated-sites');

// Ensure sites directory exists
fs.mkdir(SITES_DIR, { recursive: true }).catch(() => { });

async function generateWebsite(args, context) {
    const { html, css = "", javascript = "", title = "Relay Generated Site" } = args;
    const siteId = uuidv4();
    const sitePath = path.join(SITES_DIR, siteId);

    await fs.mkdir(sitePath, { recursive: true });

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        ${javascript}
    </script>
</body>
</html>
    `;

    await fs.writeFile(path.join(sitePath, 'index.html'), fullHtml, 'utf8');

    // In a real app, this would be a full URL. Here it's relative to the backend.
    const url = `/sites/${siteId}/index.html`;

    return {
        result: {
            url,
            siteId,
            title,
            message: "Website successfully generated and hosted!"
        },
        stateUpdates: {
            lastGeneratedSite: { url, siteId, title }
        }
    };
}

module.exports = {
    generateWebsite
};
