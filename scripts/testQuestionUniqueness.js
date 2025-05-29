#!/usr/bin/env node

// Test script to verify question uniqueness across levels
// Run with: node scripts/testQuestionUniqueness.js

const { generateQuestionsForLevel } = require('../utils/generateQuestions.js');

async function testQuestionUniqueness() {
  console.log('🧪 Testing Question Uniqueness Across Levels\n');
  
  const allQuestions = {};
  const allQuestionTexts = new Set();
  const levelResults = {};
  
  // Generate questions for all levels
  for (let levelId = 1; levelId <= 6; levelId++) {
    try {
      console.log(`\n📚 Testing Level ${levelId}...`);
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
        console.warn(`❌ Level ${levelId} has internal duplicates!`);
        levelResults[levelId].unique = false;
      } else {
        console.log(`✅ Level ${levelId} has ${questions.length} unique questions`);
      }
      
      // Add to global question set to check cross-level duplicates
      questions.forEach(q => {
        const questionText = q.question.toLowerCase();
        if (allQuestionTexts.has(questionText)) {
          console.warn(`❌ Duplicate question found across levels: "${q.question}"`);
          levelResults[levelId].unique = false;
        } else {
          allQuestionTexts.add(questionText);
        }
      });
      
    } catch (error) {
      console.error(`❌ Failed to generate questions for level ${levelId}:`, error.message);
      levelResults[levelId] = { error: error.message };
    }
  }
  
  // Cross-level analysis
  console.log('\n📊 Cross-Level Analysis:');
  console.log('═'.repeat(50));
  
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
        console.warn(`❌ Potential overlap between Level ${level1} and ${level2}: ${overlaps.length} similar questions`);
      } else {
        console.log(`✅ Level ${level1} and ${level2}: No overlap detected`);
      }
    }
  }
  
  // Summary report
  console.log('\n📋 Summary Report:');
  console.log('═'.repeat(50));
  
  let totalQuestions = 0;
  let successfulLevels = 0;
  
  for (let levelId = 1; levelId <= 6; levelId++) {
    const result = levelResults[levelId];
    
    if (result.error) {
      console.log(`Level ${levelId}: ❌ ERROR - ${result.error}`);
    } else {
      totalQuestions += result.count;
      successfulLevels++;
      
      const status = result.unique && result.levelSpecific ? '✅' : '⚠️';
      console.log(`Level ${levelId}: ${status} ${result.count} questions (Unique: ${result.unique ? 'Yes' : 'No'})`);
    }
  }
  
  console.log(`\nTotal Questions Generated: ${totalQuestions}`);
  console.log(`Unique Questions: ${allQuestionTexts.size}`);
  console.log(`Duplication Rate: ${((totalQuestions - allQuestionTexts.size) / totalQuestions * 100).toFixed(1)}%`);
  console.log(`Success Rate: ${successfulLevels}/6 levels`);
  
  if (allQuestionTexts.size === totalQuestions && successfulLevels === 6) {
    console.log('\n🎉 SUCCESS: All questions are unique across all levels!');
  } else {
    console.log('\n⚠️  ISSUES DETECTED: Review the warnings above');
  }
}

// Run the test
if (require.main === module) {
  testQuestionUniqueness().catch(console.error);
}

module.exports = { testQuestionUniqueness };
