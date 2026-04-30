'use client';

import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

/**
 * Scrollable message list with empty-state and typing-indicator handling.
 * The consumer passes `messagesEndRef` so it can keep the latest message
 * scrolled into view from outside.
 */
export default function ChatMessageList({ messages, isLoading, messagesEndRef }) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <ChatBubbleLeftRightIcon className="w-16 h-16 text-blue-300 mb-4" />
          <h4 className="text-lg font-bold text-gray-700 mb-2">
            Welcome to CagE Assistant! 👋
          </h4>
          <p className="text-gray-600 text-sm">
            I&apos;m here to help you learn cybersecurity. Ask me anything or use the quick actions below!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
