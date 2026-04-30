'use client';

import { motion } from 'framer-motion';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

/**
 * Floating action button that opens the chatbot. Pulses, shimmers, and
 * displays an unread count badge.
 */
export default function ChatLauncher({ onOpen, unreadCount }) {
  return (
    <div className="fixed z-50" style={{ bottom: '100px', right: '20px' }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
          width: '80px',
          height: '80px',
          left: '-8px',
          top: '-8px',
        }}
      />

      <motion.button
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        onClick={onOpen}
        className="relative w-[64px] h-[64px] rounded-full flex items-center justify-center group"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F59E0B 100%)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        }}
        whileHover={{
          scale: 1.1,
          rotate: [0, -10, 10, -10, 0],
          transition: { rotate: { duration: 0.5 } },
        }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        <motion.div
          className="relative z-10"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-white filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
        </motion.div>

        <motion.div
          className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-white rounded-full"
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />

        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{
              rotate: { duration: 0.5, repeat: Infinity, repeatDelay: 2 },
            }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
