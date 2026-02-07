import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowLeft, Check, ChevronRight, BarChart3, TrendingUp, Headphones, Megaphone, Settings, Search, Sparkles, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CATEGORIES = [
    { id: 'analytics', name: 'Analytics', icon: BarChart3, description: 'Data analysis and visualization' },
    { id: 'sales', name: 'Sales', icon: TrendingUp, description: 'Lead, CRM, and pipeline management' },
    { id: 'support', name: 'Support', icon: Headphones, description: 'Customer service and ticket handling' },
    { id: 'marketing', name: 'Marketing', icon: Megaphone, description: 'Content, ad, and campaign automation' },
    { id: 'operations', name: 'Operations', icon: Settings, description: 'Workflow efficiency and automation' },
    { id: 'research', name: 'Research', icon: Search, description: 'Market intelligence and monitoring' },
    { id: 'general', name: 'General', icon: Bot, description: 'General purpose assistant' }
];

export default function CreateAgentPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        agentType: 'assistant', // distinct from category
        instructions: ''
    });

    const handleCreate = async () => {
        if (!formData.name || !formData.category) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/agents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    category: formData.category,
                    agentType: 'assistant',
                    configuration: {
                        instructions: formData.instructions || `You are an AI assistant specialized in ${formData.category}.`
                    }
                })
            });

            if (response.ok) {
                navigate('/dashboard');
            } else {
                console.error('Failed to create agent');
            }
        } catch (error) {
            console.error('Error creating agent:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-subtle)] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-[var(--border)] px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </button>
                    <div className="flex items-center gap-1 text-[13px] font-medium text-[var(--text-tertiary)]">
                        <span className={step >= 1 ? 'text-[var(--accent)]' : ''}>1. Category</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className={step >= 2 ? 'text-[var(--accent)]' : ''}>2. Details</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className={step >= 3 ? 'text-[var(--accent)]' : ''}>3. Review</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-3xl w-full mx-auto p-6">
                <div className="bg-white rounded-[24px] border border-[var(--border)] p-8 shadow-sm">

                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-semibold mb-2">Choose an Agent Type</h1>
                                <p className="text-[var(--text-secondary)]">Select the primary capability for your new agent</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setFormData({ ...formData, category: cat.id });
                                            setStep(2);
                                        }}
                                        className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${formData.category === cat.id
                                                ? 'border-[var(--accent)] bg-[var(--accent-light)]/10 ring-1 ring-[var(--accent)]'
                                                : 'border-transparent bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle)]/80 hover:border-[var(--border)]'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${formData.category === cat.id ? 'bg-[var(--accent)] text-white' : 'bg-white text-[var(--text-secondary)]'
                                            }`}>
                                            <cat.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--text)]">{cat.name}</h3>
                                            <p className="text-[13px] text-[var(--text-secondary)] mt-1">{cat.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-semibold mb-2">Agent Details</h1>
                                <p className="text-[var(--text-secondary)]">Give your {formData.category} agent a personality</p>
                            </div>

                            <div className="space-y-4 max-w-md mx-auto">
                                <div>
                                    <label className="block text-[13px] font-medium text-[var(--text)] mb-1.5">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. Sales Assistant"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-medium text-[var(--text)] mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all"
                                        placeholder="Briefly describe what this agent does..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-medium text-[var(--text)] mb-1.5">
                                        Instructions <span className="text-[var(--text-tertiary)]">(Optional)</span>
                                    </label>
                                    <textarea
                                        value={formData.instructions}
                                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all min-h-[120px] resize-none"
                                        placeholder="Give specific instructions on how the agent should behave..."
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-2.5 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--bg-subtle)] transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => formData.name && setStep(3)}
                                        disabled={!formData.name}
                                        className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-semibold mb-2">Review & Create</h1>
                                <p className="text-[var(--text-secondary)]">Ready to launch your new agent?</p>
                            </div>

                            <div className="max-w-md mx-auto bg-[var(--bg-subtle)] rounded-2xl p-6 border border-[var(--border)]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-12 w-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white">
                                        <Bot className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{formData.name}</h3>
                                        <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                                            <span className="capitalize">{formData.category} Agent</span>
                                            <span>•</span>
                                            <span>Assistant</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-bold">Description</label>
                                        <p className="text-[14px] text-[var(--text)] mt-1">{formData.description || 'No description provided'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-bold">Model</label>
                                        <p className="text-[14px] text-[var(--text)] mt-1 font-mono">GPT-4o (Default)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="max-w-md mx-auto pt-4 flex gap-3">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--bg-subtle)] transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={loading}
                                    className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        'Creating...' // Simple loading text
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            Create Agent
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
