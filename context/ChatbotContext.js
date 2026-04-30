'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ChatbotContext = createContext({});

export const useChatbot = () => useContext(ChatbotContext);

const STORAGE_KEYS = {
  CHAT_HISTORY: 'cage_chat_history',
  CHAT_SESSION_ID: 'cage_chat_session_id',
  WIDGET_STATE: 'cage_widget_state',
  WIDGET_POSITION: 'cage_widget_position',
};

const MAX_HISTORY_EXCHANGES = 20;

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChatbotProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [unreadCount, setUnreadCount] = useState(0);
  // User identity is attached server-side from the auth cookie.
  const setUserId = useCallback(() => {}, []);

  useEffect(() => {
    try {
      const savedHistory = sessionStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed.messages || []);
      }

      let savedSessionId = sessionStorage.getItem(STORAGE_KEYS.CHAT_SESSION_ID);
      if (!savedSessionId) {
        savedSessionId = createSessionId();
        sessionStorage.setItem(STORAGE_KEYS.CHAT_SESSION_ID, savedSessionId);
      }
      setSessionId(savedSessionId);

      const savedWidgetState = sessionStorage.getItem(STORAGE_KEYS.WIDGET_STATE);
      if (savedWidgetState) {
        const parsed = JSON.parse(savedWidgetState);
        setIsOpen(parsed.isOpen || false);
      }

      const savedPosition = localStorage.getItem(STORAGE_KEYS.WIDGET_POSITION);
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition));
      }
    } catch (error) {
      console.error('Error loading chatbot state from storage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      if (messages.length > 0) {
        sessionStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify({
          messages,
          lastUpdated: new Date().toISOString(),
        }));
      }
    } catch { /* ignore */ }
  }, [messages]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.WIDGET_STATE, JSON.stringify({ isOpen }));
    } catch { /* ignore */ }
  }, [isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WIDGET_POSITION, JSON.stringify(position));
    } catch { /* ignore */ }
  }, [position]);

  const trimMessageHistory = useCallback((messageList) => {
    const maxMessages = MAX_HISTORY_EXCHANGES * 2;
    return messageList.length > maxMessages ? messageList.slice(-maxMessages) : messageList;
  }, []);

  const ensureSessionId = useCallback(() => {
    if (sessionId) return sessionId;

    const nextSessionId = createSessionId();
    setSessionId(nextSessionId);
    try {
      sessionStorage.setItem(STORAGE_KEYS.CHAT_SESSION_ID, nextSessionId);
    } catch { /* ignore */ }
    return nextSessionId;
  }, [sessionId]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    const currentSessionId = ensureSessionId();

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => trimMessageHistory([...prev, assistantMessage]));

      if (!isOpen) setUnreadCount((prev) => prev + 1);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isOpen, trimMessageHistory, ensureSessionId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
    const nextSessionId = createSessionId();
    setSessionId(nextSessionId);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
      sessionStorage.setItem(STORAGE_KEYS.CHAT_SESSION_ID, nextSessionId);
    } catch { /* ignore */ }
  }, []);

  const toggleChatbot = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  const updatePosition = useCallback((x, y) => setPosition({ x, y }), []);

  const value = {
    messages, sessionId, isOpen, isLoading, position, unreadCount,
    sendMessage, clearChat, toggleChatbot, updatePosition, setUserId,
  };

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}
