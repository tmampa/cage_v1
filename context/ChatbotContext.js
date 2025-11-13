'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Create the chatbot context
const ChatbotContext = createContext({});

// Custom hook to use the chatbot context
export const useChatbot = () => {
  return useContext(ChatbotContext);
};

// Session storage keys
const STORAGE_KEYS = {
  CHAT_HISTORY: 'cage_chat_history',
  WIDGET_STATE: 'cage_widget_state',
  WIDGET_POSITION: 'cage_widget_position',
};

// Maximum number of message exchanges to keep in history
const MAX_HISTORY_EXCHANGES = 20;

// Provider component that wraps the app and makes chatbot available
export function ChatbotProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [gameContext, setGameContext] = useState({
    currentPage: 'home',
    levelId: null,
    levelTitle: null,
    levelDescription: null,
    questionText: null,
    questionNumber: null,
    totalQuestions: null,
    userProgress: null,
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // Load chat history and widget state from session storage on mount
  useEffect(() => {
    try {
      // Load chat history
      const savedHistory = sessionStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed.messages || []);
      }

      // Load widget state
      const savedWidgetState = sessionStorage.getItem(STORAGE_KEYS.WIDGET_STATE);
      if (savedWidgetState) {
        const parsed = JSON.parse(savedWidgetState);
        setIsOpen(parsed.isOpen || false);
      }

      // Load widget position from localStorage (persists across sessions)
      const savedPosition = localStorage.getItem(STORAGE_KEYS.WIDGET_POSITION);
      if (savedPosition) {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      }
    } catch (error) {
      console.error('Error loading chatbot state from storage:', error);
    }
  }, []);

  // Save chat history to session storage whenever messages change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        const historyData = {
          messages,
          lastUpdated: new Date().toISOString(),
          sessionId: Date.now().toString(),
        };
        sessionStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(historyData));
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [messages]);

  // Save widget state to session storage
  useEffect(() => {
    try {
      const widgetState = { isOpen };
      sessionStorage.setItem(STORAGE_KEYS.WIDGET_STATE, JSON.stringify(widgetState));
    } catch (error) {
      console.error('Error saving widget state:', error);
    }
  }, [isOpen]);

  // Save widget position to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WIDGET_POSITION, JSON.stringify(position));
    } catch (error) {
      console.error('Error saving widget position:', error);
    }
  }, [position]);

  // Trim message history to keep only the most recent exchanges
  const trimMessageHistory = useCallback((messageList) => {
    // Keep only the most recent MAX_HISTORY_EXCHANGES * 2 messages
    // (each exchange is 2 messages: user + assistant)
    const maxMessages = MAX_HISTORY_EXCHANGES * 2;
    if (messageList.length > maxMessages) {
      return messageList.slice(-maxMessages);
    }
    return messageList;
  }, []);

  // Send a message to the chatbot
  const sendMessage = useCallback(async (text, action = 'chat') => {
    if (!text.trim()) return;

    // Create user message
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    // Add user message to state
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory,
          gameContext,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Create assistant message
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      // Add assistant message and trim history
      setMessages((prev) => trimMessageHistory([...prev, assistantMessage]));

      // Increment unread count if widget is closed
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, gameContext, isOpen, trimMessageHistory]);

  // Get a hint for the current question
  const getHint = useCallback(async () => {
    const hintRequest = gameContext.questionText
      ? `Can you give me a hint for this question?`
      : `Can you give me a hint?`;
    
    await sendMessage(hintRequest, 'hint');
  }, [gameContext.questionText, sendMessage]);

  // Get an explanation of the current concept
  const explainConcept = useCallback(async () => {
    const explainRequest = gameContext.levelTitle
      ? `Can you explain the concept of ${gameContext.levelTitle}?`
      : `Can you explain the current concept?`;
    
    await sendMessage(explainRequest, 'explain');
  }, [gameContext.levelTitle, sendMessage]);

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }, []);

  // Update game context
  const updateGameContext = useCallback((newContext) => {
    setGameContext((prev) => ({
      ...prev,
      ...newContext,
    }));
  }, []);

  // Toggle chatbot open/closed state
  const toggleChatbot = useCallback(() => {
    setIsOpen((prev) => {
      const newState = !prev;
      // Reset unread count when opening
      if (newState) {
        setUnreadCount(0);
      }
      return newState;
    });
  }, []);

  // Update widget position
  const updatePosition = useCallback((x, y) => {
    setPosition({ x, y });
  }, []);

  // The value that will be supplied to any consuming components
  const value = {
    messages,
    isOpen,
    isLoading,
    position,
    gameContext,
    unreadCount,
    sendMessage,
    getHint,
    explainConcept,
    clearChat,
    updateGameContext,
    toggleChatbot,
    updatePosition,
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
}
