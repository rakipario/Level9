import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, ExternalLink, AlertCircle, X } from 'lucide-react';

interface Provider {
    id: string;
    name: string;
    description: string;
    services: string[];
    icon: string;
}

interface ConnectionStatus {
    [key: string]: {
        connected: boolean;
        lastUpdated?: string;
    };
}

interface IntegrationWizardProps {
    onClose: () => void;
    onComplete: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PROVIDER_ICONS: { [key: string]: React.ReactNode } = {
    google: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    ),
    microsoft: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
            <path fill="#f25022" d="M1 1h10v10H1z" />
            <path fill="#00a4ef" d="M1 13h10v10H1z" />
            <path fill="#7fba00" d="M13 1h10v10H13z" />
            <path fill="#ffb900" d="M13 13h10v10H13z" />
        </svg>
    ),
    notion: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
            <path fill="currentColor" d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 2.02c-.42-.28-.98-.606-2.052-.513l-12.8 1.026c-.466.046-.56.28-.374.466l2.02 1.513zM5.26 7.26v13.03c0 .7.373.373.373-.047v12.823c-.047.372.233.746.794.7l13.915-.84c.56-.047.653-.373.653-.746V7.26c0-.373-.187-.56-.467-.514l-14.501.84c-.326.047-.467.233-.467.56zm12.563 1.866c0 .373-.373.467-.373.467l-.7.14v12.17c-.607.327-1.167.514-1.633.514-.747 0-.935-.234-1.495-.935l-4.577-7.186v6.952l1.447.327s0 .466-.653.466l-1.8.107c-.047-.093 0-.326.163-.373l.42-.14V10.12l-.58-.047s0-.42.467-.467l1.94-.14 4.763 7.28v-6.44l-1.213-.14s0-.467.514-.513l2.033-.14zM3.96 2.66l13.356-1c1.26-.14 1.587 0 2.1.373l3.4 2.38c.56.42.747.56.747.887v14.97c0 .933-.373 1.493-1.68 1.586l-14.828.887c-.98.046-1.447-.093-1.96-.7L1.68 18.6c-.56-.7-.793-1.213-.793-1.82V4.34c0-.793.373-1.446 1.493-1.586z" />
        </svg>
    ),
    slack: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
            <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
            <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" />
            <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" />
            <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
        </svg>
    )
};

export default function IntegrationWizard({ onClose, onComplete }: IntegrationWizardProps) {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProviders();
        loadConnectionStatus();

        // Check URL for OAuth callback results
        const params = new URLSearchParams(window.location.search);
        const oauthResult = params.get('oauth');
        if (oauthResult === 'success') {
            loadConnectionStatus();
            window.history.replaceState({}, '', window.location.pathname);
        } else if (oauthResult === 'error') {
            setError(params.get('message') || 'OAuth connection failed');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const loadProviders = async () => {
        try {
            const response = await fetch(`${API_URL}/oauth/providers`);
            const data = await response.json();
            setProviders(data.providers);
        } catch (err) {
            setError('Failed to load providers');
        }
    };

    const loadConnectionStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/oauth/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setConnectionStatus(data.status || {});
        } catch (err) {
            console.error('Failed to load connection status');
        } finally {
            setLoading(false);
        }
    };

    const connectProvider = async (providerId: string) => {
        setConnecting(providerId);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/oauth/connect/${providerId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.authUrl) {
                // Redirect to OAuth authorization
                window.location.href = data.authUrl;
            } else {
                setError('Failed to get authorization URL');
                setConnecting(null);
            }
        } catch (err) {
            setError('Failed to initiate connection');
            setConnecting(null);
        }
    };

    const disconnectProvider = async (providerId: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/oauth/disconnect/${providerId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            await loadConnectionStatus();
        } catch (err) {
            setError('Failed to disconnect');
        }
    };

    const connectedCount = Object.values(connectionStatus).filter(s => s.connected).length;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Connect Your Apps
                            </h2>
                            <p className="text-gray-500 mt-1">
                                Enable your agents to work with your favorite tools
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress */}
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${(connectedCount / Math.max(providers.length, 1)) * 100}%` }}
                            />
                        </div>
                        <span className="text-sm text-gray-500">
                            {connectedCount}/{providers.length} connected
                        </span>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-300">{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded"
                        >
                            <X className="w-4 h-4 text-red-500" />
                        </button>
                    </div>
                )}

                {/* Provider List */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {providers.map((provider) => {
                                const isConnected = connectionStatus[provider.id]?.connected;
                                const isConnecting = connecting === provider.id;

                                return (
                                    <div
                                        key={provider.id}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${isConnected
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                {PROVIDER_ICONS[provider.icon] || (
                                                    <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {provider.name}
                                                    </h3>
                                                    {isConnected && (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {provider.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {provider.services.map((service) => (
                                                        <span
                                                            key={service}
                                                            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full"
                                                        >
                                                            {service}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="flex-shrink-0">
                                                {isConnected ? (
                                                    <button
                                                        onClick={() => disconnectProvider(provider.id)}
                                                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        Disconnect
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => connectProvider(provider.id)}
                                                        disabled={isConnecting}
                                                        className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                                    >
                                                        {isConnecting ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Connecting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Connect
                                                                <ExternalLink className="w-4 h-4" />
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Your data stays secure with enterprise-grade OAuth 2.0
                        </p>
                        <button
                            onClick={onComplete}
                            className="px-6 py-2 font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all"
                        >
                            {connectedCount > 0 ? 'Continue' : 'Skip for now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
