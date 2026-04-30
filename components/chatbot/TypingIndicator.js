'use client';

import { motion } from 'framer-motion';

/**
 * Three-dot bouncing indicator shown while the assistant is generating a reply.
 */
export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start"
    >
      <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-200">
        <div className="flex gap-1.5 items-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0, ease: 'easeInOut' }}
            className="w-2.5 h-2.5 bg-blue-400 rounded-full"
          />
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }}
            className="w-2.5 h-2.5 bg-blue-400 rounded-full"
          />
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }}
            className="w-2.5 h-2.5 bg-blue-400 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
