'use client';

import { TrashIcon } from '@heroicons/react/24/solid';

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

/**
 * Row of preset prompts plus a "Clear" button. The mobile variant adds a small
 * `pb-2` for thumb-friendly scrolling; the desktop variant is tighter.
 */
export default function ChatQuickActions({
  questions,
  onAskQuestion,
  onClear,
  isLoading,
  hasMessages,
  variant = 'desktop',
}) {
  const isMobile = variant === 'mobile';
  return (
    <div className="px-4 py-2 bg-white border-t border-gray-200">
      <div className={`flex gap-2 overflow-x-auto ${isMobile ? 'pb-2' : ''}`}>
        {questions.map((question, index) => (
          <SampleQuestionButton
            key={index}
            label={question}
            onClick={() => onAskQuestion(question)}
            disabled={isLoading}
          />
        ))}
        <QuickActionButton
          icon={TrashIcon}
          label="Clear"
          onClick={onClear}
          disabled={isLoading || !hasMessages}
        />
      </div>
    </div>
  );
}
