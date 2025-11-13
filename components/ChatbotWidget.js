'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  TrashIcon
} from '@heroicons/react/24/solid';
import { useChatbot } from '../context/ChatbotContext';

export default function ChatbotWidget() {
  const {
    messages,
    isOpen,
    isLoading,
    position,
    unreadCount,
    sendMessage,
    clearChat,
    toggleChatbot,
    updatePosition,
  } = useChatbot();

  // Sample questions for quick actions
  const sampleQuestions = [
    "What is phishing?",
    "How to create strong passwords?",
    "What is two-factor authentication?",
  ];

  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState(position);
  const widgetRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Initialize position from context
  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  // Handle drag start
  const handleDragStart = (e) => {
    // Only allow dragging from header
    if (!e.target.closest('.drag-handle')) return;
    
    setIsDragging(true);
    
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  // Handle drag move
  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    // Calculate new position
    let newX = clientX - dragOffset.x;
    let newY = clientY - dragOffset.y;
    
    // Get widget dimensions
    const widgetWidth = 380;
    const widgetHeight = 600;
    
    // Constrain within viewport
    const maxX = window.innerWidth - widgetWidth;
    const maxY = window.innerHeight - widgetHeight;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    setCurrentPosition({ x: newX, y: newY });
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      updatePosition(currentPosition.x, currentPosition.y);
    }
  };

  // Add event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, dragOffset, currentPosition]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      await sendMessage(inputValue);
      setInputValue('');
    }
  };

  // Handle clear chat with confirmation
  const handleClearChat = () => {
    if (messages.length > 0) {
      if (window.confirm('Are you sure you want to clear the chat history?')) {
        clearChat();
      }
    }
  };

  // Minimized floating button
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        onClick={toggleChatbot}
        className="fixed bottom-5 right-5 w-[60px] h-[60px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-50 group"
        style={{ bottom: '20px', right: '20px' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChatBubbleLeftRightIcon className="w-7 h-7 text-white" />
        
        {/* Notification badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
        
        {/* Pulse effect */}
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-30 group-hover:animate-ping" />
      </motion.button>
    );
  }

  // Expanded chat window
  return (
    <>
      {/* Mobile: Full-screen modal */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="md:hidden fixed inset-0 bg-white flex flex-col z-50"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
            <h3 className="text-white font-bold text-lg">CagE Assistant</h3>
          </div>
          <button
            onClick={toggleChatbot}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Close chat"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-blue-300 mb-4" />
              <h4 className="text-lg font-bold text-gray-700 mb-2">
                Welcome to CagE Assistant! 👋
              </h4>
              <p className="text-gray-600 text-sm">
                I'm here to help you learn cybersecurity. Ask me anything or use the quick actions below!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Sample questions */}
        <div className="px-4 py-2 bg-white border-t border-gray-200">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sampleQuestions.map((question, index) => (
              <SampleQuestionButton
                key={index}
                label={question}
                onClick={() => sendMessage(question)}
                disabled={isLoading}
              />
            ))}
            <QuickActionButton
              icon={TrashIcon}
              label="Clear"
              onClick={handleClearChat}
              disabled={isLoading || messages.length === 0}
            />
          </div>
        </div>

        {/* Input area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </motion.div>

      {/* Desktop: Floating window */}
      <motion.div
        ref={widgetRef}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="hidden md:flex fixed w-[380px] h-[600px] bg-white rounded-3xl shadow-2xl flex-col overflow-hidden z-50"
        style={{ 
          left: `${currentPosition.x}px`, 
          top: `${currentPosition.y}px`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        {/* Header */}
        <div 
          className="drag-handle bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
            <h3 className="text-white font-bold text-lg">CagE Assistant</h3>
          </div>
          <button
            onClick={toggleChatbot}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors pointer-events-auto"
            aria-label="Close chat"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-blue-300 mb-4" />
              <h4 className="text-lg font-bold text-gray-700 mb-2">
                Welcome to CagE Assistant! 👋
              </h4>
              <p className="text-gray-600 text-sm">
                I'm here to help you learn cybersecurity. Ask me anything or use the quick actions below!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Sample questions */}
        <div className="px-4 py-2 bg-white border-t border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {sampleQuestions.map((question, index) => (
              <SampleQuestionButton
                key={index}
                label={question}
                onClick={() => sendMessage(question)}
                disabled={isLoading}
              />
            ))}
            <QuickActionButton
              icon={TrashIcon}
              label="Clear"
              onClick={handleClearChat}
              disabled={isLoading || messages.length === 0}
            />
          </div>
        </div>

        {/* Input area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-full hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

// Sample question button component
function SampleQuestionButton({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {label}
    </button>
  );
}

// Quick action button component
function QuickActionButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

// Message bubble component with markdown rendering
function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
            : 'bg-white text-gray-800 shadow-sm border border-gray-200'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-800 prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-a:text-blue-600 prose-li:text-gray-800">
            <ReactMarkdown
              components={{
                // Custom rendering for code blocks
                code: ({ node, inline, className, children, ...props }) => {
                  if (inline) {
                    return (
                      <code className="bg-blue-50 text-blue-600 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className="block bg-gray-100 text-gray-800 p-2 rounded text-xs font-mono overflow-x-auto" {...props}>
                      {children}
                    </code>
                  );
                },
                // Custom rendering for paragraphs
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                // Custom rendering for lists
                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                // Custom rendering for headings
                h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                // Custom rendering for links
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {children}
                  </a>
                ),
                // Custom rendering for blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-300 pl-3 italic text-gray-700 my-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <span className={`text-xs mt-1 block ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

// Typing indicator component
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start"
    >
      <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-200">
        <div className="flex gap-1.5 items-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0, ease: "easeInOut" }}
            className="w-2.5 h-2.5 bg-blue-400 rounded-full"
          />
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2, ease: "easeInOut" }}
            className="w-2.5 h-2.5 bg-blue-400 rounded-full"
          />
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4, ease: "easeInOut" }}
            className="w-2.5 h-2.5 bg-blue-400 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
