/**
 * Tool Registry - Production Mode (No External OAuth)
 * 
 * Disabled external integrations (Gmail, Outlook, etc.)
 * Focused on local tools: code execution, file processing, web search
 */

const codeExecutor = require('./code-executor');
const fileProcessor = require('./file-processor');
const webTool = require('./web');
const speechTool = require('./speech');
const visionTool = require('./vision');
const websiteBuilder = require('./website-builder');

// Registry of available tools (OAuth integrations disabled)
const TOOL_REGISTRY = {
    // Code execution
    execute_code: {
        module: codeExecutor,
        requiresIntegration: false,
        definition: {
            type: 'function',
            function: {
                name: 'execute_code',
                description: 'Execute Python or JavaScript code for data analysis, calculations, or generating visualizations. Returns the output of the code execution.',
                parameters: {
                    type: 'object',
                    properties: {
                        code: {
                            type: 'string',
                            description: 'The code to execute. For Python, you can use pandas, numpy, matplotlib, and other common data libraries.'
                        },
                        language: {
                            type: 'string',
                            enum: ['python', 'javascript'],
                            description: 'Programming language of the code'
                        }
                    },
                    required: ['code', 'language']
                }
            }
        }
    },

    // File processing
    read_file: {
        module: fileProcessor,
        handler: 'readFile',
        requiresIntegration: false,
        definition: {
            type: 'function',
            function: {
                name: 'read_file',
                description: 'Read and parse uploaded files. Supports: CSV, Excel (.xlsx, .xls), PDF (with OCR), JSON, text files, images, and ZIP archives. Use this when the user asks about file contents.',
                parameters: {
                    type: 'object',
                    properties: {
                        file_id: {
                            type: 'string',
                            description: 'The file ID (UUID) from the uploaded file. Look for "ID: xxx" in the user message.'
                        },
                        options: {
                            type: 'object',
                            description: 'Optional parsing settings',
                            properties: {
                                sheet: { type: 'string', description: 'Excel sheet name (default: first sheet)' },
                                encoding: { type: 'string', description: 'Text encoding (default: utf8)' },
                                limit_rows: { type: 'number', description: 'Limit number of rows to read' }
                            }
                        }
                    },
                    required: ['file_id']
                }
            }
        }
    },

    analyze_data: {
        module: fileProcessor,
        handler: 'analyzeData',
        requiresIntegration: false,
        definition: {
            type: 'function',
            function: {
                name: 'analyze_data',
                description: 'Perform statistical analysis on data. Returns summary statistics, correlations, and insights.',
                parameters: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: { type: 'object', additionalProperties: true },
                            description: 'Array of data objects to analyze'
                        },
                        analysis_type: {
                            type: 'string',
                            enum: ['summary', 'correlation', 'distribution', 'trends', 'full'],
                            description: 'Type of analysis to perform'
                        },
                        columns: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Specific columns to analyze (optional)'
                        }
                    },
                    required: ['data', 'analysis_type']
                }
            }
        }
    },

    list_uploaded_files: {
        module: fileProcessor,
        handler: 'listFiles',
        requiresIntegration: false,
        definition: {
            type: 'function',
            function: {
                name: 'list_uploaded_files',
                description: 'List all files uploaded by the user in this session',
                parameters: {
                    type: 'object',
                    properties: {}
                }
            }
        }
    },

    // Web operations (no auth needed)
    web_search: {
        module: webTool,
        handler: 'search',
        requiresIntegration: false,
        definition: {
            type: 'function',
            function: {
                name: 'web_search',
                description: 'Search the web for information',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search query'
                        },
                        num_results: {
                            type: 'number',
                            description: 'Number of results to return (default: 5)'
                        }
                    },
                    required: ['query']
                }
            }
        }
    },

    fetch_url: {
        module: webTool,
        handler: 'fetchUrl',
        requiresIntegration: false,
        definition: {
            type: 'function',
            function: {
                name: 'fetch_url',
                description: 'Fetch and parse content from a URL',
                parameters: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'URL to fetch'
                        },
                        extract: {
                            type: 'string',
                            enum: ['text', 'html', 'json', 'links'],
                            description: 'What to extract from the page'
                        }
                    },
                    required: ['url']
                }
            }
        }
    },

    // Speech transcription
    transcribe_audio: {
        module: speechTool,
        handler: 'transcribe',
        requiresIntegration: false,
        definition: {
            type: 'function',
            function: {
                name: 'transcribe_audio',
                description: 'Transcribe audio file to text using AI. Supports 90+ languages with auto-detection.',
                parameters: {
                    type: 'object',
                    properties: {
                        file_id: {
                            type: 'string',
                            description: 'ID of the audio file to transcribe'
                        },
                        language: {
                            type: 'string',
                            description: 'Optional language code (e.g., "en", "es", "fr"). Auto-detected if not provided.'
                        }
                    },
                    required: ['file_id']
                }
            }
        }
    },

    analyze_image: {
        module: visionTool,
        handler: 'analyzeImage',
        requiresIntegration: false,
        definition: {
            type: 'function',
            function: {
                name: 'analyze_image',
                description: 'Analyze an image or a PDF page as an image using AI vision. Can describe scenes, extract text, analyze charts, and identify objects.',
                parameters: {
                    type: 'object',
                    properties: {
                        file_id: {
                            type: 'string',
                            description: 'The ID of the image file to analyze.'
                        },
                        prompt: {
                            type: 'string',
                            description: 'Optional specific question or prompt about the image.'
                        }
                    },
                    required: ['file_id']
                }
            }
        }
    },

    generate_website: {
        module: websiteBuilder,
        handler: 'generateWebsite',
        requiresIntegration: false,
        definition: {
            type: 'function',
            function: {
                name: 'generate_website',
                description: 'Generate a complete HTML/CSS website from a description. Creates and hosts the site, returning a live URL.',
                parameters: {
                    type: 'object',
                    properties: {
                        html: {
                            type: 'string',
                            description: 'The inner HTML content of the body.'
                        },
                        css: {
                            type: 'string',
                            description: 'CSS styles for the website.'
                        },
                        javascript: {
                            type: 'string',
                            description: 'Optional JavaScript for interactivity.'
                        },
                        title: {
                            type: 'string',
                            description: 'Title of the website.'
                        }
                    },
                    required: ['html', 'css']
                }
            }
        }
    }

    // ====================================
    // DISABLED INTEGRATIONS (Require OAuth)
    // Uncomment these when OAuth is configured
    // ====================================

    /*
    send_email: { ... },
    read_emails: { ... },
    read_spreadsheet: { ... },
    write_spreadsheet: { ... },
    create_notion_page: { ... },
    query_notion_database: { ... },
    create_event: { ... },
    send_slack_message: { ... }
    */
};

/**
 * Get tool definitions for OpenAI function calling
 */
function getToolDefinitions(enabledTools = [], userIntegrations = []) {
    const definitions = [];

    for (const [toolName, toolConfig] of Object.entries(TOOL_REGISTRY)) {
        // If specific tools requested, filter
        if (enabledTools.length > 0 && !enabledTools.includes(toolName) && !enabledTools.includes('all')) {
            continue;
        }

        // Check if tool requires integration
        if (toolConfig.requiresIntegration) {
            const connectedTypes = userIntegrations.map(i => i.integration_type);
            const hasRequired = Array.isArray(toolConfig.requiresIntegration)
                ? toolConfig.requiresIntegration.some(t => connectedTypes.includes(t))
                : connectedTypes.includes(toolConfig.requiresIntegration);
            if (!hasRequired) continue;
        }

        definitions.push(toolConfig.definition);
    }

    return definitions;
}

/**
 * Execute a tool by name
 */
async function executeTool(toolName, args, context) {
    const toolConfig = TOOL_REGISTRY[toolName];

    if (!toolConfig) {
        throw new Error(`Unknown tool: ${toolName}`);
    }

    const handler = toolConfig.handler || 'execute';
    const module = toolConfig.module;

    if (!module || !module[handler]) {
        throw new Error(`Tool ${toolName} does not have handler ${handler}`);
    }

    return await module[handler](args, context);
}

/**
 * Get list of all available tools
 */
function getAllTools() {
    return Object.entries(TOOL_REGISTRY).map(([name, config]) => ({
        name,
        description: config.definition.function.description,
        requiresIntegration: config.requiresIntegration
    }));
}

module.exports = {
    TOOL_REGISTRY,
    getToolDefinitions,
    executeTool,
    getAllTools
};
