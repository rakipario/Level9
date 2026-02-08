import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Settings, MessageSquare, Plus, Send, Paperclip,
  User, Loader2, Menu, Sparkles, Trash2, FileText, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface UploadedFile {
  id: string;
  originalName: string;
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/ai/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(Array.isArray(data) ? data : (data.conversations || []));
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
        const mappedMessages = (data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.created_at || m.createdAt,
        }));
        setMessages(mappedMessages);
        setCurrentConversationId(id);
        setSidebarOpen(false);
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
      const response = await fetch(`${API_URL}/ai/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (currentConversationId === id) startNewChat();
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
    setSidebarOpen(false);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/upload/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(prev => [...prev, data.file]);
      } else {
        const errorData = await response.json();
        alert(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && uploadedFiles.length === 0) || loading) return;

    let messageContent = inputValue;
    if (uploadedFiles.length > 0) {
      messageContent += '\n\n[Attached files:\n' + 
        uploadedFiles.map(f => `- ${f.originalName} (file ID: ${f.id})`).join('\n') +
        ']\n\nWhen reading files, use the file_id shown above.';
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
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
          conversationId: currentConversationId,
          context: { files: uploadedFiles }
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
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: 'Failed to send message. Please try again.',
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="h-screen flex bg-[#343541]">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-[260px] bg-[#202123] transition-transform duration-300 md:relative md:translate-x-0 flex flex-col`}>
        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={startNewChat}
            className="flex items-center gap-3 w-full px-3 py-3 text-sm text-white border border-white/20 rounded-md hover:bg-white/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`group flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer transition-colors text-sm ${
                currentConversationId === conv.id 
                  ? 'bg-[#343541] text-white' 
                  : 'text-gray-300 hover:bg-[#343541]/50'
              }`}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate flex-1">{conv.title || 'New conversation'}</span>
              <button
                onClick={(e) => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-white text-gray-400 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <button className="flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:bg-[#343541] rounded-md w-full transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:bg-[#343541] rounded-md w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#343541] relative">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-2 text-white font-semibold">
            <Sparkles className="h-5 w-5" />
            Relay
          </div>
          
          <div className="w-10" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-semibold text-white mb-2">
                  How can I help you today?
                </h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                {[
                  { title: 'Analyze a document', desc: 'Upload and analyze files' },
                  { title: 'Search the web', desc: 'Find current information' },
                  { title: 'Write code', desc: 'Python, JavaScript, etc.' },
                  { title: 'Explain a topic', desc: 'Learn something new' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(item.title)}
                    className="p-4 text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="text-sm text-gray-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`py-6 px-4 ${msg.role === 'assistant' ? 'bg-[#444654]' : 'bg-[#343541]'}`}
                >
                  <div className="max-w-3xl mx-auto flex gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center">
                      {msg.role === 'user' ? (
                        <div className="w-8 h-8 bg-[#10a37f] rounded-sm flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      ) : msg.role === 'assistant' ? (
                        <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-[#343541]" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-red-500 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs">!</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-200 mb-1">
                        {msg.role === 'user' ? 'You' : 'Relay'}
                      </div>
                      <div className="text-[#ececf1] leading-relaxed prose prose-invert max-w-none">
                        {msg.role === 'assistant' ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="py-6 px-4 bg-[#444654]">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-[#343541]" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#343541]">
          <div className="max-w-3xl mx-auto">
            {/* File attachments */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map(file => (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-2 px-3 py-2 bg-[#444654] rounded-lg text-sm"
                  >
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-200 truncate max-w-[200px]">{file.originalName}</span>
                    <button 
                      onClick={() => removeUploadedFile(file.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage}>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />
              
              <div className="relative flex items-end gap-2 bg-[#40414f] border border-white/10 rounded-xl shadow-lg">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-3 text-gray-400 hover:text-white transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </button>

                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Message..."
                  disabled={loading}
                  rows={1}
                  className="flex-1 py-3 bg-transparent border-none outline-none text-white placeholder:text-gray-500 resize-none max-h-[200px]"
                />

                <button
                  type="submit"
                  disabled={(!inputValue.trim() && uploadedFiles.length === 0) || loading}
                  className="p-3 text-gray-400 hover:text-[#10a37f] disabled:opacity-30 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
            
            <p className="text-center text-xs text-gray-500 mt-2">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
