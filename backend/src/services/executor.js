/**
 * Agent Executor Service
 * 
 * The core of the agentic system - orchestrates tool calls, manages state,
 * and executes multi-step actions autonomously.
 */

const OpenAI = require('openai');
const { query } = require('../utils/db');
const { getToolDefinitions, executeTool } = require('../tools');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class AgentExecutor {
    constructor(agentConfig, userIntegrations = []) {
        this.agentConfig = agentConfig;
        this.userIntegrations = userIntegrations;
        this.maxIterations = 10;
        this.state = {};
        this.executionLog = [];
    }

    /**
     * Build the system prompt for this agent
     */
    buildSystemPrompt() {
        const basePrompt = this.agentConfig.systemPrompt || `You are ${this.agentConfig.name || 'Relay'}, an intelligent AI assistant.`;

        const integrationContext = this.userIntegrations.length > 0
            ? `\n\nYou have access to the following connected integrations:\n${this.userIntegrations.map(i => `- ${i.name} (${i.integration_type})`).join('\n')}`
            : '';

        const capabilityContext = `
You can:
1. Execute code (Python, JavaScript) to analyze data, create visualizations, and perform calculations
2. Read and write files (CSV, Excel, PDF, text)
3. Send emails and messages through connected integrations
4. Access and modify spreadsheets and databases
5. Create documents and notes
6. Schedule tasks and reminders
7. Search the web and fetch information

When you need to perform an action, use the appropriate tool. Always explain what you're doing.
If a task requires multiple steps, execute them one at a time and report progress.

IMPORTANT: When reading files, use the exact file_id (UUID) provided in the message, not the original filename.
When a user uploads a file, the file_id is provided in the format "filename (file_id: xxx)". Use that xxx UUID when calling read_file.

IMPORTANT: When generating code for data analysis:
- Always use proper error handling
- Return results in a format that can be displayed to the user
- For charts/visualizations, generate the code and describe what it would show
`;

        return basePrompt + integrationContext + capabilityContext;
    }

    /**
     * Get available tools based on agent config and integrations
     */
    getAvailableTools() {
        const enabledTools = this.agentConfig.tools || ['code_executor', 'file_processor', 'web_search'];
        return getToolDefinitions(enabledTools, this.userIntegrations);
    }

    /**
     * Main execution loop - runs until complete or max iterations
     */
    async run(conversationHistory, userMessage, userId, context = {}) {
        this.context = context; // Store context for tool access
        const systemPrompt = this.buildSystemPrompt();
        const tools = this.getAvailableTools();

        // Prepare messages
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMessage }
        ];

        let iteration = 0;
        let finalResponse = null;

        while (iteration < this.maxIterations) {
            iteration++;

            try {
                // Call OpenAI with function calling
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4-turbo-preview',
                    messages,
                    tools: tools.length > 0 ? tools : undefined,
                    tool_choice: tools.length > 0 ? 'auto' : undefined,
                    temperature: 0.7,
                    max_tokens: 4000
                });

                const assistantMessage = completion.choices[0].message;
                messages.push(assistantMessage);

                // Check if we have tool calls
                if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                    // Execute each tool call
                    const toolResults = await this.executeToolCalls(assistantMessage.tool_calls, userId);

                    // Add tool results to messages
                    for (const result of toolResults) {
                        messages.push({
                            role: 'tool',
                            tool_call_id: result.tool_call_id,
                            content: JSON.stringify(result.output)
                        });
                    }

                    // Log execution
                    this.executionLog.push({
                        iteration,
                        toolCalls: assistantMessage.tool_calls.map(tc => tc.function.name),
                        results: toolResults.map(r => ({ tool: r.tool, success: r.success }))
                    });
                } else {
                    // No tool calls - we have a final response
                    finalResponse = assistantMessage.content;
                    break;
                }
            } catch (error) {
                console.error('Executor error:', error);
                this.executionLog.push({
                    iteration,
                    error: error.message
                });

                // Return error message
                finalResponse = `I encountered an error while processing your request: ${error.message}. Please try again.`;
                break;
            }
        }

        if (!finalResponse) {
            finalResponse = 'I completed the requested actions but exceeded the maximum number of steps. Here\'s what I accomplished:\n\n' +
                this.executionLog.map(log =>
                    log.toolCalls ? `- Executed: ${log.toolCalls.join(', ')}` : `- Error: ${log.error}`
                ).join('\n');
        }

        return {
            response: finalResponse,
            executionLog: this.executionLog,
            state: this.state,
            tokensUsed: messages.reduce((acc, m) => acc + (m.content?.length || 0), 0)
        };
    }

    /**
     * Execute tool calls in parallel where possible
     */
    async executeToolCalls(toolCalls, userId) {
        const results = [];

        for (const toolCall of toolCalls) {
            const { name, arguments: argsString } = toolCall.function;

            try {
                const args = JSON.parse(argsString);

                // Execute the tool
                const output = await executeTool(name, args, {
                    userId,
                    integrations: this.userIntegrations,
                    state: this.state,
                    context: this.context
                });

                // Update state if tool returns state updates
                if (output.stateUpdates) {
                    this.state = { ...this.state, ...output.stateUpdates };
                }

                results.push({
                    tool_call_id: toolCall.id,
                    tool: name,
                    success: true,
                    output: output.result || output
                });
            } catch (error) {
                console.error(`Tool ${name} error:`, error);
                results.push({
                    tool_call_id: toolCall.id,
                    tool: name,
                    success: false,
                    output: { error: error.message }
                });
            }
        }

        return results;
    }

    /**
     * Stream execution for real-time updates
     */
    async *runStreaming(conversationHistory, userMessage, userId) {
        const systemPrompt = this.buildSystemPrompt();
        const tools = this.getAvailableTools();

        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMessage }
        ];

        let iteration = 0;

        while (iteration < this.maxIterations) {
            iteration++;

            try {
                const stream = await openai.chat.completions.create({
                    model: 'gpt-4-turbo-preview',
                    messages,
                    tools: tools.length > 0 ? tools : undefined,
                    tool_choice: tools.length > 0 ? 'auto' : undefined,
                    stream: true,
                    temperature: 0.7,
                    max_tokens: 4000
                });

                let assistantMessage = { role: 'assistant', content: '', tool_calls: [] };
                let currentToolCall = null;

                for await (const chunk of stream) {
                    const delta = chunk.choices[0]?.delta;

                    if (delta?.content) {
                        assistantMessage.content += delta.content;
                        yield { type: 'content', content: delta.content };
                    }

                    if (delta?.tool_calls) {
                        for (const tc of delta.tool_calls) {
                            if (tc.index !== undefined) {
                                if (!assistantMessage.tool_calls[tc.index]) {
                                    assistantMessage.tool_calls[tc.index] = {
                                        id: tc.id,
                                        type: 'function',
                                        function: { name: '', arguments: '' }
                                    };
                                }
                                if (tc.function?.name) {
                                    assistantMessage.tool_calls[tc.index].function.name = tc.function.name;
                                }
                                if (tc.function?.arguments) {
                                    assistantMessage.tool_calls[tc.index].function.arguments += tc.function.arguments;
                                }
                            }
                        }
                    }
                }

                messages.push(assistantMessage);

                if (assistantMessage.tool_calls.length > 0) {
                    yield { type: 'tool_start', tools: assistantMessage.tool_calls.map(tc => tc.function.name) };

                    const toolResults = await this.executeToolCalls(assistantMessage.tool_calls, userId);

                    for (const result of toolResults) {
                        messages.push({
                            role: 'tool',
                            tool_call_id: result.tool_call_id,
                            content: JSON.stringify(result.output)
                        });
                        yield { type: 'tool_result', tool: result.tool, result: result.output };
                    }
                } else {
                    yield { type: 'complete', response: assistantMessage.content };
                    return;
                }
            } catch (error) {
                yield { type: 'error', error: error.message };
                return;
            }
        }

        yield { type: 'max_iterations', log: this.executionLog };
    }
}

module.exports = { AgentExecutor };
