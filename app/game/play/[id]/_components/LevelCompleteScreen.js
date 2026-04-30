'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';
import BottomNav from '../../../../../components/BottomNav';
import { deriveStarRating, passThreshold } from '../_lib/gameConfig';
import { getLevelDefinitions } from '../../../../../utils/generateQuestions';

export default function LevelCompleteScreen({
  levelId,
  questions,
  answeredQuestions,
  score,
  maxStreak,
  showReview,
  setShowReview,
  onPlayAgain,
}) {
  const totalQuestions = questions.length;
  const correctAnswers = answeredQuestions.filter((q) => q.isCorrect).length;
  const passed = correctAnswers >= passThreshold(totalQuestions);
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const isPerfect = correctAnswers === totalQuestions;
  const starCount = deriveStarRating({ correctAnswers, totalQuestions });

  const allLevels = getLevelDefinitions();
  const nextLevel = allLevels.find((l) => l.id === levelId + 1);

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 pb-20 relative'>
      <div className='pt-6 px-4 pb-20'>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='game-card p-6 max-w-lg mx-auto text-center'
        >
          <h2 className='text-2xl font-bold mb-2 text-purple-700'>
            {passed ? 'Mission Complete! 🎉' : 'Mission Incomplete 😢'}
          </h2>

          <div className='flex justify-center gap-1 mb-4'>
            {[1, 2, 3].map((star) => (
              <motion.div
                key={star}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3 + star * 0.2, type: 'spring', stiffness: 200 }}
              >
                <StarIcon
                  className={`w-10 h-10 ${star <= starCount ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              </motion.div>
            ))}
          </div>

          <div className='mb-4 bg-blue-50 rounded-lg p-4'>
            <h3 className='font-bold text-blue-700 mb-3'>Level Results</h3>
            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div className='bg-white rounded-lg p-2'>
                <div className='text-blue-500'>Score</div>
                <div className='font-bold text-purple-700 text-lg'>{score}</div>
              </div>
              <div className='bg-white rounded-lg p-2'>
                <div className='text-blue-500'>Accuracy</div>
                <div className='font-bold text-purple-700 text-lg'>{accuracy}%</div>
              </div>
              <div className='bg-white rounded-lg p-2'>
                <div className='text-blue-500'>Correct</div>
                <div className='font-bold text-purple-700 text-lg'>
                  {correctAnswers}/{totalQuestions}
                </div>
              </div>
              <div className='bg-white rounded-lg p-2'>
                <div className='text-blue-500'>Best Streak</div>
                <div className='font-bold text-purple-700 text-lg'>{maxStreak}🔥</div>
              </div>
            </div>
          </div>

          {answeredQuestions.length > 0 && (
            <button
              onClick={() => setShowReview(!showReview)}
              className='mb-4 text-sm font-medium text-blue-600 hover:text-blue-800 underline'
            >
              {showReview ? 'Hide Question Review' : `Review All Questions (${answeredQuestions.length})`}
            </button>
          )}

          <AnimatePresence>
            {showReview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mb-4 text-left space-y-3 max-h-80 overflow-y-auto'
              >
                {answeredQuestions.map((aq, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-2 text-sm ${
                      aq.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className='font-medium mb-1'>
                      {aq.isCorrect ? '✅' : '❌'} Q{idx + 1}: {aq.question}
                    </div>
                    {!aq.isCorrect && (
                      <div className='text-xs space-y-1'>
                        <div className='text-red-600'>Your answer: {aq.options[aq.selectedIndex]}</div>
                        <div className='text-green-600'>Correct: {aq.options[aq.correctIndex]}</div>
                      </div>
                    )}
                    {aq.explanation && (
                      <div className='text-xs text-gray-600 mt-1 italic'>{aq.explanation}</div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <p className='mb-4 text-blue-700 text-sm'>
            {passed
              ? isPerfect
                ? "Perfect score! You're a cybersecurity expert! 🏆"
                : "Great job protecting yourself online! You've earned cyber security points!"
              : "Don't worry! Learning about cyber security takes practice. Try again!"}
          </p>

          <div className='flex flex-col gap-3'>
            {passed && nextLevel && (
              <Link href={`/game/play/${nextLevel.id}`}>
                <button className='btn-primary w-full text-lg py-3'>
                  Next Level: {nextLevel.title} →
                </button>
              </Link>
            )}
            <div className='flex gap-3'>
              <button
                onClick={onPlayAgain}
                className={`${passed && nextLevel ? 'btn-secondary' : 'btn-primary'} flex-1`}
              >
                Play Again
              </button>
              <Link href='/game/levels' className='flex-1'>
                <button className='btn-secondary w-full'>Back to Levels</button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav activeTab='levels' />
    </div>
  );
}
