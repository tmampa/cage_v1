/**
 * Utility functions for constructing context-aware prompts for the Gemini chatbot
 */

/**
 * Base system prompt for the chatbot
 */
export const BASE_SYSTEM_PROMPT = `You are a friendly AI tutor helping students learn cybersecurity through the CagE game.
Your role is to guide learning without giving away answers directly.

Guidelines:
- Be encouraging and supportive
- Use simple language appropriate for students
- Provide hints that lead to understanding, not just answers
- Use emojis occasionally to be friendly (🔒, 🛡️, 💡, etc.)
- Keep responses under 300 words
- Focus on cybersecurity education
- Never reveal the correct answer directly when asked for hints`;

/**
 * Construct context prompt based on current page
 * @param {object} gameContext - Current game state
 * @returns {string} - Context-specific prompt
 */
export function constructContextPrompt(gameContext) {
  if (!gameContext) {
    return '';
  }

  const {
    currentPage,
    levelId,
    levelTitle,
    levelDescription,
    questionText,
    questionNumber,
    totalQuestions,
    userProgress
  } = gameContext;

  switch (currentPage) {
    case 'question':
      return constructQuestionContextPrompt({
        levelTitle,
        questionText,
        questionNumber,
        totalQuestions
      });

    case 'levels':
      return constructLevelsContextPrompt(userProgress);

    case 'level':
      return constructLevelContextPrompt({
        levelTitle,
        levelDescription
      });

    case 'profile':
      return constructProfileContextPrompt(userProgress);

    default:
      return '';
  }
}

/**
 * Construct prompt for question page context
 */
function constructQuestionContextPrompt({ levelTitle, questionText, questionNumber, totalQuestions }) {
  if (!questionText) {
    return '';
  }

  return `\n\nCurrent Context:
- Level: ${levelTitle || 'Unknown'}
- Question ${questionNumber || '?'} of ${totalQuestions || '?'}: ${questionText}

When providing hints:
- Give conceptual guidance about the topic
- Ask leading questions
- Explain why certain approaches are better
- DO NOT reveal which option is correct`;
}

/**
 * Construct prompt for levels page context
 */
function constructLevelsContextPrompt(userProgress) {
  if (!userProgress) {
    return '\n\nThe user is browsing available levels. Help them understand what each level teaches and choose appropriate difficulty.';
  }

  const completedCount = userProgress.completedLevels?.length || 0;
  const currentScore = userProgress.currentScore || 0;

  return `\n\nCurrent Context:
- User has completed ${completedCount} levels
- Current score: ${currentScore}

Help the user:
- Understand what each level teaches
- Choose appropriate difficulty
- Stay motivated`;
}

/**
 * Construct prompt for level detail context
 */
function constructLevelContextPrompt({ levelTitle, levelDescription }) {
  if (!levelTitle) {
    return '';
  }

  return `\n\nCurrent Context:
- Level: ${levelTitle}
${levelDescription ? `- Description: ${levelDescription}` : ''}

Help the user understand the concepts in this level.`;
}

/**
 * Construct prompt for profile page context
 */
function constructProfileContextPrompt(userProgress) {
  if (!userProgress) {
    return '\n\nThe user is viewing their profile. Help them understand their progress and achievements.';
  }

  const completedCount = userProgress.completedLevels?.length || 0;
  const currentScore = userProgress.currentScore || 0;

  return `\n\nCurrent Context:
- User has completed ${completedCount} levels
- Current score: ${currentScore}

Help the user:
- Understand their progress
- Set learning goals
- Stay motivated`;
}

/**
 * Construct action-specific prompt
 * @param {string} action - Type of action (hint, explain, chat)
 * @returns {string} - Action-specific prompt
 */
export function constructActionPrompt(action) {
  switch (action) {
    case 'hint':
      return `\n\nThe user is asking for a hint. Provide a helpful clue that guides them toward the answer without revealing it directly. Focus on the underlying concept or reasoning process.`;

    case 'explain':
      return `\n\nThe user wants an explanation of the concept. Provide a clear, educational explanation of the cybersecurity topic at hand. Use examples and analogies to make it easier to understand.`;

    case 'chat':
    default:
      return '';
  }
}

/**
 * Construct complete system prompt
 * @param {object} gameContext - Current game state
 * @param {string} action - Type of action
 * @returns {string} - Complete system prompt
 */
export function constructSystemPrompt(gameContext, action = 'chat') {
  const contextPrompt = constructContextPrompt(gameContext);
  const actionPrompt = constructActionPrompt(action);

  return BASE_SYSTEM_PROMPT + contextPrompt + actionPrompt;
}

/**
 * Sanitize user input to prevent injection attacks
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potential script tags and SQL injection patterns
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '')
    .trim();
}

/**
 * Format conversation history for API
 * @param {Array} history - Raw conversation history
 * @param {number} maxExchanges - Maximum number of exchanges to keep
 * @returns {Array} - Formatted history
 */
export function formatConversationHistory(history, maxExchanges = 20) {
  if (!history || !Array.isArray(history)) {
    return [];
  }

  // Limit to last N exchanges (N*2 messages)
  const limitedHistory = history.slice(-(maxExchanges * 2));

  return limitedHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
}

/**
 * Extract game context from page data
 * @param {string} pathname - Current page path
 * @param {object} pageData - Page-specific data
 * @returns {object} - Game context object
 */
export function extractGameContext(pathname, pageData = {}) {
  const context = {
    currentPage: 'home',
    levelId: null,
    levelTitle: null,
    levelDescription: null,
    questionText: null,
    questionNumber: null,
    totalQuestions: null,
    userProgress: null
  };

  // Determine current page type
  if (pathname.includes('/game/levels')) {
    context.currentPage = 'levels';
  } else if (pathname.includes('/game/play/')) {
    context.currentPage = 'question';
  } else if (pathname.includes('/profile')) {
    context.currentPage = 'profile';
  } else if (pathname.includes('/leaderboard')) {
    context.currentPage = 'leaderboard';
  }

  // Merge page data
  return { ...context, ...pageData };
}
