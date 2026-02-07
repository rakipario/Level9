import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, MessageSquare, Settings, BarChart3, LogOut,
  ChevronRight, Trash2, Copy,
  Send, Paperclip, Bot, User, Loader2,
  Slack, Database, Mail, FileSpreadsheet, Globe, Webhook,
  TrendingUp, Headphones, Megaphone, Search as SearchIcon,
  Menu, X
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type: string;
  category: string;
  status: 'active' | 'paused' | 'deleted';
  conversation_count: number;
  created_at: string;
  avatar_url?: string;
}

interface Integration {
  id: string;
  integration_type: string;
  name: string;
  status: 'connected' | 'disconnected';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  components?: any[];
}

const categoryIcons: Record<string, any> = {
  analytics: BarChart3,
  sales: TrendingUp,
  support: Headphones,
  marketing: Megaphone,
  operations: Settings,
  research: SearchIcon,
  general: Bot
};

const integrationIcons: Record<string, any> = {
  slack: Slack,
  salesforce: Database,
  gmail: Mail,
  google_sheets: FileSpreadsheet,
  notion: FileSpreadsheet,
  webhook: Webhook,
  default: Globe
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'agents' | 'chat' | 'integrations' | 'profile'>('chat');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ agents: 0, conversations: 0, integrations: 0, messages: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
    fetchAgents();
    fetchIntegrations();
    fetchStats();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_URL}/agents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(`${API_URL}/integrations`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/user/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId: null
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          components: data.components
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle error response
        const errorData = await response.json();
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${errorData.error || 'Something went wrong'}`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered a network error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const duplicateAgent = async (agentId: string) => {
    try {
      const response = await fetch(`${API_URL}/agents/${agentId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchAgents();
      }
    } catch (error) {
      console.error('Duplicate error:', error);
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      const response = await fetch(`${API_URL}/agents/${agentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchAgents();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const renderAgentsTab = () => (
    <div className="space-y-6 p-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-medium text-[var(--text)] mb-1">Your Agents</h2>
          <p className="text-[14px] text-[var(--text-secondary)]">
            Manage and deploy your AI agents
          </p>
        </div>
        <button
          onClick={() => navigate('/create-agent')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[var(--border)] rounded-[24px]">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mx-auto mb-4">
            <Bot className="h-8 w-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-[18px] font-medium text-[var(--text)] mb-2">No agents yet</h3>
          <p className="text-[14px] text-[var(--text-secondary)] mb-6">
            Create your first AI agent to get started
          </p>
          <button
            onClick={() => navigate('/create-agent')}
            className="btn-primary"
          >
            Create your first agent
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const CategoryIcon = categoryIcons[agent.category] || Bot;
            return (
              <div
                key={agent.id}
                className="bg-white border border-[var(--border)] rounded-[24px] p-6 hover:border-[var(--accent)] hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
                    <CategoryIcon className="h-6 w-6 text-[var(--accent)]" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => duplicateAgent(agent.id)}
                      className="p-2 hover:bg-[var(--bg-subtle)] rounded-full transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4 text-[var(--text-secondary)]" />
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="p-2 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <h3 className="text-[16px] font-medium text-[var(--text)] mb-1">{agent.name}</h3>
                <p className="text-[13px] text-[var(--text-secondary)] mb-4 line-clamp-2">
                  {agent.description || 'No description'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[12px] text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {agent.conversation_count}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full ${agent.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                      {agent.status}
                    </span>
                  </div>
                  <button className="flex items-center gap-1 text-[13px] text-[var(--accent)] hover:underline">
                    Open
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderChatTab = () => (
    <div className="flex flex-col h-full bg-white relative">
      {/* Chat Header - Absolute position or sticky */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 hover:bg-[var(--bg-subtle)] rounded-lg">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-[16px] font-medium text-[var(--text)]">Relay Assistant</h3>
            <p className="text-[12px] text-[var(--text-secondary)] flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Online
            </p>
          </div>
        </div>
        <button
          onClick={() => setMessages([])}
          className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
        >
          Clear chat
        </button>
      </div>

      {/* Messages Area - Flexible height */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-[var(--accent)]/20">
              <Bot className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-[24px] font-semibold text-[var(--text)] mb-3">How can I help you?</h3>
            <p className="text-[15px] text-[var(--text-secondary)] max-w-[460px] leading-relaxed mb-8">
              I can analyze data, generate reports, manage your agents, or answer questions about your integrations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[600px] w-full">
              {['Analyze my latest sales data', 'Create a new support agent', 'Draft an email to leads', 'Summarize recent tickets'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInputMessage(suggestion);
                    // Optional: auto-send
                  }}
                  className="p-4 text-left text-[14px] text-[var(--text)] bg-[var(--bg-subtle)] hover:bg-[var(--border)] rounded-xl transition-all border border-transparent hover:border-[var(--border)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`group flex gap-4 max-w-4xl mx-auto ${message.role === 'user' ? 'justify-end' : ''}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center shadow-md">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}

            <div className={`max-w-[80%] space-y-2 ${message.role === 'user' ? 'items-end flex flex-col' : ''}`}>
              <div className={`px-5 py-3.5 rounded-2xl shadow-sm ${message.role === 'user'
                  ? 'bg-[var(--text)] text-white rounded-tr-sm'
                  : 'bg-white border border-[var(--border)] text-[var(--text)] rounded-tl-sm'
                }`}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.role === 'assistant' && message.components && message.components.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.components.map((component: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-xl p-4 border border-[var(--border)] min-w-[200px] hover:shadow-md transition-shadow cursor-default">
                      {component.type === 'chart' && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[var(--bg-subtle)] rounded-lg">
                            <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium">Chart Generated</p>
                            <p className="text-[11px] text-[var(--text-secondary)]">Click to view</p>
                          </div>
                        </div>
                      )}
                      {component.type === 'table' && (
                        <div className="text-[13px] text-[var(--text-secondary)]">
                          Table: <span className="text-[var(--text)] font-medium">{component.title}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center border border-[var(--border)]">
                <User className="h-4 w-4 text-[var(--text-secondary)]" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white border border-[var(--border)] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
              <span className="text-[14px] text-[var(--text-secondary)]">Processing...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 pb-6 md:px-8 pt-2 bg-white">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-purple-600 rounded-[28px] opacity-0 group-focus-within:opacity-10 transition-opacity blur-xl"></div>
          <div className="relative bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[24px] shadow-sm flex items-end p-2 focus-within:ring-2 focus-within:ring-[var(--accent)]/10 focus-within:border-[var(--accent)] transition-all">
            <button className="p-3 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--border)] rounded-xl transition-colors">
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Message Relay..."
              className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-[200px] py-3 px-2 text-[15px] placeholder:text-[var(--text-tertiary)]"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading}
              className={`p-3 rounded-xl transition-all duration-200 ${inputMessage.trim() && !loading
                  ? 'bg-[var(--text)] text-white shadow-md hover:bg-black/90'
                  : 'bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed'
                }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-center text-[11px] text-[var(--text-tertiary)] mt-3">
            Relay can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsTab = () => (
    <div className="space-y-6 p-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-medium text-[var(--text)] mb-1">Integrations</h2>
          <p className="text-[14px] text-[var(--text-secondary)]">
            Connect your tools and services
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Integration
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => {
          const Icon = integrationIcons[integration.integration_type] || integrationIcons.default;
          return (
            <div
              key={integration.id}
              className="bg-white border border-[var(--border)] rounded-[24px] p-6 hover:border-[var(--accent)] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
                  <Icon className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${integration.status === 'connected'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600'
                  }`}>
                  {integration.status}
                </span>
              </div>

              <h3 className="text-[16px] font-medium text-[var(--text)] mb-1">{integration.name}</h3>
              <p className="text-[13px] text-[var(--text-secondary)] mb-4 capitalize">
                {integration.integration_type}
              </p>

              <div className="flex items-center gap-2">
                <button className="flex-1 py-2 text-[13px] font-medium text-[var(--text)] bg-[var(--bg-subtle)] rounded-full hover:bg-[var(--border)] transition-colors">
                  Configure
                </button>
                {integration.status === 'connected' && (
                  <button className="px-4 py-2 text-[13px] font-medium text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-colors">
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <button className="border-2 border-dashed border-[var(--border)] rounded-[24px] p-6 hover:border-[var(--accent)] hover:bg-[var(--bg-subtle)] transition-all duration-200 flex flex-col items-center justify-center text-center min-h-[200px]">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mb-3">
            <Plus className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <h3 className="text-[15px] font-medium text-[var(--text)] mb-1">Add Integration</h3>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Connect a new service
          </p>
        </button>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6 p-8 max-w-[800px] mx-auto">
      <div>
        <h2 className="text-[24px] font-medium text-[var(--text)] mb-1">Profile</h2>
        <p className="text-[14px] text-[var(--text-secondary)]">
          Manage your account settings
        </p>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-[24px] p-8 space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--accent)]/10">
            <span className="text-[32px] font-medium text-white">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div>
            <h3 className="text-[24px] font-medium text-[var(--text)]">
              {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-[15px] text-[var(--text-secondary)]">{user?.email}</p>
            <div className="mt-3 flex gap-2">
              <span className="px-3 py-1 bg-[var(--bg-subtle)] text-[12px] font-medium rounded-full border border-[var(--border)]">
                {user?.plan_type || 'Free Plan'}
              </span>
              <span className="px-3 py-1 bg-green-50 text-green-700 text-[12px] font-medium rounded-full border border-green-100">
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-[var(--border)]">
          <div className="p-4 bg-[var(--bg-subtle)] rounded-xl text-center">
            <p className="text-[24px] font-semibold text-[var(--text)]">{stats.agents}</p>
            <p className="text-[12px] text-[var(--text-secondary)] uppercase tracking-wide mt-1">Agents</p>
          </div>
          <div className="p-4 bg-[var(--bg-subtle)] rounded-xl text-center">
            <p className="text-[24px] font-semibold text-[var(--text)]">{stats.conversations}</p>
            <p className="text-[12px] text-[var(--text-secondary)] uppercase tracking-wide mt-1">Chats</p>
          </div>
          <div className="p-4 bg-[var(--bg-subtle)] rounded-xl text-center">
            <p className="text-[24px] font-semibold text-[var(--text)]">{stats.integrations}</p>
            <p className="text-[12px] text-[var(--text-secondary)] uppercase tracking-wide mt-1">Tools</p>
          </div>
          <div className="p-4 bg-[var(--bg-subtle)] rounded-xl text-center">
            <p className="text-[24px] font-semibold text-[var(--text)]">{stats.messages}</p>
            <p className="text-[12px] text-[var(--text-secondary)] uppercase tracking-wide mt-1">Msgs</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[var(--bg-subtle)] overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-20 w-[260px] bg-white border-r border-[var(--border)] transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <Link to="/" className="flex items-center gap-2 text-[20px] font-bold tracking-tight text-[var(--text)]">
              <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              Relay
            </Link>
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${activeTab === 'chat'
                ? 'bg-[var(--bg-subtle)] text-[var(--text)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
                }`}
            >
              <MessageSquare className="h-5 w-5" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${activeTab === 'agents'
                ? 'bg-[var(--bg-subtle)] text-[var(--text)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
                }`}
            >
              <Bot className="h-5 w-5" />
              Agents
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${activeTab === 'integrations'
                ? 'bg-[var(--bg-subtle)] text-[var(--text)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
                }`}
            >
              <Globe className="h-5 w-5" />
              Integrations
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${activeTab === 'profile'
                ? 'bg-[var(--bg-subtle)] text-[var(--text)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
                }`}
            >
              <User className="h-5 w-5" />
              Profile
            </button>
          </nav>

          <div className="p-4 border-t border-[var(--border)]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header Overlay */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden absolute top-4 left-4 z-10 p-2 bg-white rounded-lg shadow-sm border border-[var(--border)]"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Content Area */}
        {activeTab === 'agents' && <div className="flex-1 overflow-y-auto">{renderAgentsTab()}</div>}
        {activeTab === 'chat' && renderChatTab()}
        {activeTab === 'integrations' && <div className="flex-1 overflow-y-auto">{renderIntegrationsTab()}</div>}
        {activeTab === 'profile' && <div className="flex-1 overflow-y-auto">{renderProfileTab()}</div>}
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
