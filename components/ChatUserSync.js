'use client';

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatbot } from '../context/ChatbotContext';

/**
 * Keeps the chatbot provider compatible with auth changes.
 * Chat persistence now attaches users server-side from the session cookie.
 */
export default function ChatUserSync() {
  const { user } = useAuth();
  const { setUserId } = useChatbot();

  useEffect(() => {
    setUserId(user?.id ?? null);
  }, [user, setUserId]);

  return null;
}
