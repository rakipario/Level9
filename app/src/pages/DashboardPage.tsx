import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Settings, MessageSquare, Plus, Paperclip,
  Loader2, Menu, Sparkles, Trash2, FileText, X,
  ArrowUp, Globe, Code, BarChart3, Layout, Eye, Zap, Image as ImageIcon
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

interface ToolStatus {
  name: string;
  status: 'running' | 'done' | 'error';
}

const toolDisplayNames: Record<string, { label: string; icon: string }> = {
  web_search: { label: 'Searching the web', icon: '🔍' },
  fetch_url: { label: 'Fetching URL', icon: '🌐' },
  read_file: { label: 'Reading file', icon: '📄' },
  execute_code: { label: 'Running code', icon: '⚡' },
  analyze_data: { label: 'Analyzing data', icon: '📊' },
  list_uploaded_files: { label: 'Listing files', icon: '📂' },
  transcribe_audio: { label: 'Transcribing audio', icon: '🎙️' },
  analyze_image: { label: 'Analyzing image', icon: '👁️' },
  generate_website: { label: 'Building website', icon: '🌐' },
};

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
  const [activeTools, setActiveTools] = useState<ToolStatus[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streamingContent]);

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
    setStreamingContent('');
    setActiveTools([]);
    setPreviewUrl(null);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUploadedFiles: UploadedFile[] = [];

    try {
      const token = localStorage.getItem('token');
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/upload/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          newUploadedFiles.push(data.file);
        } else {
          const errorData = await response.json();
          alert(`Upload failed for ${file.name}: ${errorData.error || 'Unknown error'}`);
        }
      }
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
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
    setStreamingContent('');
    setActiveTools([]);
    setPreviewUrl(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ai/chat/stream`, {
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

      if (!response.ok) {
        throw new Error('Stream request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'tool_result' && event.tool === 'generate_website' && event.result?.url) {
              setPreviewUrl(`${API_URL.replace('/api', '')}${event.result.url}`);
            }

            switch (event.type) {
              case 'content':
                accumulatedContent += event.content;
                setStreamingContent(accumulatedContent);
                break;

              case 'tool_start':
                setActiveTools(
                  (event.tools || []).map((t: string) => ({ name: t, status: 'running' as const }))
                );
                break;

              case 'tool_result':
                setActiveTools(prev =>
                  prev.map(t =>
                    t.name === event.tool ? { ...t, status: 'done' as const } : t
                  )
                );
                break;

              case 'complete':
                accumulatedContent = event.response || accumulatedContent;
                break;

              case 'done':
                if (event.conversationId) {
                  setCurrentConversationId(event.conversationId);
                  fetchConversations();
                }
                break;

              case 'error':
                console.error('Stream error:', event.error);
                if (!accumulatedContent) {
                  accumulatedContent = `Sorry, something went wrong: ${event.error}`;
                }
                break;
            }
          } catch (parseErr) {
            // skip malformed JSON
          }
        }
      }

      // Add the final assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: accumulatedContent || "I'm not sure how to respond to that.",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);

      // Fallback to non-streaming endpoint
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
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || "I'm not sure how to respond to that.",
          createdAt: new Date().toISOString()
        };

        if (data.conversationId && !currentConversationId) {
          setCurrentConversationId(data.conversationId);
          fetchConversations();
        }

        setMessages(prev => [...prev, assistantMessage]);
      } catch (fallbackError) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: 'Failed to send message. Please try again.',
          createdAt: new Date().toISOString()
        }]);
      }
    } finally {
      setLoading(false);
      setStreamingContent('');
      setActiveTools([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const capabilities = [
    { icon: FileText, label: 'Analyze files', desc: 'Extract data from PDF, CSV & Excel', prompt: 'Summarize the contents of my uploaded file.' },
    { icon: Globe, label: 'Search the web', desc: 'Find latest information & news', prompt: 'What are the latest developments in AI agents this week?' },
    { icon: Layout, label: 'Build websites', desc: 'Generate & host HTML sites', prompt: 'Create a modern landing page for a coffee shop called "Relay Brew".' },
    { icon: ImageIcon, label: 'Vision analysis', desc: 'Understand & describe images', prompt: 'What is happening in this image? (Upload an image first)' },
    { icon: BarChart3, label: 'Data processing', desc: 'Complex stats & visualizations', prompt: 'Analyze this data and give me insights.' },
    { icon: Zap, label: 'Code execution', desc: 'Run Python/JS for calculations', prompt: 'Write and run a script to calculate the first 50 prime numbers.' },
  ];

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-[260px] bg-[var(--bg-subtle)] border-r border-[var(--border)] transition-transform duration-300 md:relative md:translate-x-0 flex flex-col`}>
        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={startNewChat}
            className="flex items-center gap-3 w-full px-3 py-3 text-sm text-[var(--text)] border border-[var(--border)] rounded-xl hover:bg-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            New chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-sm ${currentConversationId === conv.id
                ? 'bg-white shadow-sm text-[var(--text)]'
                : 'text-[var(--text-secondary)] hover:bg-white/60'
                }`}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0 opacity-50" />
              <span className="truncate flex-1">{conv.title || 'New conversation'}</span>
              <button
                onClick={(e) => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-[var(--text-tertiary)] transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] space-y-0.5">
          <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-white rounded-xl w-full transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-white rounded-xl w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-[var(--text)] font-medium text-[15px]">
            <div className="h-7 w-7 rounded-lg bg-[var(--text)] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Relay
          </div>

          <div className="w-10" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center px-4 text-center">
              <div className="mb-8">
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[var(--text)] flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">
                  How can I help you today?
                </h1>
                <p className="text-[15px] text-[var(--text-secondary)] max-w-md">
                  I can analyze files, search the web, execute code, and answer your questions.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl w-full">
                {capabilities.map((cap, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(cap.prompt)}
                    className="p-4 text-left bg-[var(--bg-subtle)] hover:bg-[var(--border)]/50 border border-[var(--border)] rounded-xl transition-all hover:shadow-sm group"
                  >
                    <cap.icon className="h-5 w-5 text-[var(--text-secondary)] mb-2.5 group-hover:text-[var(--text)] transition-colors" />
                    <div className="text-[13px] font-medium text-[var(--text)]">{cap.label}</div>
                    <div className="text-[12px] text-[var(--text-tertiary)] mt-0.5 line-clamp-1">{cap.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto py-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="px-4 mb-6"
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0 mt-0.5">
                      {msg.role === 'user' ? (
                        <div className="w-7 h-7 bg-[var(--text)] rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-medium">U</span>
                        </div>
                      ) : msg.role === 'assistant' ? (
                        <div className="w-7 h-7 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 text-[var(--text)]" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                          <span className="text-red-500 text-xs font-medium">!</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-[13px] font-medium text-[var(--text)] mb-1">
                        {msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Relay' : 'System'}
                      </div>
                      <div className="text-[15px] text-[var(--text)] leading-relaxed prose prose-sm max-w-none prose-headings:text-[var(--text)] prose-p:text-[var(--text)] prose-code:bg-[var(--bg-subtle)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[14px] prose-pre:bg-[var(--bg-subtle)] prose-pre:border prose-pre:border-[var(--border)] prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
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

              {/* Tool execution indicators */}
              {activeTools.length > 0 && (
                <div className="px-4 mb-4">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 flex-shrink-0" />
                    <div className="flex flex-wrap gap-2">
                      {activeTools.map((tool, i) => {
                        const display = toolDisplayNames[tool.name] || { label: tool.name, icon: '⚙️' };
                        return (
                          <div
                            key={i}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] transition-all ${tool.status === 'running'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : tool.status === 'done'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                          >
                            <span>{display.icon}</span>
                            <span>{display.label}</span>
                            {tool.status === 'running' && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Streaming content */}
              {streamingContent && (
                <div className="px-4 mb-6">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-7 h-7 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-[var(--text)]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-[13px] font-medium text-[var(--text)] mb-1">Relay</div>
                      <div className="text-[15px] text-[var(--text)] leading-relaxed prose prose-sm max-w-none prose-headings:text-[var(--text)] prose-p:text-[var(--text)] prose-code:bg-[var(--bg-subtle)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[14px] prose-pre:bg-[var(--bg-subtle)] prose-pre:border prose-pre:border-[var(--border)]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {streamingContent}
                        </ReactMarkdown>
                        <span className="inline-block w-2 h-4 bg-[var(--text)] ml-0.5 animate-pulse rounded-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading indicator (no streaming content yet) */}
              {loading && !streamingContent && activeTools.length === 0 && (
                <div className="px-4 mb-6">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-7 h-7 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-[var(--text)]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-2">
                      <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            {/* File attachments */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary)]">
                    <Paperclip className="h-3 w-3" />
                    <span className="max-w-[150px] truncate">{file.originalName}</span>
                    <button onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))} className="hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
              />

              <div className="relative flex items-end gap-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-2xl shadow-sm focus-within:border-[var(--text-tertiary)] focus-within:shadow-md transition-all">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-3 text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors"
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
                  placeholder="Message Relay..."
                  disabled={loading}
                  rows={1}
                  className="flex-1 py-3 bg-transparent border-none outline-none text-[var(--text)] placeholder:text-[var(--text-tertiary)] resize-none max-h-[200px] text-[15px]"
                />

                <button
                  type="submit"
                  disabled={(!inputValue.trim() && uploadedFiles.length === 0) || loading}
                  className="p-2 m-1.5 rounded-xl bg-[var(--text)] text-white disabled:opacity-20 transition-all hover:opacity-80"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </form>

            <p className="text-center text-[12px] text-[var(--text-tertiary)] mt-2">
              Relay can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>

      {/* Split View Panel */}
      {previewUrl && (
        <div className="w-[450px] border-l border-[var(--border)] bg-white flex flex-col animate-in slide-in-from-right duration-300">
          <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-subtle)]">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white border border-[var(--border)] rounded-lg">
                <Layout className="h-4 w-4 text-[var(--text)]" />
              </div>
              <span className="text-[14px] font-medium text-[var(--text)]">Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-[var(--text-secondary)] hover:bg-white rounded-lg transition-colors">
                <Eye className="h-4 w-4" />
              </a>
              <button onClick={() => setPreviewUrl(null)} className="p-2 text-[var(--text-secondary)] hover:bg-white rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-[var(--bg-subtle)] p-2 text-center">
            <iframe
              src={previewUrl}
              className="w-full h-full bg-white rounded-xl border border-[var(--border)] shadow-sm"
              title="Site Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
