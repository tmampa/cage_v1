'use client';

import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

/**
 * Text input + send button for the chat. Variants tune padding/font size so the
 * mobile pane has a larger thumb target while desktop stays compact.
 */
export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  variant = 'desktop',
}) {
  const isMobile = variant === 'mobile';
  const inputClass = isMobile
    ? 'flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
    : 'flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm';
  const buttonClass = isMobile
    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed'
    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-full hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <form onSubmit={onSubmit} className="p-4 bg-white border-t border-gray-200">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className={inputClass}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className={buttonClass}
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
