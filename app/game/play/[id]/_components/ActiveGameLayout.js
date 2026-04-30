'use client';

import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import GameStats from '../../../../../components/GameStats';
import EnhancedQuestionCard from '../../../../../components/EnhancedQuestionCard';
import HintSystem from '../../../../../components/HintSystem';
import AnswerFeedback from '../../../../../components/AnswerFeedback';
import AchievementNotification from '../../../../../components/AchievementNotification';
import BottomNav from '../../../../../components/BottomNav';
import { computePoints, getCorrectIndex } from '../_lib/gameConfig';

/**
 * Pure presentational layer for the in-progress game view.
 * Receives all gameplay state and handlers as props from the page.
 */
export default function ActiveGameLayout({
  level,
  levelId,
  questions,
  currentQuestionIndex,
  currentQuestion,
  selectedAnswer,
  showExplanation,
  isAnswerCorrect,
  score,
  lives,
  timeLeft,
  hintsRemaining,
  currentStreak,
  newAchievement,
  onAchievementClose,
  onAnswerSelect,
  onHintUsed,
  onNextQuestion,
}) {
  const pointsForCorrect = isAnswerCorrect ? computePoints(level, timeLeft) : 0;

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 pb-20 relative'>
      {newAchievement && (
        <AchievementNotification achievement={newAchievement} onClose={onAchievementClose} />
      )}

      <div className='bubble w-20 h-20 top-20 left-10' />
      <div className='bubble w-16 h-16 top-40 right-10' />
      <div className='bubble w-24 h-24 bottom-20 left-1/3' />
      <div className='bubble w-12 h-12 top-1/3 right-20' />

      <div className='container mx-auto p-4 pb-24'>
        <div className='flex justify-between items-center mb-4'>
          <Link
            href='/game/levels'
            className='flex items-center text-blue-700 hover:text-blue-900 transition-colors'
          >
            <ArrowLeftIcon className='w-5 h-5 mr-1' />
            <span className='font-medium'>Exit Level</span>
          </Link>
          <div className='text-center'>
            <h2 className='text-lg font-bold text-purple-700'>
              Level {levelId}: {level?.title}
            </h2>
          </div>
          <div className='w-20' />
        </div>

        <div className='mb-6'>
          <GameStats
            score={score}
            lives={lives}
            maxLives={3}
            timeLeft={timeLeft}
            hintsRemaining={hintsRemaining}
            streak={currentStreak}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            compact
          />
        </div>

        <AnimatePresence mode='wait'>
          <div key={`question-${currentQuestionIndex}`}>
            <EnhancedQuestionCard
              question={currentQuestion?.question}
              options={currentQuestion?.options || []}
              selectedAnswer={selectedAnswer}
              correctAnswer={getCorrectIndex(currentQuestion)}
              showExplanation={showExplanation}
              onAnswerSelect={onAnswerSelect}
              disabled={showExplanation}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />

            {!showExplanation && (
              <div className='mt-4'>
                <HintSystem
                  question={currentQuestion}
                  onHintUsed={onHintUsed}
                  hintsRemaining={hintsRemaining}
                  disabled={showExplanation || selectedAnswer !== null}
                />
              </div>
            )}

            <AnswerFeedback
              isCorrect={isAnswerCorrect}
              explanation={currentQuestion?.explanation}
              streak={currentStreak}
              points={pointsForCorrect}
              isVisible={showExplanation}
              onNext={onNextQuestion}
            />
          </div>
        </AnimatePresence>
      </div>

      <BottomNav activeTab='levels' />
    </div>
  );
}
