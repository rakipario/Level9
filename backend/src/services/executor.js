/**
 * Agent Executor Service
 * 
 * The core of the agentic system - orchestrates tool calls, manages state,
 * and executes multi-step actions autonomously.
 */

const OpenAI = require('openai');
const { query } = require('../utils/db');
const { getToolDefinitions, executeTool, getAllTools } = require('../tools');

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
        const basePrompt = this.agentConfig.systemPrompt || `You are ${this.agentConfig.name || 'Relay'}, a powerful and proactive AI agent. Your mission is to help users by using your tools effectively.`;

        const tools = this.getAllAvailableToolsInfo();
        const toolList = tools.map(t => `- ${t.name}: ${t.description}`).join('\n');

        const toolInstructions = `
### YOUR CAPABILITIES
You have access to a sophisticated suite of tools. DO NOT state you cannot perform a task if an appropriate tool exists.

**AVAILABLE TOOLS:**
${toolList}

### AGENTIC PRINCIPLES
1. **Prefer Action Over Refusal**: If a user asks for something complex (like file conversion or website creation), use your tools immediately. 
2. **File Conversion**: If asked to convert a file format (e.g., PDF to DOCX, CSV to JSON):
   - Use 'read_file' to get the content.
   - Use 'execute_code' (Python) to generate the new file format if no direct tool exists.
3. **Website Creation**: Use 'generate_website' for ANY request to build, create, or design a website. Return the live URL to the user.
4. **Visual Data**: For any images or charts, ALWAYS use 'analyze_image'.
5. **No Placeholders**: Never say "I can provide the code for you to run". RUN THE CODE YOURSELF using 'execute_code'.

### LOGISTICS
- When users upload files, you see: "file_name (file ID: uuid)"
- Access files using their UUIDs specifically.
- After using a tool, synthesize the results and explain what you did.
`;

        return basePrompt + toolInstructions;
    }

    /**
     * Helper to get simple names and descriptions for prompt
     */
    getAllAvailableToolsInfo() {
        const enabledTools = this.agentConfig.tools || ['execute_code', 'analyze_data', 'read_file', 'web_search', 'fetch_url', 'list_uploaded_files', 'transcribe_audio', 'analyze_image', 'generate_website', 'convert_file'];
        const allTools = getAllTools();
        return allTools.filter(t => enabledTools.includes(t.name) || enabledTools.includes('all'));
    }

    /**
     * Get available tools based on agent config and integrations
     */
    getAvailableTools() {
        const enabledTools = this.agentConfig.tools || ['execute_code', 'analyze_data', 'read_file', 'web_search', 'fetch_url', 'list_uploaded_files', 'transcribe_audio', 'analyze_image', 'generate_website', 'convert_file'];
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
