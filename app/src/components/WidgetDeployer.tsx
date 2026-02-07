import React, { useState, useEffect } from 'react';
import { Code, Copy, Check, Settings, Palette, Globe, Eye, Trash2, Plus, AlertCircle } from 'lucide-react';

interface Widget {
    id: string;
    agent_id: string;
    agent_name: string;
    config: WidgetConfig;
    status: string;
    created_at: string;
}

interface WidgetConfig {
    position?: string;
    theme?: string;
    primaryColor?: string;
    title?: string;
    subtitle?: string;
    placeholder?: string;
    greeting?: string;
}

interface Agent {
    id: string;
    name: string;
}

interface WidgetDeployerProps {
    onClose?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function WidgetDeployer({ onClose }: WidgetDeployerProps) {
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Create form state
    const [selectedAgent, setSelectedAgent] = useState('');
    const [config, setConfig] = useState<WidgetConfig>({
        position: 'bottom-right',
        theme: 'light',
        primaryColor: '#000000',
        title: '',
        subtitle: '',
        placeholder: 'Type your message...',
        greeting: 'Hi! How can I help you today?'
    });
    const [allowedDomains, setAllowedDomains] = useState('*');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadWidgets();
        loadAgents();
    }, []);

    const loadWidgets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/widget/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setWidgets(data.widgets || []);
        } catch (err) {
            setError('Failed to load widgets');
        } finally {
            setLoading(false);
        }
    };

    const loadAgents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/agents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setAgents(data || []);
        } catch (err) {
            console.error('Failed to load agents');
        }
    };

    const createWidget = async () => {
        if (!selectedAgent) {
            setError('Please select an agent');
            return;
        }

        setCreating(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/widget/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    agentId: selectedAgent,
                    config,
                    allowedDomains: allowedDomains.split(',').map(d => d.trim()).filter(Boolean)
                })
            });

            const data = await response.json();

            if (response.ok) {
                await loadWidgets();
                setShowCreate(false);
                setSelectedAgent('');
            } else {
                setError(data.error || 'Failed to create widget');
            }
        } catch (err) {
            setError('Failed to create widget');
        } finally {
            setCreating(false);
        }
    };

    const deleteWidget = async (widgetId: string) => {
        if (!confirm('Are you sure you want to delete this widget?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/widget/${widgetId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            await loadWidgets();
        } catch (err) {
            setError('Failed to delete widget');
        }
    };

    const copyEmbedCode = (widgetId: string) => {
        const code = `<script src="${API_URL.replace('/api', '')}/api/widget/${widgetId}/embed.js" async></script>`;
        navigator.clipboard.writeText(code);
        setCopied(widgetId);
        setTimeout(() => setCopied(null), 2000);
    };

    const getEmbedCode = (widgetId: string) => {
        return `<script src="${API_URL.replace('/api', '')}/api/widget/${widgetId}/embed.js" async></script>`;
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Code className="w-7 h-7" />
                            Widget Deployer
                        </h2>
                        <p className="text-gray-500 mt-1">
                            Create embeddable chat widgets for your websites
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-4 py-2 font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Widget
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 dark:text-red-300">{error}</span>
                </div>
            )}

            {/* Widget List */}
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full" />
                    </div>
                ) : widgets.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Code className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">No widgets yet</h3>
                        <p className="text-gray-500 mt-1">Create your first widget to embed on any website</p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="mt-4 px-4 py-2 font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Create Widget
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {widgets.map((widget) => (
                            <div
                                key={widget.id}
                                className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {widget.config.title || widget.agent_name || 'Chat Widget'}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Agent: {widget.agent_name}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Palette className="w-4 h-4" />
                                                {widget.config.theme || 'light'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Globe className="w-4 h-4" />
                                                {widget.config.position || 'bottom-right'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${widget.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {widget.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => copyEmbedCode(widget.id)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                            title="Copy embed code"
                                        >
                                            {copied === widget.id ? (
                                                <Check className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <Copy className="w-5 h-5 text-gray-500" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteWidget(widget.id)}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete widget"
                                        >
                                            <Trash2 className="w-5 h-5 text-red-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Embed Code */}
                                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-gray-500 uppercase font-medium">Embed Code</span>
                                    </div>
                                    <code className="text-sm text-gray-700 dark:text-gray-300 break-all">
                                        {getEmbedCode(widget.id)}
                                    </code>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Widget Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Create New Widget
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Agent Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Agent
                                </label>
                                <select
                                    value={selectedAgent}
                                    onChange={(e) => setSelectedAgent(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                >
                                    <option value="">Choose an agent...</option>
                                    {agents.map((agent) => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Theme */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Theme
                                </label>
                                <div className="flex gap-2">
                                    {['light', 'dark'].map((theme) => (
                                        <button
                                            key={theme}
                                            onClick={() => setConfig({ ...config, theme })}
                                            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${config.theme === theme
                                                    ? 'border-black dark:border-white bg-gray-100 dark:bg-gray-800'
                                                    : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                        >
                                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Position */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Position
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['bottom-right', 'bottom-left', 'top-right', 'top-left'].map((pos) => (
                                        <button
                                            key={pos}
                                            onClick={() => setConfig({ ...config, position: pos })}
                                            className={`py-2 px-4 rounded-lg border-2 text-sm transition-all ${config.position === pos
                                                    ? 'border-black dark:border-white bg-gray-100 dark:bg-gray-800'
                                                    : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                        >
                                            {pos.replace('-', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Primary Color */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Primary Color
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={config.primaryColor}
                                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                        className="w-12 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={config.primaryColor}
                                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                        className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Widget Title
                                </label>
                                <input
                                    type="text"
                                    value={config.title}
                                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                                    placeholder="Chat with us"
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                />
                            </div>

                            {/* Greeting */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Welcome Message
                                </label>
                                <textarea
                                    value={config.greeting}
                                    onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 resize-none"
                                />
                            </div>

                            {/* Allowed Domains */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Allowed Domains
                                </label>
                                <input
                                    type="text"
                                    value={allowedDomains}
                                    onChange={(e) => setAllowedDomains(e.target.value)}
                                    placeholder="*, example.com, app.example.com"
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use * to allow all domains, or comma-separated list
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 py-2 px-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createWidget}
                                disabled={creating || !selectedAgent}
                                className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create Widget'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
