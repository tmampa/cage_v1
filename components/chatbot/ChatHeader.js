'use client';

import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/solid';

/**
 * Branded header for both the mobile (full-screen) and desktop (floating) chat
 * variants. The desktop variant doubles as the drag handle — the consumer wires
 * up `dragHandleProps` to the outer element when `variant === 'desktop'`.
 */
export default function ChatHeader({ variant = 'desktop', onClose, dragHandleProps }) {
  const isDesktop = variant === 'desktop';

  const containerClass = isDesktop
    ? 'drag-handle bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex items-center justify-between cursor-grab active:cursor-grabbing select-none'
    : 'bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex items-center justify-between shadow-md';

  return (
    <div className={containerClass} {...(isDesktop ? dragHandleProps : {})}>
      <div className={`flex items-center gap-2 ${isDesktop ? 'pointer-events-none' : ''}`}>
        <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
        <h3 className="text-white font-bold text-lg">CagE Assistant</h3>
      </div>
      <button
        onClick={onClose}
        className={`text-white hover:bg-white/20 rounded-full ${isDesktop ? 'p-1 pointer-events-auto' : 'p-2'} transition-colors`}
        aria-label="Close chat"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>
    </div>
  );
}
