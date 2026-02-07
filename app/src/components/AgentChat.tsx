import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Code, FileText, Mail, Search, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    executionLog?: ExecutionStep[];
    timestamp: Date;
}

interface ExecutionStep {
    iteration: number;
    toolCalls?: string[];
    results?: { tool: string; success: boolean }[];
    error?: string;
}

interface AgentChatProps {
    agentId?: string;
    agentName?: string;
    conversationId?: string;
    onConversationChange?: (id: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TOOL_ICONS: { [key: string]: React.ReactNode } = {
    execute_code: <Code className="w-4 h-4" />,
    analyze_data: <FileText className="w-4 h-4" />,
    read_file: <FileText className="w-4 h-4" />,
    send_email: <Mail className="w-4 h-4" />,
    web_search: <Search className="w-4 h-4" />,
    fetch_url: <Search className="w-4 h-4" />
};

export default function AgentChat({ agentId, agentName, conversationId, onConversationChange }: AgentChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const [currentStreamContent, setCurrentStreamContent] = useState('');
    const [executingTools, setExecutingTools] = useState<string[]>([]);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentConvId = useRef<string | undefined>(conversationId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentStreamContent]);

    useEffect(() => {
        if (conversationId) {
            loadConversation(conversationId);
        }
    }, [conversationId]);

    const loadConversation = async (convId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/ai/conversations/${convId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.messages) {
                setMessages(data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    executionLog: m.metadata?.executionLog,
                    timestamp: new Date(m.created_at)
                })));
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            // Use streaming endpoint if available
            const useStreaming = true; // Can be made configurable

            if (useStreaming) {
                await streamResponse(userMessage.content, token!);
            } else {
                await regularResponse(userMessage.content, token!);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
            setStreaming(false);
            setCurrentStreamContent('');
            setExecutingTools([]);
        }
    };

    const streamResponse = async (message: string, token: string) => {
        setStreaming(true);

        const response = await fetch(`${API_URL}/ai/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                message,
                conversationId: currentConvId.current,
                agentId
            })
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let fullContent = '';
        const executionLog: ExecutionStep[] = [];
        let iterationCount = 0;

        while (reader) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
                try {
                    const data = JSON.parse(line.slice(6));

                    switch (data.type) {
                        case 'content':
                            fullContent += data.content;
                            setCurrentStreamContent(fullContent);
                            break;

                        case 'tool_start':
                            iterationCount++;
                            setExecutingTools(data.tools);
                            executionLog.push({
                                iteration: iterationCount,
                                toolCalls: data.tools
                            });
                            break;

                        case 'tool_result':
                            setExecutingTools([]);
                            const lastLog = executionLog[executionLog.length - 1];
                            if (lastLog) {
                                lastLog.results = lastLog.results || [];
                                lastLog.results.push({
                                    tool: data.tool,
                                    success: true
                                });
                            }
                            break;

                        case 'complete':
                            fullContent = data.response;
                            break;

                        case 'done':
                            if (data.conversationId) {
                                currentConvId.current = data.conversationId;
                                onConversationChange?.(data.conversationId);
                            }
                            break;

                        case 'error':
                            fullContent = `Error: ${data.error}`;
                            break;
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }

        setMessages(prev => [...prev, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            executionLog: executionLog.length > 0 ? executionLog : undefined,
            timestamp: new Date()
        }]);
    };

    const regularResponse = async (message: string, token: string) => {
        const response = await fetch(`${API_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                message,
                conversationId: currentConvId.current,
                agentId
            })
        });

        const data = await response.json();

        if (data.conversationId) {
            currentConvId.current = data.conversationId;
            onConversationChange?.(data.conversationId);
        }

        setMessages(prev => [...prev, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.response,
            executionLog: data.executionLog,
            timestamp: new Date()
        }]);
    };

    const toggleLogExpansion = (messageId: string) => {
        setExpandedLogs(prev => {
            const next = new Set(prev);
            if (next.has(messageId)) {
                next.delete(messageId);
            } else {
                next.add(messageId);
            }
            return next;
        });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            {agentName || 'AI Assistant'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {streaming ? 'Thinking...' : executingTools.length > 0 ? `Executing: ${executingTools.join(', ')}` : 'Ready to help'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Start a Conversation</h3>
                        <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                            Ask me to analyze data, send emails, search the web, or help with any task.
                        </p>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user'
                                ? 'bg-gradient-to-br from-gray-700 to-gray-900'
                                : 'bg-gradient-to-br from-blue-500 to-purple-500'
                            }`}>
                            {message.role === 'user' ? (
                                <User className="w-4 h-4 text-white" />
                            ) : (
                                <Bot className="w-4 h-4 text-white" />
                            )}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                            <div
                                className={`inline-block px-4 py-3 rounded-2xl ${message.role === 'user'
                                        ? 'bg-black text-white rounded-tr-md'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-md'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap text-left">{message.content}</p>
                            </div>

                            {/* Execution Log */}
                            {message.executionLog && message.executionLog.length > 0 && (
                                <div className="mt-2">
                                    <button
                                        onClick={() => toggleLogExpansion(message.id)}
                                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        <Zap className="w-4 h-4" />
                                        {message.executionLog.length} action{message.executionLog.length > 1 ? 's' : ''} executed
                                        {expandedLogs.has(message.id) ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>

                                    {expandedLogs.has(message.id) && (
                                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-left text-sm space-y-2">
                                            {message.executionLog.map((step, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <span className="text-gray-400">Step {step.iteration}</span>
                                                    <div className="flex gap-1">
                                                        {step.toolCalls?.map((tool, j) => (
                                                            <span
                                                                key={j}
                                                                className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full flex items-center gap-1"
                                                            >
                                                                {TOOL_ICONS[tool] || <Zap className="w-3 h-3" />}
                                                                {tool}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {step.results && (
                                                        <span className="text-green-500">✓</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-xs text-gray-400 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Streaming indicator */}
                {streaming && currentStreamContent && (
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 max-w-[80%]">
                            <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                                <p className="whitespace-pre-wrap">{currentStreamContent}</p>
                                <span className="inline-block w-1 h-4 bg-blue-500 animate-pulse ml-1" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Tool execution indicator */}
                {executingTools.length > 0 && (
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                                <Zap className="w-4 h-4" />
                                Executing: {executingTools.join(', ')}
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask me anything..."
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
