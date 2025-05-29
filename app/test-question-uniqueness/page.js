'use client';

import { useState } from 'react';
import { generateQuestionsForLevel } from '../../utils/generateQuestions.js';

export default function TestQuestionUniqueness() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);

  const testQuestionUniqueness = async () => {
    setIsLoading(true);
    setCurrentLevel(0);
    
    const allQuestions = {};
    const allQuestionTexts = new Set();
    const levelResults = {};
    const logs = [];
    
    logs.push('🧪 Testing Question Uniqueness Across Levels\n');
    
    // Generate questions for all levels
    for (let levelId = 1; levelId <= 6; levelId++) {
      setCurrentLevel(levelId);
      
      try {
        logs.push(`\n📚 Testing Level ${levelId}...`);
        const questions = await generateQuestionsForLevel(levelId);
        
        allQuestions[levelId] = questions;
        levelResults[levelId] = {
          count: questions.length,
          unique: true,
          levelSpecific: true
        };
        
        // Check for duplicates within this level
        const levelTexts = questions.map(q => q.question.toLowerCase());
        const uniqueLevelTexts = new Set(levelTexts);
        
        if (uniqueLevelTexts.size < questions.length) {
          logs.push(`❌ Level ${levelId} has internal duplicates!`);
          levelResults[levelId].unique = false;
        } else {
          logs.push(`✅ Level ${levelId} has ${questions.length} unique questions`);
        }
        
        // Add to global question set to check cross-level duplicates
        questions.forEach(q => {
          const questionText = q.question.toLowerCase();
          if (allQuestionTexts.has(questionText)) {
            logs.push(`❌ Duplicate question found across levels: "${q.question}"`);
            levelResults[levelId].unique = false;
          } else {
            allQuestionTexts.add(questionText);
          }
        });
        
      } catch (error) {
        logs.push(`❌ Failed to generate questions for level ${levelId}: ${error.message}`);
        levelResults[levelId] = { error: error.message };
      }
    }
    
    // Cross-level analysis
    logs.push('\n📊 Cross-Level Analysis:');
    logs.push('═'.repeat(50));
    
    for (let level1 = 1; level1 <= 6; level1++) {
      if (!allQuestions[level1]) continue;
      
      for (let level2 = level1 + 1; level2 <= 6; level2++) {
        if (!allQuestions[level2]) continue;
        
        const questions1 = allQuestions[level1].map(q => q.question.toLowerCase());
        const questions2 = allQuestions[level2].map(q => q.question.toLowerCase());
        
        const overlaps = questions1.filter(q1 => 
          questions2.some(q2 => 
            q1.includes(q2.substring(0, 20)) || q2.includes(q1.substring(0, 20))
          )
        );
        
        if (overlaps.length > 0) {
          logs.push(`❌ Potential overlap between Level ${level1} and ${level2}: ${overlaps.length} similar questions`);
        } else {
          logs.push(`✅ Level ${level1} and ${level2}: No overlap detected`);
        }
      }
    }
    
    // Summary report
    logs.push('\n📋 Summary Report:');
    logs.push('═'.repeat(50));
    
    let totalQuestions = 0;
    let successfulLevels = 0;
    
    for (let levelId = 1; levelId <= 6; levelId++) {
      const result = levelResults[levelId];
      
      if (result.error) {
        logs.push(`Level ${levelId}: ❌ ERROR - ${result.error}`);
      } else {
        totalQuestions += result.count;
        successfulLevels++;
        
        const status = result.unique && result.levelSpecific ? '✅' : '⚠️';
        logs.push(`Level ${levelId}: ${status} ${result.count} questions (Unique: ${result.unique ? 'Yes' : 'No'})`);
      }
    }
    
    logs.push(`\nTotal Questions Generated: ${totalQuestions}`);
    logs.push(`Unique Questions: ${allQuestionTexts.size}`);
    logs.push(`Duplication Rate: ${((totalQuestions - allQuestionTexts.size) / totalQuestions * 100).toFixed(1)}%`);
    logs.push(`Success Rate: ${successfulLevels}/6 levels`);
    
    if (allQuestionTexts.size === totalQuestions && successfulLevels === 6) {
      logs.push('\n🎉 SUCCESS: All questions are unique across all levels!');
    } else {
      logs.push('\n⚠️  ISSUES DETECTED: Review the warnings above');
    }
    
    setResults({
      logs,
      allQuestions,
      levelResults,
      totalQuestions,
      uniqueQuestions: allQuestionTexts.size,
      successfulLevels
    });
    
    setIsLoading(false);
    setCurrentLevel(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Question Uniqueness Test
          </h1>
          
          <div className="mb-6">
            <button
              onClick={testQuestionUniqueness}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : 'Run Uniqueness Test'}
            </button>
            
            {isLoading && (
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">
                    {currentLevel > 0 ? `Testing Level ${currentLevel}...` : 'Initializing...'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentLevel / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          {results && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-3">Test Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.uniqueQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Unique Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {((results.totalQuestions - results.uniqueQuestions) / results.totalQuestions * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Duplication Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {results.successfulLevels}/6
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>
              
              {/* Detailed Results */}
              <div className="bg-gray-100 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-3">Detailed Results</h2>
                <div className="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
                  {results.logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </div>
              
              {/* Question Preview */}
              {results.allQuestions && Object.keys(results.allQuestions).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h2 className="text-xl font-semibold mb-3">Sample Questions by Level</h2>
                  <div className="space-y-4">
                    {Object.entries(results.allQuestions).map(([levelId, questions]) => (
                      <div key={levelId} className="border rounded p-3">
                        <h3 className="font-semibold text-lg mb-2">Level {levelId} ({questions.length} questions)</h3>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {questions.slice(0, 3).map((q, index) => (
                            <div key={index} className="text-sm text-gray-700 p-2 bg-white rounded">
                              {q.question}
                            </div>
                          ))}
                          {questions.length > 3 && (
                            <div className="text-sm text-gray-500 italic">
                              ... and {questions.length - 3} more questions
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
