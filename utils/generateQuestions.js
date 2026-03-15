// Client-side wrapper that calls the server-side /api/questions endpoint.
// All AI generation and API key handling happens server-side.

// Track pending requests to prevent duplicate API calls
const pendingRequests = {};

// Client-side cache
const questionCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Level definitions (kept client-side for UI display purposes)
const levelDefinitions = [
  {
    id: 1,
    title: "Cyber Security Basics",
    description: "Learn the fundamentals of staying safe online",
    difficulty: "Easy",
    topics: ["basic internet safety", "digital citizenship", "online privacy fundamentals"],
    questionsCount: 5,
    focusAreas: ["what is cyber security", "basic online threats", "digital footprints"],
  },
  {
    id: 2,
    title: "Password Protection",
    description: "Create strong passwords and keep them safe",
    difficulty: "Easy",
    topics: ["password strength", "password managers", "credential security", "two-factor authentication"],
    questionsCount: 6,
    focusAreas: ["creating strong passwords", "password storage", "authentication methods"],
  },
  {
    id: 3,
    title: "Phishing Attacks",
    description: "Identify and avoid dangerous emails and messages",
    difficulty: "Medium",
    topics: ["phishing emails", "suspicious links", "social engineering tactics", "email scams"],
    questionsCount: 7,
    focusAreas: ["recognizing phishing emails", "suspicious website indicators", "social engineering red flags"],
  },
  {
    id: 4,
    title: "Safe Web Browsing",
    description: "Navigate the internet safely and avoid threats",
    difficulty: "Medium",
    topics: ["browser security", "safe websites", "download safety", "HTTPS protocols", "URL verification"],
    questionsCount: 8,
    focusAreas: ["identifying secure websites", "browser privacy settings", "safe downloading practices", "certificate verification", "avoiding malicious websites"],
  },
  {
    id: 5,
    title: "Social Media Safety",
    description: "Protect your personal information on social platforms",
    difficulty: "Hard",
    topics: ["privacy settings", "information sharing", "social media scams", "digital reputation", "account security"],
    questionsCount: 9,
    focusAreas: ["configuring privacy settings", "safe information sharing", "recognizing social media scams", "protecting personal data", "managing digital footprint"],
  },
  {
    id: 6,
    title: "Malware Defense",
    description: "Understand and protect against computer viruses",
    difficulty: "Hard",
    topics: ["malware types", "virus protection", "infection prevention", "antivirus software", "system security"],
    questionsCount: 10,
    focusAreas: ["identifying malware types", "antivirus best practices", "system vulnerability protection", "malware removal techniques", "preventive security measures"],
  },
];

/**
 * Generates questions for a specific level by calling the server API
 * @param {number} levelId - The level ID
 * @returns {Promise<Array>} - Array of question objects
 */
export async function generateQuestionsForLevel(levelId) {
  // Check client cache first
  const cacheKey = `level_${levelId}`;
  const cachedData = questionCache.get(cacheKey);

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log(`Using cached questions for level ${levelId}`);
    return JSON.parse(JSON.stringify(cachedData.questions));
  }

  // Prevent duplicate simultaneous requests
  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey];
  }

  pendingRequests[cacheKey] = (async () => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelId: parseInt(levelId) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      const questions = data.questions;

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No questions returned from server');
      }

      // Cache the questions client-side
      questionCache.set(cacheKey, {
        questions,
        timestamp: Date.now(),
        levelId: parseInt(levelId),
      });

      return JSON.parse(JSON.stringify(questions));
    } finally {
      delete pendingRequests[cacheKey];
    }
  })();

  return pendingRequests[cacheKey];
}

/**
 * Utility function to get level definitions
 * @returns {Array} - Array of level definitions
 */
export function getLevelDefinitions() {
  return levelDefinitions;
}
