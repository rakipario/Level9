import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Settings, MessageSquare, Plus, Send, Paperclip,
  Bot, User, Loader2, Menu, Sparkles, ChevronDown, ChevronUp,
  Trash2, MoreHorizontal, FileText, X, Command, Search,
  Zap, CheckCircle2, AlertCircle, Upload
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type?: string;
  type?: string;
  category?: string;
  icon?: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  agent_id?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  conversation_id?: string;
  createdAt: string;
  files?: UploadedFile[];
}

interface UploadedFile {
  id: string;
  originalName: string;
  size: number;
  type: string;
}

// Markdown renderer component for AI responses
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content prose prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-[var(--bg-subtle)] prose-pre:border prose-pre:border-[var(--border)] prose-pre:rounded-xl prose-code:text-[var(--accent)] prose-code:bg-[var(--accent-light)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-headings:text-[var(--text)] prose-headings:font-semibold prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom code block rendering
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="relative group">
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{match[1]}</span>
                </div>
                <pre className={className} {...props}>
                  <code className={className}>{children}</code>
                </pre>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Custom table rendering
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 border border-[var(--border)] rounded-xl">
                <table className="min-w-full divide-y divide-[var(--border)]">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text)] bg-[var(--bg-subtle)] uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-3 text-sm text-[var(--text-secondary)] border-t border-[var(--border)]">
                {children}
              </td>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Simple markdown-like renderer as fallback if react-markdown is not installed
function SimpleFormattedContent({ content }: { content: string }) {
  // Format lists
  const formatLists = (text: string) => {
    const lines = text.split('\n');
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    const result: JSX.Element[] = [];
    let currentListItems: JSX.Element[] = [];

    const flushList = () => {
      if (currentListItems.length === 0) return;
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      result.push(
        <ListTag key={`list-${result.length}`} className={`my-3 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} pl-5 space-y-1`}>
          {currentListItems}
        </ListTag>
      );
      currentListItems = [];
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // Numbered list (e.g., "1. Item" or "1. **Bold** Item")
      const numMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
      if (numMatch) {
        if (!inList || listType !== 'ol') {
          flushList();
          inList = true;
          listType = 'ol';
        }
        currentListItems.push(
          <li key={idx} className="text-[var(--text-secondary)] leading-relaxed">
            <FormatInline text={numMatch[2]} />
          </li>
        );
        return;
      }

      // Bullet list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList || listType !== 'ul') {
          flushList();
          inList = true;
          listType = 'ul';
        }
        const itemText = trimmed.slice(2);
        currentListItems.push(
          <li key={idx} className="text-[var(--text-secondary)] leading-relaxed">
            <FormatInline text={itemText} />
          </li>
        );
        return;
      }

      // Not a list item
      if (inList) {
        flushList();
        inList = false;
        listType = null;
      }

      if (trimmed === '') {
        result.push(<div key={idx} className="h-2" />);
      } else if (trimmed.startsWith('# ')) {
        result.push(
          <h1 key={idx} className="text-xl font-semibold text-[var(--text)] mt-4 mb-2">
            {trimmed.slice(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        result.push(
          <h2 key={idx} className="text-lg font-semibold text-[var(--text)] mt-4 mb-2">
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        result.push(
          <h3 key={idx} className="text-base font-semibold text-[var(--text)] mt-3 mb-2">
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith('> ')) {
        result.push(
          <blockquote key={idx} className="border-l-2 border-[var(--accent)] pl-4 my-3 text-[var(--text-secondary)] italic">
            {trimmed.slice(2)}
          </blockquote>
        );
      } else if (trimmed.startsWith('```')) {
        // Code block - handled by parent
        result.push(
          <pre key={idx} className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl p-4 my-3 overflow-x-auto">
            <code className="text-sm text-[var(--text)] font-mono">{trimmed.replace(/```/g, '')}</code>
          </pre>
        );
      } else {
        result.push(
          <p key={idx} className="text-[var(--text-secondary)] leading-relaxed mb-2">
            <FormatInline text={trimmed} />
          </p>
        );
      }
    });

    flushList();
    return <>{result}</>;
  };

  return <div className="formatted-content">{formatLists(content)}</div>;
}

// Format inline elements (bold, italic, code, links)
function FormatInline({ text }: { text: string }) {
  // Split by patterns
  const parts: JSX.Element[] = [];
  let remaining = text;
  let key = 0;

  const patterns = [
    { regex: /\*\*\*(.+?)\*\*\*/g, wrap: (s: string) => <strong key={key++} className="font-semibold italic">{s}</strong> }, // bold+italic
    { regex: /\*\*(.+?)\*\*/g, wrap: (s: string) => <strong key={key++} className="font-semibold text-[var(--text)]">{s}</strong> }, // bold
    { regex: /\*(.+?)\*/g, wrap: (s: string) => <em key={key++} className="italic">{s}</em> }, // italic
    { regex: /`(.+?)`/g, wrap: (s: string) => <code key={key++} className="bg-[var(--accent-light)] text-[var(--accent)] px-1.5 py-0.5 rounded text-sm font-mono">{s}</code> }, // inline code
  ];

  // Simple inline formatting
  let formatted = text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-semibold italic">$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[var(--text)]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-[var(--accent-light)] text-[var(--accent)] px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

// Main content renderer that tries ReactMarkdown first, falls back to simple
function FormattedContent({ content }: { content: string }) {
  // Check if react-markdown is available
  const [hasReactMarkdown, setHasReactMarkdown] = useState(true);

  useEffect(() => {
    try {
      // Test if ReactMarkdown is available
      if (!ReactMarkdown) {
        setHasReactMarkdown(false);
      }
    } catch {
      setHasReactMarkdown(false);
    }
  }, []);

  if (hasReactMarkdown) {
    try {
      return <MarkdownContent content={content} />;
    } catch {
      return <SimpleFormattedContent content={content} />;
    }
  }

  return <SimpleFormattedContent content={content} />;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchAgents();
    fetchConversations();
  }, []);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const agentsList = data.agents || data || [];
        if (Array.isArray(agentsList)) {
          setAgents(agentsList);
          if (agentsList.length > 0 && !selectedAgentId) {
            setSelectedAgentId(agentsList[0].id);
          }
        } else {
          setAgents([]);
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    }
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/ai/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const conversationsList = Array.isArray(data) ? data : (data.conversations || []);
        setConversations(conversationsList);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoading(true);
      const response = await fetch(`${API_URL}/ai/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setCurrentConversationId(id);
        if (data.conversation.agent_id) {
          setSelectedAgentId(data.conversation.agent_id);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/ai/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (currentConversationId === id) {
          startNewChat();
        }
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInputValue('');
    setCurrentConversationId(null);
    setUploadedFiles([]);
    if (agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
    window.history.replaceState(null, '', '/dashboard');
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch(`${API_URL}/upload/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(prev => [...prev, data.file]);
        // Add a subtle mention in the input
        setInputValue(prev => prev ? `${prev} ` : '');
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData.error);
        alert(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 300);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && uploadedFiles.length === 0) || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue + (uploadedFiles.length > 0 
        ? `\n\n[Attached files: ${uploadedFiles.map(f => f.originalName).join(', ')}]` 
        : ''),
      createdAt: new Date().toISOString(),
      files: uploadedFiles
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setUploadedFiles([]);
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
          agentId: selectedAgentId,
          conversationId: currentConversationId
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response || "I'm not sure how to respond to that.",
        createdAt: new Date().toISOString()
      };

      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
        fetchConversations();
      }

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

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-[300px]' : 'w-0'} bg-[var(--bg-subtle)] border-r border-[var(--border)] transition-all duration-300 flex flex-col h-full overflow-hidden flex-shrink-0`}
      >
        {/* Logo */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-[var(--text)] rounded-xl flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-[var(--text)]">Relay</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 hover:bg-[var(--border)] rounded-lg text-[var(--text-tertiary)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2.5 px-4 py-3 bg-[var(--text)] text-white hover:bg-[var(--text-secondary)] rounded-xl text-[14px] font-medium transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-6">
          {/* Agents Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Agents</span>
              {agents.length > 0 && (
                <span className="text-[11px] text-[var(--text-tertiary)]">{agents.length}</span>
              )}
            </div>
            
            {agents.length === 0 ? (
              <div className="mx-3 p-4 rounded-xl bg-white border border-[var(--border)] border-dashed">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <span className="text-[13px] font-medium text-[var(--text)]">No agents yet</span>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] mb-3">
                  Create your first AI agent to get started.
                </p>
                <button 
                  onClick={() => navigate('/dashboard/agents/create')}
                  className="w-full py-2 text-[12px] font-medium text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-lg transition-colors"
                >
                  + Create Agent
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all ${selectedAgentId === agent.id
                      ? 'bg-white text-[var(--text)] font-medium shadow-sm border border-[var(--border)]'
                      : 'text-[var(--text-secondary)] hover:bg-white/50 hover:text-[var(--text)]'
                    }`}
                  >
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedAgentId === agent.id ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                      <Bot className={`h-3.5 w-3.5 ${selectedAgentId === agent.id ? 'text-white' : 'text-[var(--text-tertiary)]'}`} />
                    </div>
                    <span className="truncate text-left">{agent.name}</span>
                    {selectedAgentId === agent.id && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)] ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Chats Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Recent Chats</span>
              {conversations.length > 0 && (
                <span className="text-[11px] text-[var(--text-tertiary)]">{conversations.length}</span>
              )}
            </div>
            <div className="space-y-0.5">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer ${currentConversationId === conv.id
                    ? 'bg-white text-[var(--text)] font-medium shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-secondary)] hover:bg-white/50 hover:text-[var(--text)]'
                  }`}
                >
                  <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${currentConversationId === conv.id ? 'text-[var(--accent)]' : ''}`} />
                  <span className="truncate text-left flex-1">{conv.title || 'Untitled Chat'}</span>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(showDeleteConfirm === conv.id ? null : conv.id);
                    }}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-md ${showDeleteConfirm === conv.id ? 'opacity-100 bg-red-50' : ''}`}
                  >
                    <MoreHorizontal className="h-3 w-3 text-[var(--text-tertiary)]" />
                  </button>

                  {/* Delete confirmation */}
                  {showDeleteConfirm === conv.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-50 min-w-[120px]">
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-[12px] text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete chat
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="px-3 py-4 text-[13px] text-[var(--text-tertiary)] italic text-center bg-white/50 rounded-xl">
                  No recent chats
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-[var(--text-secondary)] hover:bg-white rounded-xl transition-colors">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative bg-[var(--bg)]">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-[var(--bg-subtle)] rounded-xl text-[var(--text-secondary)] transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="h-4 w-px bg-[var(--border)]" />
              </>
            )}
            
            {/* Agent Selector */}
            {agents.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAgentSelector(!showAgentSelector)}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--bg-subtle)] rounded-xl transition-colors"
                >
                  <div className="h-7 w-7 bg-[var(--accent)] rounded-lg flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[14px] font-medium text-[var(--text)]">
                    {selectedAgent?.name || 'Select Agent'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
                </button>

                {showAgentSelector && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowAgentSelector(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[var(--border)] rounded-2xl shadow-xl z-50 p-2">
                      <div className="px-3 py-2 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Select Agent
                      </div>
                      {agents.map(agent => (
                        <button
                          key={agent.id}
                          onClick={() => {
                            setSelectedAgentId(agent.id);
                            setShowAgentSelector(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-colors ${selectedAgentId === agent.id ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'text-[var(--text)] hover:bg-[var(--bg-subtle)]'}`}
                        >
                          <Bot className="h-4 w-4" />
                          <div className="text-left">
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-[11px] text-[var(--text-tertiary)] truncate max-w-[160px]">
                              {agent.description || 'No description'}
                            </div>
                          </div>
                          {selectedAgentId === agent.id && (
                            <CheckCircle2 className="h-4 w-4 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--bg-subtle)] rounded-xl transition-colors">
              <Command className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-[var(--border)]" />
            <button className="h-8 w-8 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center hover:bg-[var(--border)] transition-colors">
              <User className="h-4 w-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg)]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="max-w-xl w-full text-center">
                {/* Welcome State */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[var(--accent-light)] border border-[var(--accent)]/20 mb-8">
                  <Sparkles className="h-8 w-8 text-[var(--accent)]" />
                </div>
                
                <h2 className="text-3xl font-semibold text-[var(--text)] mb-3 tracking-tight">
                  {selectedAgent ? `Chat with ${selectedAgent.name}` : 'How can I help you today?'}
                </h2>
                <p className="text-[var(--text-secondary)] text-lg mb-10 max-w-md mx-auto">
                  I can help you analyze data, generate reports, or answer any questions you might have.
                </p>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  {[
                    { icon: FileText, label: 'Analyze a document', description: 'Upload and analyze files' },
                    { icon: Zap, label: 'Get insights', description: 'Discover trends in data' },
                    { icon: Search, label: 'Research topic', description: 'Find information quickly' },
                    { icon: CheckCircle2, label: 'Verify facts', description: 'Check accuracy of data' },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setInputValue(action.label)}
                      className="flex items-start gap-3 p-4 text-left bg-white border border-[var(--border)] hover:border-[var(--accent)]/30 hover:shadow-lg hover:shadow-[var(--accent)]/5 rounded-2xl transition-all group"
                    >
                      <div className="h-8 w-8 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center group-hover:bg-[var(--accent-light)] transition-colors">
                        <action.icon className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent)]" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[var(--text)]">{action.label}</div>
                        <div className="text-[11px] text-[var(--text-tertiary)]">{action.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-8">
              {messages.map((msg: Message, index: number) => (
                <div
                  key={msg.id}
                  className={`group flex gap-4 mb-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 bg-[var(--text)] rounded-xl flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  <div className={`flex-1 ${msg.role === 'user' ? 'max-w-[85%]' : 'max-w-[90%]'}`}>
                    <div className={`${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div className={`inline-block ${msg.role === 'user'
                        ? 'bg-[var(--text)] text-white rounded-2xl rounded-br-sm'
                        : 'bg-white border border-[var(--border)] text-[var(--text)] rounded-2xl rounded-bl-sm shadow-sm'
                      } px-5 py-3.5`}>
                        {msg.role === 'user' ? (
                          <div className="text-[15px] leading-relaxed">
                            <FormatInline text={msg.content} />
                          </div>
                        ) : (
                          <div className="text-[15px]">
                            <FormattedContent content={msg.content} />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`flex items-center gap-2 mt-1.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center overflow-hidden border border-[var(--border)]">
                        <User className="h-4 w-4 text-[var(--text-secondary)]" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-4">
                  <div className="h-8 w-8 bg-[var(--text)] rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 h-10 px-4 bg-white border border-[var(--border)] rounded-full">
                    <div className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-[var(--bg)] border-t border-[var(--border)]">
          <div className="max-w-3xl mx-auto">
            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map(file => (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-lg"
                  >
                    <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span className="text-[12px] text-[var(--accent)] max-w-[150px] truncate">
                      {file.originalName}
                    </span>
                    <button 
                      onClick={() => removeUploadedFile(file.id)}
                      className="p-0.5 hover:bg-[var(--accent)]/10 rounded"
                    >
                      <X className="h-3 w-3 text-[var(--accent)]" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSendMessage}
              className="relative flex items-end gap-2 p-2 bg-white border border-[var(--border)] rounded-2xl focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent-light)] transition-all shadow-sm"
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                multiple={false}
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || loading}
                className={`p-3 text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--bg-subtle)] rounded-xl transition-colors flex-shrink-0 ${isUploading ? 'opacity-50' : ''}`}
                title="Attach file"
              >
                {isUploading ? (
                  <div className="relative">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
                    {uploadProgress > 0 && (
                      <svg className="absolute inset-0 h-5 w-5 -rotate-90">
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-[var(--accent-light)]"
                        />
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${uploadProgress * 0.5} 100`}
                          className="text-[var(--accent)]"
                        />
                      </svg>
                    )}
                  </div>
                ) : (
                  <Paperclip className="h-5 w-5" />
                )}
              </button>

              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={agents.length === 0 ? "Create an agent first to start chatting..." : "Message..."}
                disabled={loading || agents.length === 0}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-[var(--text-tertiary)] text-[var(--text)] resize-none py-3.5 max-h-[200px] disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={(!inputValue.trim() && uploadedFiles.length === 0) || loading || agents.length === 0}
                className="p-3 bg-[var(--text)] text-white rounded-xl hover:bg-[var(--text-secondary)] disabled:opacity-40 disabled:hover:bg-[var(--text)] transition-colors flex-shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>
            
            <div className="flex items-center justify-between mt-3 px-2">
              <p className="text-[11px] text-[var(--text-tertiary)]">
                AI can make mistakes. Please verify important information.
              </p>
              {agents.length === 0 && (
                <button 
                  onClick={() => navigate('/dashboard/agents/create')}
                  className="text-[11px] text-[var(--accent)] hover:underline"
                >
                  Create your first agent →
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
