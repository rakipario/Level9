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
        const basePrompt = this.agentConfig.systemPrompt || `You are ${this.agentConfig.name || 'Relay'}, a helpful AI assistant.`;

        const toolInstructions = `
IMPORTANT: You MUST use the available tools to help users. Do not say you cannot do something if a tool exists for it.

When a user uploads a file, you will see: "filename (file ID: xxx)"
YOU MUST call the read_file tool with that file ID to read the file contents.

Available tools:
- read_file: Read uploaded files (PDF, CSV, Excel, etc.)
- execute_code: Run Python or JavaScript code
- web_search: Search the internet
- analyze_data: Analyze data from files

RULES:
1. If user asks about a file, IMMEDIATELY call read_file with the file ID
2. If user asks for calculations, call execute_code
3. If user asks for current info, call web_search
4. NEVER say "I don't have access" - use the tools!
5. After using a tool, explain the results
`;

        return basePrompt + toolInstructions;
    }

    /**
     * Get available tools based on agent config and integrations
     */
    getAvailableTools() {
        const enabledTools = this.agentConfig.tools || ['execute_code', 'analyze_data', 'read_file', 'web_search', 'fetch_url', 'list_uploaded_files', 'transcribe_audio'];
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
    async *runStreaming(conversationHistory, userMessage, userId, context = {}) {
        this.context = context;
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
