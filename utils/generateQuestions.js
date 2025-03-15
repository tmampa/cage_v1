import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with your API key
// Note: In production, this should be stored in an environment variable
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// Simple in-memory cache for generated questions to reduce API calls
const questionsCache = {};

// Level definitions with their topics and difficulty
const levelDefinitions = [
  {
    id: 1,
    title: 'Cyber Security Basics',
    description: 'Learn the fundamentals of staying safe online',
    difficulty: 'Easy',
    topics: ['internet safety', 'basic security concepts', 'online threats'],
    questionsCount: 5,
  },
  {
    id: 2,
    title: 'Password Protection',
    description: 'Create strong passwords and keep them safe',
    difficulty: 'Easy',
    topics: ['password strength', 'password managers', 'credential security'],
    questionsCount: 6,
  },
  {
    id: 3,
    title: 'Phishing Attacks',
    description: 'Identify and avoid dangerous emails and messages',
    difficulty: 'Medium',
    topics: ['phishing emails', 'social engineering', 'suspicious links'],
    questionsCount: 7,
  },
  {
    id: 4,
    title: 'Safe Web Browsing',
    description: 'Navigate the internet safely and avoid threats',
    difficulty: 'Medium',
    topics: ['browser security', 'safe websites', 'download safety'],
    questionsCount: 8,
  },
  {
    id: 5,
    title: 'Social Media Safety',
    description: 'Protect your personal information on social platforms',
    difficulty: 'Hard',
    topics: ['privacy settings', 'information sharing', 'social media scams'],
    questionsCount: 9,
  },
  {
    id: 6,
    title: 'Malware Defense',
    description: 'Understand and protect against computer viruses',
    difficulty: 'Hard',
    topics: ['malware types', 'virus protection', 'infection prevention'],
    questionsCount: 10,
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
  const count = level.questionsCount;

  return `
  Generate ${count} multiple-choice questions about ${topics} for everyone learning about cyber security.
  
  These questions should be at a ${difficulty} difficulty level suitable for everyone.
  
  For each question:
  1. Make the language simple and friendly
  2. Provide one correct answer and three incorrect answers
  3. Include a brief explanation why the correct answer is right
  4. The incorrect answers should be plausible but clearly wrong
  5. Keep the questions practical and relevant to everyone's everyday online activities
  6. IMPORTANT: Randomize which option (A, B, C, or D) is the correct answer for each question
  7. DO NOT make the first option (A) the correct answer for most or all questions
  
  Format your response as a JSON array of objects with the following structure:
  [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,  // Index of the correct answer (0-3)
      "explanation": "Why this answer is correct"
    },
    // more questions...
  ]
  
  Only return the JSON, with no additional text before or after.
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
 * @param {number} levelId - The level ID
 * @returns {Promise<Array>} - Array of question objects
 */
export async function generateQuestionsForLevel(levelId) {
  try {
    console.log(`Generating questions for level ${levelId}`);

    // Check if questions are already in cache
    if (questionsCache[levelId]) {
      console.log(`Using cached questions for level ${levelId}`);
      return questionsCache[levelId];
    }

    const level = levelDefinitions.find((l) => l.id === levelId);

    if (!level) {
      throw new Error(`Level with ID ${levelId} not found`);
    }

    // Check if the API key is available
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.warn('Gemini API key not found. Cannot generate questions.');
      throw new Error('Gemini API key not configured');
    }

    // Generate the prompt
    const prompt = createPromptForLevel(level);

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    try {
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

      const questions = JSON.parse(cleanedText);

      // Shuffle the options for each question to further randomize correct answers
      const shuffledQuestions = questions.map((q) => shuffleQuestionOptions(q));

      // Store in cache
      questionsCache[levelId] = shuffledQuestions;

      console.log(
        `Successfully generated ${shuffledQuestions.length} questions for level ${levelId}`
      );
      return shuffledQuestions;
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', e);
      console.log('Raw response:', text);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error(`Error generating questions for level ${levelId}:`, error);
    throw error;
  }
}

/**
 * Generate questions for all levels
 * @returns {Promise<Object>} - Object with level IDs as keys and question arrays as values
 */
export async function generateAllLevelQuestions() {
  const allQuestions = {};

  for (const level of levelDefinitions) {
    try {
      const questions = await generateQuestionsForLevel(level.id);
      allQuestions[level.id] = questions;
      console.log(
        `Generated ${questions.length} questions for level ${level.id}`
      );
    } catch (error) {
      console.error(
        `Failed to generate questions for level ${level.id}:`,
        error
      );
      // No default questions, just use an empty array
      allQuestions[level.id] = [];
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

/**
 * Clear the questions cache
 */
export function clearQuestionsCache() {
  Object.keys(questionsCache).forEach((key) => {
    delete questionsCache[key];
  });
  console.log('Questions cache cleared');
}
