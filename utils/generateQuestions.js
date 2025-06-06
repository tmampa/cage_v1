// Question Generation System - No Fallback Questions
// This system generates all questions dynamically using AI (Gemini).
// Fallback questions have been intentionally removed to ensure all questions are unique and AI-generated.

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// Track pending requests to prevent duplicate API calls
const pendingRequests = {};

// Level definitions with their topics and difficulty
const levelDefinitions = [
  {
    id: 1,
    title: 'Cyber Security Basics',
    description: 'Learn the fundamentals of staying safe online',
    difficulty: 'Easy',
    topics: ['basic internet safety', 'digital citizenship', 'online privacy fundamentals'],
    questionsCount: 5,
    focusAreas: ['what is cyber security', 'basic online threats', 'digital footprints']
  },
  {
    id: 2,
    title: 'Password Protection',
    description: 'Create strong passwords and keep them safe',
    difficulty: 'Easy',
    topics: ['password strength', 'password managers', 'credential security', 'two-factor authentication'],
    questionsCount: 6,
    focusAreas: ['creating strong passwords', 'password storage', 'authentication methods']
  },
  {
    id: 3,
    title: 'Phishing Attacks',
    description: 'Identify and avoid dangerous emails and messages',
    difficulty: 'Medium',
    topics: ['phishing emails', 'suspicious links', 'social engineering tactics', 'email scams'],
    questionsCount: 7,
    focusAreas: ['recognizing phishing emails', 'suspicious website indicators', 'social engineering red flags']
  },
  {
    id: 4,
    title: 'Safe Web Browsing',
    description: 'Navigate the internet safely and avoid threats',
    difficulty: 'Medium',
    topics: ['browser security', 'safe websites', 'download safety', 'HTTPS protocols', 'URL verification'],
    questionsCount: 8,
    focusAreas: ['identifying secure websites', 'browser privacy settings', 'safe downloading practices', 'certificate verification', 'avoiding malicious websites']
  },
  {
    id: 5,
    title: 'Social Media Safety',
    description: 'Protect your personal information on social platforms',
    difficulty: 'Hard',
    topics: ['privacy settings', 'information sharing', 'social media scams', 'digital reputation', 'account security'],
    questionsCount: 9,
    focusAreas: ['configuring privacy settings', 'safe information sharing', 'recognizing social media scams', 'protecting personal data', 'managing digital footprint']
  },
  {
    id: 6,
    title: 'Malware Defense',
    description: 'Understand and protect against computer viruses',
    difficulty: 'Hard',
    topics: ['malware types', 'virus protection', 'infection prevention', 'antivirus software', 'system security'],
    questionsCount: 10,
    focusAreas: ['identifying malware types', 'antivirus best practices', 'system vulnerability protection', 'malware removal techniques', 'preventive security measures']
  },
];

/**
 * Generates a prompt for Gemini to create questions for a specific level
 * @param {Object} level - The level definition
 * @returns {string} - The prompt for Gemini
 */
function createPromptForLevel(level) {
  const difficulty = level.difficulty.toLowerCase();
  const topics = level.topics.join(', ');
  const focusAreas = level.focusAreas ? level.focusAreas.join(', ') : '';
  const count = level.questionsCount;
  const levelId = level.id;
  const levelTitle = level.title;

  return `
  You are creating questions for LEVEL ${levelId} ONLY: "${levelTitle}".
  
  CRITICAL: These questions must be COMPLETELY DIFFERENT from questions in other levels.
  
  Generate ${count} unique multiple-choice questions EXCLUSIVELY about ${topics}.
  ${focusAreas ? `SPECIFIC FOCUS AREAS: ${focusAreas}` : ''}
  
  LEVEL-SPECIFIC REQUIREMENTS:
  - Level 1 (Cyber Security Basics): Focus on general internet safety, basic security concepts
  - Level 2 (Password Protection): Focus ONLY on passwords, password managers, credential security
  - Level 3 (Phishing Attacks): Focus ONLY on phishing emails, suspicious links, social engineering
  - Level 4 (Safe Web Browsing): Focus ONLY on browser security, safe websites, download safety
  - Level 5 (Social Media Safety): Focus ONLY on privacy settings, information sharing, social media scams
  - Level 6 (Malware Defense): Focus ONLY on malware types, virus protection, infection prevention
  
  For Level ${levelId} ("${levelTitle}"), create questions that are:
  1. EXCLUSIVELY about ${topics}
  2. At ${difficulty} difficulty level
  3. NEVER overlap with content from other levels
  4. Completely unique and specific to this level's theme
  5. Include real-world scenarios related to ${topics}
  ${focusAreas ? `6. Must cover these specific areas: ${focusAreas}` : ''}
  
  STRICT REQUIREMENTS:
  - Make each question scenario-based and practical
  - Ensure correct answers are randomly distributed across A, B, C, D options
  - Include detailed explanations
  - NO generic cyber security questions - be specific to ${topics}
  ${focusAreas ? `- Each question should relate to one of these focus areas: ${focusAreas}` : ''}
  
  Format as JSON array:
  [
    {
      "question": "Specific scenario about ${topics}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0-3,
      "explanation": "Detailed explanation specific to ${topics}"
    }
  ]
  
  REMEMBER: This is Level ${levelId} about ${topics} ONLY. Do not include content from other levels.
  ${focusAreas ? `Focus specifically on: ${focusAreas}` : ''}
  `;
}

/**
 * Shuffles the options of a question and updates the correctIndex
 * @param {Object} question - The question object with options and correctIndex
 * @returns {Object} - Question with shuffled options and updated correctIndex
 */
function shuffleQuestionOptions(question) {
  // Create pairs of options and their indices
  const pairs = question.options.map((option, index) => ({
    option,
    isCorrect: index === question.correctIndex,
  }));

  // Shuffle the pairs
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  // Update the question object
  question.options = pairs.map((p) => p.option);
  question.correctIndex = pairs.findIndex((p) => p.isCorrect);

  return question;
}

/**
 * Generates questions for a specific level using Gemini
 * NOTE: Fallback questions have been intentionally removed from this system.
 * All questions are generated dynamically using AI to ensure uniqueness and quality.
 * @param {number} levelId - The level ID
 * @returns {Promise<Array>} - Array of question objects
 */
export async function generateQuestionsForLevel(levelId) {
  try {
    const cacheKey = `level_${levelId}_${Date.now()}`; // Add timestamp for uniqueness

    console.log(`Generating fresh questions for level ${levelId}`);

    // Check if there's already a pending request for this level
    if (pendingRequests[cacheKey]) {
      console.log(`Using existing pending request for level ${levelId}`);
      return pendingRequests[cacheKey];
    }

    const level = levelDefinitions.find((l) => l.id === parseInt(levelId));

    if (!level) {
      throw new Error(`Level with ID ${levelId} not found`);
    }

    // Check if the API key is available
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.warn('Gemini API key not found. Cannot generate questions.');
      throw new Error('Gemini API key not configured - no fallback questions available');
    }

    // Create a promise for this request and store it
    pendingRequests[cacheKey] = (async () => {
      try {
        const prompt = createPromptForLevel(level);

        // Add more randomization to the model config
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: {
            temperature: 0.9, // Increase for more randomness
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log(
          `Received response from Gemini for level ${levelId}, length: ${text.length}`
        );

        // Clean the response if it contains markdown code blocks
        let cleanedText = text;

        // Remove markdown code block syntax if present
        if (text.includes('```json')) {
          cleanedText = text.replace(/```json\n|\n```/g, '');
        } else if (text.includes('```')) {
          cleanedText = text.replace(/```\n|\n```/g, '');
        }

        // Trim any whitespace
        cleanedText = cleanedText.trim();

        // Try to parse the JSON response
        let questions;
        try {
          questions = JSON.parse(cleanedText);
        } catch (jsonError) {
          console.error(`JSON parse error for level ${levelId}:`, jsonError);
          console.log('Raw response:', text);
          throw new Error(`Failed to parse AI response for level ${levelId} - no fallback questions available`);
        }

        // Validate questions structure
        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error(`Invalid questions format for level ${levelId} - no fallback available`);
        }

        // Ensure we have the expected number of questions
        if (questions.length < level.questionsCount) {
          throw new Error(`Insufficient questions generated for level ${levelId}. Expected ${level.questionsCount}, got ${questions.length} - no fallback available`);
        }

        // Shuffle the options for each question to further randomize correct answers
        const shuffledQuestions = questions.map((q) =>
          shuffleQuestionOptions(q)
        );

        // Add level ID to each question
        const finalQuestions = shuffledQuestions.map((q) => ({
          ...q,
          levelId: parseInt(levelId),
        }));

        // Validate question uniqueness and level-specificity
        const validationResult = validateQuestionUniqueness(finalQuestions, levelId);
        
        // Log validation results
        if (!validationResult.validation.unique) {
          console.warn(`Level ${levelId}: Questions are not unique!`);
        }
        if (!validationResult.validation.levelSpecific) {
          console.warn(`Level ${levelId}: Questions may not be level-specific enough!`);
        }
        if (!validationResult.validation.lowGeneric) {
          console.warn(`Level ${levelId}: Too many generic questions detected!`);
        }

        console.log(`Successfully generated ${validationResult.questions.length} questions for level ${levelId}`);
        
        return JSON.parse(JSON.stringify(validationResult.questions));
      } catch (e) {
        console.error(`Error generating questions for level ${levelId}:`, e);
        // No fallback questions - fail immediately
        throw new Error(`Question generation failed for level ${levelId}: ${e.message}. No fallback questions available.`);
      } finally {
        delete pendingRequests[cacheKey];
      }
    })();

    return pendingRequests[cacheKey];
  } catch (error) {
    console.error(`Error in question generation flow for level ${levelId}:`, error);
    // No fallback system - propagate error immediately
    throw new Error(`Question generation failed for level ${levelId}: ${error.message}. No fallback questions available.`);
  }
}

/**
 * Generate questions for all levels
 * @returns {Promise<Object>} - Object with level IDs as keys and question arrays as values
 */
export async function generateAllLevelQuestions() {
  const allQuestions = {};

  // Process levels sequentially to avoid overwhelming the API
  for (const level of levelDefinitions) {
    try {
      const questions = await generateQuestionsForLevel(level.id);
      allQuestions[level.id] = questions;
      console.log(
        `Generated ${questions.length} questions for level ${level.id}`
      );

      // Add a small delay between requests to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(
        `Failed to generate questions for level ${level.id}:`,
        error
      );
      // No fallback - let the error propagate
      throw new Error(`Question generation failed for level ${level.id}: ${error.message}`);
    }
  }

  return allQuestions;
}

/**
 * Utility function to get level definitions
 * @returns {Array} - Array of level definitions
 */
export function getLevelDefinitions() {
  return levelDefinitions;
}

// Enhanced validation function to prevent duplicate questions and ensure level-specific content
function validateQuestionUniqueness(questions, levelId) {
  const questionTexts = questions.map(q => q.question.toLowerCase());
  const uniqueQuestions = new Set(questionTexts);
  
  if (uniqueQuestions.size < questions.length) {
    console.warn(`Level ${levelId} has duplicate questions`);
  }
  
  // Level-specific keywords that should appear in questions
  const levelKeywords = {
    1: ['basic', 'fundamental', 'digital citizenship', 'privacy', 'footprint'],
    2: ['password', 'credential', 'authentication', 'two-factor', 'manager'],
    3: ['phishing', 'email', 'suspicious', 'link', 'social engineering', 'scam'],
    4: ['browser', 'website', 'download', 'https', 'certificate', 'url'],
    5: ['social media', 'privacy setting', 'sharing', 'profile', 'facebook', 'twitter'],
    6: ['malware', 'virus', 'antivirus', 'trojan', 'worm', 'infection', 'software']
  };
  
  // Check for generic terms that indicate non-specific questions
  const genericTerms = ['cyber security', 'online safety', 'internet safety', 'security threat'];
  
  // Validate level-specific content
  const requiredKeywords = levelKeywords[levelId] || [];
  let levelSpecificCount = 0;
  let genericCount = 0;
  
  questions.forEach((q, index) => {
    const questionLower = q.question.toLowerCase();
    
    // Check if question contains level-specific keywords
    const hasLevelKeywords = requiredKeywords.some(keyword => 
      questionLower.includes(keyword.toLowerCase())
    );
    
    // Check if question contains generic terms
    const hasGenericTerms = genericTerms.some(term => 
      questionLower.includes(term.toLowerCase())
    );
    
    if (hasLevelKeywords) levelSpecificCount++;
    if (hasGenericTerms) genericCount++;
    
    // Log questionable questions
    if (!hasLevelKeywords && levelId > 1) {
      console.warn(`Level ${levelId} Question ${index + 1} may not be level-specific: "${q.question}"`);
    }
  });
  
  console.log(`Level ${levelId} validation:`, {
    uniqueQuestions: uniqueQuestions.size,
    totalQuestions: questions.length,
    levelSpecific: levelSpecificCount,
    generic: genericCount,
    specificity: `${Math.round((levelSpecificCount / questions.length) * 100)}%`
  });
  
  // Return validation results
  return {
    questions,
    validation: {
      unique: uniqueQuestions.size === questions.length,
      levelSpecific: levelSpecificCount >= questions.length * 0.7, // At least 70% should be level-specific
      lowGeneric: genericCount <= questions.length * 0.2 // Less than 20% should be generic
    }
  };
  
  return questions;
}
