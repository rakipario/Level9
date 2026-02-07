import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, MessageSquare, Settings, BarChart3, LogOut,
  ChevronRight, Trash2, Copy,
  Send, Paperclip, Bot, User, Loader2,
  Slack, Database, Mail, FileSpreadsheet, Globe, Webhook,
  TrendingUp, Headphones, Megaphone, Search as SearchIcon
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
  const [activeTab, setActiveTab] = useState<'agents' | 'chat' | 'integrations' | 'profile'>('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ agents: 0, conversations: 0, integrations: 0, messages: 0 });
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
      }
    } catch (error) {
      console.error('Chat error:', error);
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
    <div className="space-y-6">
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
        <div className="text-center py-16 bg-[var(--bg-subtle)] rounded-[32px]">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
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
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white border border-[var(--border)] rounded-[32px] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div>
          <h3 className="text-[15px] font-medium text-[var(--text)]">Relay Assistant</h3>
          <p className="text-[12px] text-[var(--text-secondary)]">Always here to help</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-[var(--accent)]" />
            </div>
            <h3 className="text-[18px] font-medium text-[var(--text)] mb-2">Start a conversation</h3>
            <p className="text-[14px] text-[var(--text-secondary)] max-w-[400px] mx-auto">
              Ask me anything about your data, create reports, or get insights from your agents.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-[var(--bg-subtle)]' : 'bg-[var(--text)]'
              }`}>
              {message.role === 'user' ? (
                <User className="h-4 w-4 text-[var(--text-secondary)]" />
              ) : (
                <Bot className="h-4 w-4 text-white" />
              )}
            </div>
            <div className={`max-w-[70%] rounded-[20px] px-4 py-3 ${message.role === 'user'
                ? 'bg-[var(--text)] text-white'
                : 'bg-[var(--bg-subtle)] text-[var(--text)]'
              }`}>
              <p className="text-[14px] whitespace-pre-wrap">{message.content}</p>
              {message.components && message.components.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.components.map((component, idx) => (
                    <div key={idx} className="bg-white rounded-[12px] p-3 border border-[var(--border)]">
                      {component.type === 'chart' && (
                        <div className="h-32 bg-gradient-to-br from-[var(--accent)]/10 to-transparent rounded-[8px] flex items-center justify-center">
                          <BarChart3 className="h-8 w-8 text-[var(--accent)]" />
                        </div>
                      )}
                      {component.type === 'table' && (
                        <div className="text-[12px] text-[var(--text-secondary)]">
                          Table: {component.title}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--text)] flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-[var(--bg-subtle)] rounded-[20px] px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text)]" />
              <span className="text-[14px] text-[var(--text-secondary)]">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-[var(--bg-subtle)] rounded-full transition-colors">
            <Paperclip className="h-5 w-5 text-[var(--text-secondary)]" />
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-[var(--bg-subtle)] rounded-full px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
            className="p-3 bg-[var(--accent)] text-white rounded-full hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsTab = () => (
    <div className="space-y-6">
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
    <div className="max-w-[600px] space-y-6">
      <div>
        <h2 className="text-[24px] font-medium text-[var(--text)] mb-1">Profile</h2>
        <p className="text-[14px] text-[var(--text-secondary)]">
          Manage your account settings
        </p>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-[24px] p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <span className="text-[24px] font-medium text-white">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div>
            <h3 className="text-[18px] font-medium text-[var(--text)]">
              {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-[14px] text-[var(--text-secondary)]">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
          <div>
            <label className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide">Plan</label>
            <p className="text-[15px] font-medium text-[var(--text)] capitalize">{user?.plan_type || 'Free'}</p>
          </div>
          <div>
            <label className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide">Status</label>
            <p className="text-[15px] font-medium text-green-600 capitalize">{user?.plan_status || 'Active'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[var(--border)] rounded-[20px] p-4 text-center">
          <p className="text-[28px] font-medium text-[var(--text)]">{stats.agents}</p>
          <p className="text-[12px] text-[var(--text-secondary)]">Agents</p>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-[20px] p-4 text-center">
          <p className="text-[28px] font-medium text-[var(--text)]">{stats.conversations}</p>
          <p className="text-[12px] text-[var(--text-secondary)]">Conversations</p>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-[20px] p-4 text-center">
          <p className="text-[28px] font-medium text-[var(--text)]">{stats.integrations}</p>
          <p className="text-[12px] text-[var(--text-secondary)]">Integrations</p>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-[20px] p-4 text-center">
          <p className="text-[28px] font-medium text-[var(--text)]">{stats.messages}</p>
          <p className="text-[12px] text-[var(--text-secondary)]">Messages</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-[var(--border)] z-10">
        <div className="p-6">
          <Link to="/" className="text-[16px] font-medium tracking-tight">
            Relay
          </Link>
        </div>

        <nav className="px-4 space-y-1">
          <button
            onClick={() => setActiveTab('agents')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-[14px] transition-all duration-200 ${activeTab === 'agents'
                ? 'bg-[var(--text)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
              }`}
          >
            <Bot className="h-4 w-4" />
            Agents
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-[14px] transition-all duration-200 ${activeTab === 'chat'
                ? 'bg-[var(--text)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
              }`}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-[14px] transition-all duration-200 ${activeTab === 'integrations'
                ? 'bg-[var(--text)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
              }`}
          >
            <Settings className="h-4 w-4" />
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-[14px] transition-all duration-200 ${activeTab === 'profile'
                ? 'bg-[var(--text)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
              }`}
          >
            <User className="h-4 w-4" />
            Profile
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-[14px] text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-500 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[240px] p-8">
        <div className="max-w-[1200px]">
          {activeTab === 'agents' && renderAgentsTab()}
          {activeTab === 'chat' && renderChatTab()}
          {activeTab === 'integrations' && renderIntegrationsTab()}
          {activeTab === 'profile' && renderProfileTab()}
        </div>
      </main>
    </div>
  );
}
