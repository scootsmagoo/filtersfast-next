'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ThumbsUp, ThumbsDown, User } from 'lucide-react';
import { useSystemConfig } from '@/lib/system-config-context';

interface Message {
  id: number | string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  articlesReferenced?: Array<{
    id: number;
    title: string;
    slug: string;
    category_slug: string;
  }>;
}

export default function ChatbotWidget() {
  const systemConfig = useSystemConfig();
  const chatEnabled = systemConfig.chatActive === 1;
  const textChatEnabled = systemConfig.txtChatEnabled === 1;

  if (!chatEnabled) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showContactForm, setShowContactForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  
  // WCAG: Character limit for input
  const MAX_MESSAGE_LENGTH = 2000;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !showContactForm) {
      inputRef.current?.focus();
    }
  }, [isOpen, showContactForm]);

  // Send initial greeting when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: "Hello! I'm the FiltersFast Virtual Assistant. I can help answer questions about our products, orders, returns, and more. How can I help you today?",
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [isOpen, messages.length]);

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showContactForm) {
          setShowContactForm(false);
        } else {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, showContactForm]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Delay adding listener to avoid immediate close on open
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSend = async () => {
    if (!textChatEnabled) return;
    if (!inputValue.trim() || isLoading) return;

    // WCAG/OWASP: Validate message length client-side
    if (inputValue.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(`Message too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setErrorMessage(''); // Clear any previous errors

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: data.messageId,
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp,
        articlesReferenced: data.articlesReferenced,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to get response';
      setErrorMessage(errorMsg); // WCAG: Announce error to screen readers
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again or contact our support team directly.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: number | string, feedback: 'helpful' | 'not_helpful') => {
    if (typeof messageId !== 'number') return;

    try {
      await fetch('/api/chatbot/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, feedback }),
      });
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (textChatEnabled) {
        handleSend();
      }
    }
  };

  const quickActions = [
    "Where is my order?",
    "How do I return an item?",
    "Tell me about Subscribe & Save",
    "What's your return policy?",
  ];

  if (!isOpen) {
    const closedButtonLabel = textChatEnabled
      ? 'Open chat assistant - Get help with your order'
      : 'Live chat offline - View contact options';
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-orange text-white rounded-full p-4 shadow-[0_0_0_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_0_0_4px_rgba(242,103,34,0.4),0_12px_24px_rgba(0,0,0,0.3)] hover:scale-110 transition-all duration-200 z-50 group border-4 border-gray-800 dark:border-gray-600 min-w-[56px] min-h-[56px]"
        aria-label={closedButtonLabel}
        title={textChatEnabled ? "Chat with our AI assistant" : "Chat is offline. Click for contact options."}
      >
        <MessageCircle className="w-6 h-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]" strokeWidth={2.5} aria-hidden="true" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse border-2 border-gray-800 dark:border-gray-600 font-bold shadow-lg" aria-label="New">
          !
        </span>
      </button>
    );
  }

  return (
    <div 
      ref={widgetRef}
      className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 border-4 border-brand-orange ring-4 ring-gray-300 dark:ring-gray-600 transition-colors"
      role="dialog"
      aria-label="Chat assistant"
      aria-modal="true"
    >
      {/* Header */}
      <div className="bg-brand-blue dark:bg-gray-900 text-white p-4 rounded-t-lg flex items-center justify-between border-b-4 border-brand-orange transition-colors">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
          <div>
            <h3 className="font-semibold" id="chat-title">FiltersFast Assistant</h3>
            <p className="text-xs opacity-90">Powered by AI • Press Esc to close</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 rounded p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close chat assistant window"
          title="Close chat (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!textChatEnabled && (
        <div
          className="mx-4 mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold">Live chat is currently unavailable.</p>
          <p className="mt-1">
            Please call us at <span className="font-bold">1-866-438-3458</span> or email{' '}
            <a
              href="mailto:support@filtersfast.com"
              className="underline hover:text-amber-700 dark:hover:text-amber-100"
            >
              support@filtersfast.com
            </a>{' '}
            for assistance.
          </p>
        </div>
      )}

      {/* WCAG: Error announcement for screen readers */}
      {errorMessage && (
        <div 
          className="sr-only" 
          role="alert" 
          aria-live="assertive"
          aria-atomic="true"
        >
          Error: {errorMessage}
        </div>
      )}

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-800 transition-colors"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Chat messages"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-md ${
                msg.role === 'user' ? 'bg-gradient-to-br from-brand-blue to-brand-blue-dark border-brand-blue-dark' : 'bg-gradient-to-br from-brand-orange to-brand-orange-dark border-brand-orange-dark'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-white" aria-hidden="true" strokeWidth={2.5} />
                ) : (
                  <MessageCircle className="w-4 h-4 text-white" aria-hidden="true" strokeWidth={2.5} />
                )}
              </div>

              {/* Message bubble */}
              <div className="flex flex-col">
                <div className={`rounded-lg p-3 border-2 shadow-sm transition-colors ${
                  msg.role === 'user'
                    ? 'bg-brand-blue text-white border-brand-blue-dark'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Referenced articles */}
                {msg.articlesReferenced && msg.articlesReferenced.length > 0 && (
                  <div className="mt-2 text-xs space-y-1">
                    <p className="text-gray-500 dark:text-gray-400 font-medium transition-colors">Related articles:</p>
                    {msg.articlesReferenced.map((article) => (
                      <a
                        key={article.id}
                        href={`/support/${article.category_slug}/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-brand-blue-link dark:text-blue-400 hover:underline transition-colors"
                      >
                        → {article.title}
                      </a>
                    ))}
                  </div>
                )}

                {/* Feedback buttons for assistant messages - WCAG: Min 44x44px touch targets */}
                {msg.role === 'assistant' && typeof msg.id === 'number' && (
                  <div className="flex gap-2 mt-2" role="group" aria-label="Rate this response">
                    <button
                      onClick={() => handleFeedback(msg.id, 'helpful')}
                      className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 p-2 rounded transition-colors border border-transparent hover:border-green-300 dark:hover:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="This answer was helpful"
                      title="This was helpful"
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, 'not_helpful')}
                      className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors border border-transparent hover:border-red-300 dark:hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="This answer was not helpful"
                      title="This was not helpful"
                    >
                      <ThumbsDown className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-dark border-2 border-brand-orange-dark flex items-center justify-center shadow-md">
                <MessageCircle className="w-4 h-4 text-white" aria-hidden="true" strokeWidth={2.5} />
              </div>
              <div className="bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 shadow-sm transition-colors" role="status" aria-live="polite" aria-label="Loading response">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions (shown when no messages) */}
      {messages.length === 1 && messages[0].id === 'greeting' && (
        <div className="px-4 pb-2 space-y-2 bg-white dark:bg-gray-800 transition-colors">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium transition-colors">Quick questions:</p>
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => {
                  if (!textChatEnabled) return;
                  setInputValue(action);
                  setTimeout(handleSend, 100);
                }}
                disabled={!textChatEnabled}
                className="text-left text-xs bg-white dark:bg-gray-700 hover:bg-brand-orange hover:text-white text-gray-700 dark:text-gray-300 px-3 py-3 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-brand-orange transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-orange min-h-[44px] disabled:opacity-60 disabled:hover:bg-white disabled:hover:text-gray-700 dark:disabled:hover:bg-gray-700 disabled:cursor-not-allowed"
                aria-label={`Ask: ${action}`}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t-4 border-brand-orange bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* WCAG: Character counter */}
        {inputValue.length > 0 && (
          <div
            id="chat-char-count"
            className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-right transition-colors"
            aria-live="polite"
          >
            {inputValue.length} / {MAX_MESSAGE_LENGTH} characters
            {inputValue.length > MAX_MESSAGE_LENGTH && (
              <span className="text-red-600 dark:text-red-400 font-semibold ml-2 transition-colors">
                (Too long - max {MAX_MESSAGE_LENGTH})
              </span>
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={textChatEnabled ? "Type your message..." : "Live chat is offline. Please reach out via phone or email."}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH + 100}
            className={`flex-1 resize-none border-2 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 transition-colors ${
              inputValue.length > MAX_MESSAGE_LENGTH ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isLoading || !textChatEnabled}
            aria-label={textChatEnabled ? "Type your message" : "Live chat offline message input disabled"}
            aria-describedby={inputValue.length > 0 ? 'chat-char-count' : undefined}
            aria-invalid={inputValue.length > MAX_MESSAGE_LENGTH}
          />
          <button
            onClick={handleSend}
            disabled={!textChatEnabled || !inputValue.trim() || isLoading || inputValue.length > MAX_MESSAGE_LENGTH}
            className="bg-brand-orange text-white px-4 py-2 rounded-lg hover:bg-brand-orange-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 border-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={textChatEnabled ? "Send message" : "Live chat offline"}
            title={textChatEnabled ? "Send message (Enter)" : "Live chat is currently unavailable"}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Human support button - WCAG: Min touch target 44x44px */}
        <button
          onClick={() => setShowContactForm(true)}
          className="w-full mt-2 text-xs text-brand-blue-link dark:text-blue-400 hover:text-brand-orange dark:hover:text-brand-orange hover:underline focus:outline-none focus:ring-2 focus:ring-brand-blue rounded px-2 py-2 min-h-[44px] transition-colors"
          aria-label="Contact human support team"
        >
          Need to talk to a human? Contact support →
        </button>
      </div>

      {/* Contact form overlay */}
      {showContactForm && (
        <div 
          className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col border-4 border-brand-orange transition-colors"
          role="dialog"
          aria-labelledby="contact-title"
        >
          <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-200 dark:border-gray-700 transition-colors">
            <h3 id="contact-title" className="font-semibold text-lg text-brand-blue dark:text-blue-400 transition-colors">Contact Human Support</h3>
            <button
              onClick={() => setShowContactForm(false)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label="Close contact form and return to chat"
              title="Back to chat (Esc)"
            >
              <X className="w-5 h-5 text-gray-900 dark:text-gray-100" />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 font-medium transition-colors">
              For immediate assistance, please contact us:
            </p>
            <div className="space-y-3 text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 transition-colors">
              <p className="flex items-start">
                <strong className="w-20 text-brand-blue dark:text-blue-400 transition-colors">Phone:</strong> 
                <a href="tel:1-888-775-7101" className="text-brand-blue-link dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors">
                  1-888-775-7101
                </a>
              </p>
              <p className="flex items-start">
                <strong className="w-20 text-brand-blue dark:text-blue-400 transition-colors">Email:</strong> 
                <a href="mailto:support@filtersfast.com" className="text-brand-blue-link dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors">
                  support@filtersfast.com
                </a>
              </p>
              <p className="flex items-start text-gray-900 dark:text-gray-100 transition-colors">
                <strong className="w-20 text-brand-blue dark:text-blue-400 transition-colors">Hours:</strong> 
                <span>Mon-Fri 9am-5pm EST</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowContactForm(false)}
            className="w-full bg-brand-orange text-white py-3 rounded-lg hover:bg-brand-orange-dark border-2 border-brand-orange-dark transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange mt-4 min-h-[44px]"
            aria-label="Return to chat conversation"
          >
            Back to Chat
          </button>
        </div>
      )}
    </div>
  );
}

