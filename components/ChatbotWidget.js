'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useChatbot } from '../context/ChatbotContext';
import ChatLauncher from './chatbot/ChatLauncher';
import ChatHeader from './chatbot/ChatHeader';
import ChatMessageList from './chatbot/ChatMessageList';
import ChatQuickActions from './chatbot/ChatQuickActions';
import ChatInput from './chatbot/ChatInput';
import { useDraggable } from './chatbot/useDraggable';

const SAMPLE_QUESTIONS = [
  'What is phishing?',
  'How to create strong passwords?',
  'What is two-factor authentication?',
];

const DESKTOP_WIDTH = 380;
const DESKTOP_HEIGHT = 600;

export default function ChatbotWidget() {
  const pathname = usePathname();
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

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const { widgetRef, isDragging, currentPosition, handleDragStart } = useDraggable({
    initialPosition: position,
    onPositionChange: updatePosition,
    width: DESKTOP_WIDTH,
    height: DESKTOP_HEIGHT,
  });

  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      // Defer one tick so the DOM has the new bubble in place before scrolling.
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages, isOpen, isLoading]);

  if (pathname === '/profile' || pathname.startsWith('/admin')) {
    return null;
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      await sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleClearChat = () => {
    if (messages.length > 0 && window.confirm('Are you sure you want to clear the chat history?')) {
      clearChat();
    }
  };

  if (!isOpen) {
    return <ChatLauncher onOpen={toggleChatbot} unreadCount={unreadCount} />;
  }

  return (
    <>
      {/* Mobile: full-screen modal */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="md:hidden fixed inset-0 bg-white flex flex-col z-50"
      >
        <ChatHeader variant="mobile" onClose={toggleChatbot} />
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />
        <ChatQuickActions
          questions={SAMPLE_QUESTIONS}
          onAskQuestion={sendMessage}
          onClear={handleClearChat}
          isLoading={isLoading}
          hasMessages={messages.length > 0}
          variant="mobile"
        />
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          variant="mobile"
        />
      </motion.div>

      {/* Desktop: draggable floating window */}
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
        <ChatHeader
          variant="desktop"
          onClose={toggleChatbot}
          dragHandleProps={{
            onMouseDown: handleDragStart,
            onTouchStart: handleDragStart,
          }}
        />
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />
        <ChatQuickActions
          questions={SAMPLE_QUESTIONS}
          onAskQuestion={sendMessage}
          onClear={handleClearChat}
          isLoading={isLoading}
          hasMessages={messages.length > 0}
          variant="desktop"
        />
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          variant="desktop"
        />
      </motion.div>
    </>
  );
}
