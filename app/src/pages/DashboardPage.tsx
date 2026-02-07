import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Plus, Send, Paperclip, Bot, User, Loader2,
  Menu, Sparkles
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type?: string;
  type?: string;
  category?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
        if (data.length > 0) setSelectedAgentId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          agentId: selectedAgentId
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message || "I'm not sure how to respond to that.",
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: 'Failed to send message. Please try again.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-[280px]' : 'w-0'} bg-[#F8FAFC] border-r border-gray-100 transition-all duration-300 flex flex-col h-full overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Level9</span>
          </div>

          <button
            onClick={() => {
              setMessages([]);
              setInputValue('');
            }}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Agents</div>
          <div className="space-y-1">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${selectedAgentId === agent.id
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Bot className="h-4 w-4" />
                <span className="truncate">{agent.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative bg-white">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-50/50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            {/* Add header actions if needed */}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
              <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-black" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                How can I help you today?
              </h2>
              <p className="text-gray-500 max-w-md">
                I can help you analyze data, generate reports, or answer any questions you might have.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
              {messages.map((msg: Message) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div className={`max-w-[80%] rounded-2xl px-6 py-3.5 leading-relaxed text-[15px] ${msg.role === 'user'
                    ? 'bg-gray-100 text-gray-900 rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm'
                    }`}>
                    {msg.content}
                  </div>

                  {msg.role === 'user' && (
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-4">
                  <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 h-10 px-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSendMessage}
              className="relative flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-black/5 focus-within:border-gray-300 transition-all shadow-sm"
            >
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-gray-400 text-gray-900"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
            <div className="text-center mt-3">
              <p className="text-xs text-gray-400">
                AI can make mistakes. Please verify important information.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
