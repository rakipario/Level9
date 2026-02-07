/**
 * Web Tool
 * 
 * Handles web searches and URL fetching.
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Search the web
 */
async function search(args, context) {
    const { query, num_results = 5 } = args;

    // Use a search API (configurable - here using SerpAPI or similar)
    // For demo purposes, we'll use DuckDuckGo's instant answer API
    try {
        const response = await axios.get('https://api.duckduckgo.com/', {
            params: {
                q: query,
                format: 'json',
                no_html: 1,
                skip_disambig: 1
            },
            timeout: 10000
        });

        const results = [];

        // Add abstract if available
        if (response.data.Abstract) {
            results.push({
                title: response.data.Heading || query,
                snippet: response.data.Abstract,
                url: response.data.AbstractURL,
                source: response.data.AbstractSource
            });
        }

        // Add related topics
        if (response.data.RelatedTopics) {
            for (const topic of response.data.RelatedTopics.slice(0, num_results - 1)) {
                if (topic.Text) {
                    results.push({
                        title: topic.Text.split(' - ')[0],
                        snippet: topic.Text,
                        url: topic.FirstURL
                    });
                }
            }
        }

        return {
            result: {
                query,
                count: results.length,
                results
            }
        };
    } catch (error) {
        throw new Error(`Search failed: ${error.message}`);
    }
}

/**
 * Fetch and parse content from a URL
 */
async function fetchUrl(args, context) {
    const { url, extract = 'text' } = args;

    try {
        const response = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RelayBot/1.0)'
            }
        });

        const contentType = response.headers['content-type'] || '';

        // Handle JSON responses
        if (contentType.includes('application/json') || extract === 'json') {
            return {
                result: {
                    url,
                    type: 'json',
                    data: response.data
                }
            };
        }

        // Handle HTML
        const $ = cheerio.load(response.data);

        // Remove scripts, styles, and other non-content elements
        $('script, style, nav, header, footer, aside, .ad, .advertisement').remove();

        switch (extract) {
            case 'text':
                const text = $('body').text().replace(/\s+/g, ' ').trim();
                return {
                    result: {
                        url,
                        type: 'text',
                        title: $('title').text().trim(),
                        content: text.slice(0, 10000), // Limit to 10k chars
                        length: text.length
                    }
                };

            case 'html':
                return {
                    result: {
                        url,
                        type: 'html',
                        title: $('title').text().trim(),
                        html: $('body').html()?.slice(0, 20000)
                    }
                };

            case 'links':
                const links = [];
                $('a[href]').each((_, el) => {
                    const href = $(el).attr('href');
                    const text = $(el).text().trim();
                    if (href && text && !href.startsWith('#')) {
                        links.push({ text, href });
                    }
                });
                return {
                    result: {
                        url,
                        type: 'links',
                        count: links.length,
                        links: links.slice(0, 50)
                    }
                };

            default:
                return {
                    result: {
                        url,
                        type: 'text',
                        content: $('body').text().replace(/\s+/g, ' ').trim().slice(0, 10000)
                    }
                };
        }
    } catch (error) {
        if (error.response) {
            throw new Error(`Failed to fetch URL: ${error.response.status} ${error.response.statusText}`);
        }
        throw new Error(`Failed to fetch URL: ${error.message}`);
    }
}

/**
 * Make an API request
 */
async function apiRequest(args, context) {
    const { url, method = 'GET', headers = {}, body, params } = args;

    try {
        const response = await axios({
            method,
            url,
            headers,
            data: body,
            params,
            timeout: 30000
        });

        return {
            result: {
                success: true,
                status: response.status,
                headers: response.headers,
                data: response.data
            }
        };
    } catch (error) {
        if (error.response) {
            return {
                result: {
                    success: false,
                    status: error.response.status,
                    error: error.response.data
                }
            };
        }
        throw new Error(`API request failed: ${error.message}`);
    }
}

/**
 * Extract structured data from a webpage
 */
async function extractData(args, context) {
    const { url, selectors } = args;

    const response = await axios.get(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RelayBot/1.0)' }
    });

    const $ = cheerio.load(response.data);
    const data = {};

    for (const [key, selector] of Object.entries(selectors)) {
        const elements = $(selector);
        if (elements.length === 1) {
            data[key] = elements.text().trim();
        } else {
            data[key] = elements.map((_, el) => $(el).text().trim()).get();
        }
    }

    return {
        result: {
            url,
            extractedData: data
        }
    };
}

module.exports = {
    search,
    fetchUrl,
    apiRequest,
    extractData
};
