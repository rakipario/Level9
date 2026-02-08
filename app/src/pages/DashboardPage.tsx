import React, { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Settings, MessageSquare, Plus, Send, Paperclip,
  User, Loader2, Menu, Sparkles, Trash2,
  FileText, X
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

// Markdown renderer
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:rounded-lg prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// Simple formatter fallback
function SimpleFormattedContent({ content }: { content: string }) {
  const formatted = content
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

function FormattedContent({ content }: { content: string }) {
  try {
    return <MarkdownContent content={content} />;
  } catch {
    return <SimpleFormattedContent content={content} />;
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
  }, [messages]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedMessages = (data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.created_at || m.createdAt,
        }));
        setMessages(mappedMessages);
        setCurrentConversationId(id);
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

    // Build message with file context
    let messageContent = inputValue;
    if (uploadedFiles.length > 0) {
      messageContent += '\n\n[Attached files: ' + uploadedFiles.map(f => `${f.originalName} (ID: ${f.id})`).join(', ') + ']';
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
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

      setMessages((prev: Message[]) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev: Message[]) => [...prev, {
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
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 border-r border-gray-200 transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <button
            onClick={startNewChat}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New chat
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${currentConversationId === conv.id
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-700 hover:bg-gray-200'
                }`}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-500" />
              <span className="truncate flex-1">{conv.title || 'New conversation'}</span>
              <button
                onClick={(e) => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          <button className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg w-full transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gray-700" />
            <span className="font-semibold text-gray-900">Relay</span>
          </div>

          <div className="w-8" /> {/* Spacer for alignment */}
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-6">
                  <Sparkles className="h-6 w-6 text-gray-600" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  How can I help you today?
                </h1>
                <p className="text-gray-500">
                  I can analyze files, search the web, execute code, and answer your questions.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`group w-full text-gray-800 border-b border-black/10 dark:border-gray-900/50 ${msg.role === 'assistant' ? 'bg-gray-50' : 'bg-white'
                    }`}
                >
                  <div className="text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-[38rem] xl:max-w-3xl p-4 md:py-6 flex lg:px-0 m-auto">
                    <div className="flex-shrink-0 flex flex-col relative items-end">
                      <div className="w-[30px]">
                        {msg.role === 'user' ? (
                          <div className="relative h-[30px] w-[30px] p-1 rounded-sm text-white flex items-center justify-center bg-black/10">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        ) : (
                          <div className="relative h-[30px] w-[30px] p-1 rounded-sm text-white flex items-center justify-center bg-green-500">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative flex-1 overflow-hidden">
                      {msg.role === 'user' ? (
                        <div className="font-semibold select-none mb-1">You</div>
                      ) : (
                        <div className="font-semibold select-none mb-1">Relay</div>
                      )}
                      <div className="prose prose-slate dark:prose-invert break-words prose-p:leading-relaxed prose-pre:p-0 min-w-full">
                        <FormattedContent content={msg.content} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="w-full text-gray-800 border-b border-black/10 dark:border-gray-900/50 bg-gray-50">
                  <div className="text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-[38rem] xl:max-w-3xl p-4 md:py-6 flex lg:px-0 m-auto">
                    <div className="flex-shrink-0 flex flex-col relative items-end">
                      <div className="w-[30px]">
                        <div className="relative h-[30px] w-[30px] p-1 rounded-sm text-white flex items-center justify-center bg-green-500">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="relative flex-1 overflow-hidden">
                      <div className="font-semibold select-none mb-1">Relay</div>
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="h-32 md:h-48 flex-shrink-0" ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            {/* File attachments */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                  >
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 truncate max-w-[200px]">{file.originalName}</span>
                    <button
                      onClick={() => removeUploadedFile(file.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />

              <div className="flex items-end gap-2 border border-gray-300 rounded-2xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-3 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
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
                  className="flex-1 py-3 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 resize-none max-h-[200px]"
                />

                <button
                  type="submit"
                  disabled={(!inputValue.trim() && uploadedFiles.length === 0) || loading}
                  className="p-3 text-gray-500 hover:text-green-600 disabled:opacity-30 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>

            <p className="text-center text-xs text-gray-400 mt-2">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
