'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import BottomNav from '../../../../../components/BottomNav';

export default function GameOverScreen({
  score,
  currentQuestionIndex,
  totalQuestions,
  onPlayAgain,
}) {
  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 pb-20 relative'>
      <div className='pt-6 px-4 pb-20'>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='game-card p-6 max-w-lg mx-auto text-center'
        >
          <h2 className='text-2xl font-bold mb-4 text-purple-700'>Game Over!</h2>

          <div className='mb-6 bg-blue-50 rounded-lg p-4'>
            <h3 className='font-bold text-blue-700 mb-3'>Your Results</h3>
            <div className='flex justify-between mb-2'>
              <span className='text-blue-600'>Score:</span>
              <span className='font-bold text-purple-700'>{score} points</span>
            </div>
            <div className='flex justify-between mb-2'>
              <span className='text-blue-600'>Questions Completed:</span>
              <span className='font-bold text-purple-700'>
                {currentQuestionIndex} / {totalQuestions}
              </span>
            </div>
          </div>

          <p className='mb-6 text-blue-700'>
            Don&apos;t worry! Learning about cyber security takes practice. Try again!
          </p>

          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <button onClick={onPlayAgain} className='btn-primary w-full'>
              Play Again
            </button>
            <Link href='/game/levels'>
              <button className='btn-secondary w-full'>Back to Levels</button>
            </Link>
          </div>
        </motion.div>
      </div>

      <BottomNav activeTab='levels' />
    </div>
  );
}
