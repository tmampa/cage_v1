'use client';

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatbot } from '../context/ChatbotContext';

/**
 * Syncs authenticated user ID into the ChatbotContext
 * so chat messages can be persisted to Firestore.
 */
export default function ChatUserSync() {
  const { user } = useAuth();
  const { setUserId } = useChatbot();

  useEffect(() => {
    setUserId(user?.id ?? null);
  }, [user, setUserId]);

  return null;
}
