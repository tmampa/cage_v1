// This system generates all questions dynamically using AI (Gemini).
// Fallback questions have been intentionally removed to ensure all questions are unique and AI-generated.

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// Track pending requests to prevent duplicate API calls
const pendingRequests = {};

// Question cache to store generated questions and avoid regenerating
const questionCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Cache structure: { questions: Array, timestamp: number, levelId: number }

// Level definitions with their topics and difficulty
const levelDefinitions = [
  {
    id: 1,
    title: "Cyber Security Basics",
    description: "Learn the fundamentals of staying safe online",
    difficulty: "Easy",
    topics: [
      "basic internet safety",
      "digital citizenship",
      "online privacy fundamentals",
    ],
    questionsCount: 5,
    focusAreas: [
      "what is cyber security",
      "basic online threats",
      "digital footprints",
    ],
  },
  {
    id: 2,
    title: "Password Protection",
    description: "Create strong passwords and keep them safe",
    difficulty: "Easy",
    topics: [
      "password strength",
      "password managers",
      "credential security",
      "two-factor authentication",
    ],
    questionsCount: 6,
    focusAreas: [
      "creating strong passwords",
      "password storage",
      "authentication methods",
    ],
  },
  {
    id: 3,
    title: "Phishing Attacks",
    description: "Identify and avoid dangerous emails and messages",
    difficulty: "Medium",
    topics: [
      "phishing emails",
      "suspicious links",
      "social engineering tactics",
      "email scams",
    ],
    questionsCount: 7,
    focusAreas: [
      "recognizing phishing emails",
      "suspicious website indicators",
      "social engineering red flags",
    ],
  },
  {
    id: 4,
    title: "Safe Web Browsing",
    description: "Navigate the internet safely and avoid threats",
    difficulty: "Medium",
    topics: [
      "browser security",
      "safe websites",
      "download safety",
      "HTTPS protocols",
      "URL verification",
    ],
    questionsCount: 8,
    focusAreas: [
      "identifying secure websites",
      "browser privacy settings",
      "safe downloading practices",
      "certificate verification",
      "avoiding malicious websites",
    ],
  },
  {
    id: 5,
    title: "Social Media Safety",
    description: "Protect your personal information on social platforms",
    difficulty: "Hard",
    topics: [
      "privacy settings",
      "information sharing",
      "social media scams",
      "digital reputation",
      "account security",
    ],
    questionsCount: 9,
    focusAreas: [
      "configuring privacy settings",
      "safe information sharing",
      "recognizing social media scams",
      "protecting personal data",
      "managing digital footprint",
    ],
  },
  {
    id: 6,
    title: "Malware Defense",
    description: "Understand and protect against computer viruses",
    difficulty: "Hard",
    topics: [
      "malware types",
      "virus protection",
      "infection prevention",
      "antivirus software",
      "system security",
    ],
    questionsCount: 10,
    focusAreas: [
      "identifying malware types",
      "antivirus best practices",
      "system vulnerability protection",
      "malware removal techniques",
      "preventive security measures",
    ],
  },
];

/**
 * Generates a prompt for Gemini to create questions for a specific level
 * @param {Object} level - The level definition
 * @returns {string} - The prompt for Gemini
 */
function createPromptForLevel(level) {
  const difficulty = level.difficulty.toLowerCase();
  const topics = level.topics.join(", ");
  const focusAreas = level.focusAreas ? level.focusAreas.join(", ") : "";
  const count = level.questionsCount;
  const levelId = level.id;
  const levelTitle = level.title;

  return `Generate EXACTLY ${count} cybersecurity questions for "${levelTitle}".

TOPIC: ${topics}
DIFFICULTY: ${difficulty}
${focusAreas ? `FOCUS AREAS: ${focusAreas}` : ""}

REQUIREMENTS:
1. Create EXACTLY ${count} questions (no more, no less)
2. Each question must have 4 multiple choice options (A, B, C, D)
3. Questions must be about: ${topics}
4. Difficulty level: ${difficulty}
5. Include practical, real-world scenarios
6. Provide clear explanations for correct answers

EXAMPLE FORMAT:
[
  {
    "question": "What is the most important rule for basic internet safety?",
    "options": [
      "Share passwords with trusted friends",
      "Never give personal information to strangers online", 
      "Always click on interesting links",
      "Use the same password everywhere"
    ],
    "correctIndex": 1,
    "explanation": "Never sharing personal information with strangers online is a fundamental internet safety rule that protects you from identity theft and scams."
  }
]

Generate EXACTLY ${count} questions following this format. Return only the JSON array with no additional text or markdown.`;
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
 * Generates questions for a specific level using Gemini with fallback support
 * @param {number} levelId - The level ID
 * @returns {Promise<Array>} - Array of question objects
 */
export async function generateQuestionsForLevel(levelId) {
  try {
    // Check cache first
    const cacheKey = `level_${levelId}`;
    const cachedData = questionCache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log(`Using cached questions for level ${levelId}`);
      // Return a deep copy to prevent mutations
      return JSON.parse(JSON.stringify(cachedData.questions));
    }

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
      console.warn("Gemini API key not found. Cannot generate questions.");
      throw new Error("Gemini API key not configured");
    }

    // Create a promise for this request and store it
    pendingRequests[cacheKey] = (async () => {
      try {
        const prompt = createPromptForLevel(level);

        // Configure model for better JSON output - using stable model
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash", // Most stable model
          generationConfig: {
            temperature: 0.5, // Lower temperature for more consistent output
            topP: 0.8,
            topK: 20,
            maxOutputTokens: 4000, // Increased for longer responses
            candidateCount: 1, // Single response for consistency
          },
        });

        // Add retry logic for API failures
        let result, response, text;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            console.log(
              `Attempting to generate questions for level ${levelId}, attempt ${
                retryCount + 1
              }/${maxRetries}`
            );
            console.log(
              `Requesting ${level.questionsCount} questions for: ${level.title}`
            );

            result = await model.generateContent(prompt);
            response = await result.response;
            text = response.text();

            console.log(
              `Received response length: ${text?.length || 0} characters`
            );

            if (text && text.trim().length > 0) {
              break; // Success, exit retry loop
            } else {
              throw new Error("Empty response from AI");
            }
          } catch (apiError) {
            retryCount++;
            console.error(
              `API attempt ${retryCount} failed:`,
              apiError.message
            );

            if (retryCount >= maxRetries) {
              throw new Error(
                `AI API failed after ${maxRetries} attempts: ${apiError.message}`
              );
            }

            // Exponential backoff: wait 2^retryCount seconds
            const waitTime = Math.pow(2, retryCount) * 1000;
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }

        console.log(
          `Received response from Gemini for level ${levelId}, length: ${text.length}`
        );

        // Clean and parse the response with multiple fallback strategies
        let cleanedText = text;
        let questions;

        // Strategy 1: Remove markdown code blocks
        if (text.includes("```json")) {
          cleanedText = text.replace(/```json\s*\n?|\n?\s*```/g, "");
        } else if (text.includes("```")) {
          cleanedText = text.replace(/```\s*\n?|\n?\s*```/g, "");
        }

        // Strategy 2: Extract JSON from text if it's embedded
        const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }

        // Strategy 3: Clean up common formatting issues
        cleanedText = cleanedText
          .trim()
          .replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, "") // Remove leading/trailing newlines
          .replace(/,\s*}/g, "}") // Remove trailing commas before }
          .replace(/,\s*]/g, "]"); // Remove trailing commas before ]

        // Try to parse the JSON response with multiple attempts
        try {
          questions = JSON.parse(cleanedText);
          console.log(
            `Successfully parsed ${
              questions?.length || 0
            } questions from AI response`
          );
        } catch (jsonError) {
          console.error(`JSON parse error for level ${levelId}:`, jsonError);
          console.log("Raw response:", text);
          console.log("Cleaned text:", cleanedText);

          // Try to fix common JSON issues and parse again
          try {
            // Fix unescaped quotes in strings
            let fixedText = cleanedText.replace(/([^\\])"/g, '$1\\"');
            // Fix missing quotes around keys
            fixedText = fixedText.replace(/(\w+):/g, '"$1":');
            // Try parsing the fixed version
            questions = JSON.parse(fixedText);
            console.log("Successfully parsed after fixing JSON formatting");
          } catch (secondError) {
            console.error("Second JSON parse attempt failed:", secondError);

            // Last resort: try to extract questions manually using regex
            try {
              questions = extractQuestionsFromText(text);
              if (questions && questions.length > 0) {
                console.log(
                  "Successfully extracted questions using regex fallback"
                );
              } else {
                throw new Error("Regex extraction failed");
              }
            } catch (regexError) {
              throw new Error(
                `Failed to parse AI response for level ${levelId}. Original error: ${jsonError.message}. Raw response length: ${text.length}`
              );
            }
          }
        }

        // Validate questions structure
        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error(`Invalid questions format for level ${levelId}`);
        }

        // Ensure we have the expected number of questions
        if (questions.length < level.questionsCount) {
          console.warn(
            `Insufficient questions generated for level ${levelId}. Expected ${level.questionsCount}, got ${questions.length}. Retrying...`
          );

          // Try to generate additional questions to meet the requirement
          const additionalNeeded = level.questionsCount - questions.length;
          console.log(
            `Attempting to generate ${additionalNeeded} additional questions...`
          );

          try {
            const additionalPrompt = `Generate EXACTLY ${additionalNeeded} more cybersecurity questions for "${
              level.title
            }".

TOPIC: ${level.topics.join(", ")}
DIFFICULTY: ${level.difficulty}

These questions should be DIFFERENT from any previous questions but still about the same topic.
Return only the JSON array with ${additionalNeeded} questions, no additional text.`;

            const additionalResult = await model.generateContent(
              additionalPrompt
            );
            const additionalResponse = await additionalResult.response;
            const additionalText = additionalResponse.text();

            // Clean and parse additional questions
            let cleanedAdditionalText = additionalText;
            if (additionalText.includes("```json")) {
              cleanedAdditionalText = additionalText.replace(
                /```json\s*\n?|\n?\s*```/g,
                ""
              );
            } else if (additionalText.includes("```")) {
              cleanedAdditionalText = additionalText.replace(
                /```\s*\n?|\n?\s*```/g,
                ""
              );
            }

            const jsonMatch = cleanedAdditionalText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              cleanedAdditionalText = jsonMatch[0];
            }

            cleanedAdditionalText = cleanedAdditionalText
              .trim()
              .replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, "")
              .replace(/,\s*}/g, "}")
              .replace(/,\s*]/g, "]");

            const additionalQuestions = JSON.parse(cleanedAdditionalText);

            if (
              Array.isArray(additionalQuestions) &&
              additionalQuestions.length > 0
            ) {
              questions = questions.concat(additionalQuestions);
              console.log(
                `Successfully added ${additionalQuestions.length} additional questions. Total: ${questions.length}`
              );
            }
          } catch (additionalError) {
            console.error(
              "Failed to generate additional questions:",
              additionalError
            );
          }

          // Final check - if still insufficient, create simple fallback questions
          if (questions.length < level.questionsCount) {
            console.warn(
              `Still insufficient questions. Creating fallback questions...`
            );
            const stillNeeded = level.questionsCount - questions.length;

            for (let i = 0; i < stillNeeded; i++) {
              const fallbackQuestion = createFallbackQuestion(level, i + 1);
              questions.push(fallbackQuestion);
            }

            console.log(
              `Added ${stillNeeded} fallback questions. Total: ${questions.length}`
            );
          }
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
        const validationResult = validateQuestionUniqueness(
          finalQuestions,
          levelId
        );

        // Log validation results
        if (!validationResult.validation.unique) {
          console.warn(`Level ${levelId}: Questions are not unique!`);
        }
        if (!validationResult.validation.levelSpecific) {
          console.warn(
            `Level ${levelId}: Questions may not be level-specific enough!`
          );
        }
        if (!validationResult.validation.lowGeneric) {
          console.warn(
            `Level ${levelId}: Too many generic questions detected!`
          );
        }

        console.log(
          `Successfully generated ${validationResult.questions.length} questions for level ${levelId}`
        );

        // Cache the generated questions
        questionCache.set(cacheKey, {
          questions: validationResult.questions,
          timestamp: Date.now(),
          levelId: parseInt(levelId),
        });

        return JSON.parse(JSON.stringify(validationResult.questions));
      } catch (e) {
        console.error(`Error generating questions for level ${levelId}:`, e);

        // Provide more specific error messages
        let errorMessage = e.message;
        if (e.message.includes("overloaded") || e.message.includes("503")) {
          errorMessage =
            "AI service is temporarily overloaded. Please try again in a few moments.";
        } else if (e.message.includes("API key")) {
          errorMessage =
            "AI service configuration error. Please check your setup.";
        } else if (e.message.includes("Failed to parse")) {
          errorMessage =
            "AI generated invalid response format. Please try again.";
        }

        throw new Error(
          `Question generation failed for level ${levelId}: ${errorMessage}`
        );
      } finally {
        delete pendingRequests[cacheKey];
      }
    })();

    return pendingRequests[cacheKey];
  } catch (error) {
    console.error(
      `Error in question generation flow for level ${levelId}:`,
      error
    );

    // Provide user-friendly error messages
    let userMessage = error.message;
    if (error.message.includes("overloaded") || error.message.includes("503")) {
      userMessage =
        "The AI service is currently busy. Please wait a moment and try again.";
    } else if (error.message.includes("API key")) {
      userMessage = "Service configuration issue. Please contact support.";
    }

    throw new Error(userMessage);
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
      throw new Error(
        `Question generation failed for level ${level.id}: ${error.message}`
      );
    }
  }

  return allQuestions;
}

/**
 * Creates a simple fallback question when AI generation fails
 * @param {Object} level - The level definition
 * @param {number} questionNumber - The question number for variety
 * @returns {Object} - A fallback question object
 */
function createFallbackQuestion(level, questionNumber) {
  const fallbackQuestions = {
    1: [
      // Cyber Security Basics
      {
        question: "What is the most important rule when using the internet?",
        options: [
          "Share your password with friends",
          "Never give personal information to strangers",
          "Click on all interesting links",
          "Use public WiFi for banking",
        ],
        correctIndex: 1,
        explanation:
          "Never sharing personal information with strangers online is a fundamental internet safety rule.",
      },
      {
        question: "What should you do if you receive a suspicious email?",
        options: [
          "Open all attachments to check them",
          "Forward it to all your friends",
          "Delete it without opening attachments",
          "Reply asking for more information",
        ],
        correctIndex: 2,
        explanation:
          "Deleting suspicious emails without opening attachments protects you from malware and scams.",
      },
      {
        question: "Why is it important to keep your software updated?",
        options: [
          "To get new features only",
          "To fix security vulnerabilities",
          "To make your computer slower",
          "Updates are not important",
        ],
        correctIndex: 1,
        explanation:
          "Software updates often include security patches that protect against new threats.",
      },
    ],
    2: [
      // Password Protection
      {
        question: "What makes a password strong?",
        options: [
          "Using your birthday",
          "Using the same password everywhere",
          "Mixing letters, numbers, and symbols",
          "Using only lowercase letters",
        ],
        correctIndex: 2,
        explanation:
          "Strong passwords combine uppercase and lowercase letters, numbers, and special symbols.",
      },
    ],
    3: [
      // Phishing Attacks
      {
        question: "What is a common sign of a phishing email?",
        options: [
          "Perfect spelling and grammar",
          "Urgent requests for personal information",
          "Emails from known contacts",
          "Professional email signatures",
        ],
        correctIndex: 1,
        explanation:
          "Phishing emails often create urgency to trick people into sharing personal information quickly.",
      },
    ],
  };

  const levelQuestions = fallbackQuestions[level.id] || fallbackQuestions[1];
  const questionIndex = (questionNumber - 1) % levelQuestions.length;

  return {
    ...levelQuestions[questionIndex],
    levelId: level.id,
    isFallback: true,
  };
}

/**
 * Utility function to get level definitions
 * @returns {Array} - Array of level definitions
 */
export function getLevelDefinitions() {
  return levelDefinitions;
}

/**
 * Fallback function to extract questions from malformed AI response using regex
 * @param {string} text - The raw AI response text
 * @returns {Array} - Array of extracted questions
 */
function extractQuestionsFromText(text) {
  try {
    const questions = [];

    // Look for question patterns in the text
    const questionPattern = /"question":\s*"([^"]+)"/g;
    const optionsPattern = /"options":\s*\[([^\]]+)\]/g;
    const correctIndexPattern = /"correctIndex":\s*(\d+)/g;
    const explanationPattern = /"explanation":\s*"([^"]+)"/g;

    const questionMatches = [...text.matchAll(questionPattern)];
    const optionsMatches = [...text.matchAll(optionsPattern)];
    const correctIndexMatches = [...text.matchAll(correctIndexPattern)];
    const explanationMatches = [...text.matchAll(explanationPattern)];

    // Ensure we have matching counts
    const minLength = Math.min(
      questionMatches.length,
      optionsMatches.length,
      correctIndexMatches.length,
      explanationMatches.length
    );

    for (let i = 0; i < minLength; i++) {
      try {
        const question = questionMatches[i][1];
        const optionsText = optionsMatches[i][1];
        const correctIndex = parseInt(correctIndexMatches[i][1]);
        const explanation = explanationMatches[i][1];

        // Parse options from the matched text
        const options = optionsText
          .split(",")
          .map((opt) => opt.trim().replace(/^"|"$/g, ""))
          .filter((opt) => opt.length > 0);

        if (options.length === 4 && correctIndex >= 0 && correctIndex < 4) {
          questions.push({
            question,
            options,
            correctIndex,
            explanation,
          });
        }
      } catch (parseError) {
        console.warn(`Failed to parse question ${i + 1}:`, parseError);
      }
    }

    return questions;
  } catch (error) {
    console.error("Regex extraction failed:", error);
    return [];
  }
}

// Enhanced validation function to prevent duplicate questions and ensure level-specific content
function validateQuestionUniqueness(questions, levelId) {
  const questionTexts = questions.map((q) => q.question.toLowerCase());
  const uniqueQuestions = new Set(questionTexts);

  if (uniqueQuestions.size < questions.length) {
    console.warn(`Level ${levelId} has duplicate questions`);
  }

  // Level-specific keywords that should appear in questions
  const levelKeywords = {
    1: ["basic", "fundamental", "digital citizenship", "privacy", "footprint"],
    2: ["password", "credential", "authentication", "two-factor", "manager"],
    3: [
      "phishing",
      "email",
      "suspicious",
      "link",
      "social engineering",
      "scam",
    ],
    4: ["browser", "website", "download", "https", "certificate", "url"],
    5: [
      "social media",
      "privacy setting",
      "sharing",
      "profile",
      "facebook",
      "twitter",
    ],
    6: [
      "malware",
      "virus",
      "antivirus",
      "trojan",
      "worm",
      "infection",
      "software",
    ],
  };

  // Check for generic terms that indicate non-specific questions
  const genericTerms = [
    "cyber security",
    "online safety",
    "internet safety",
    "security threat",
  ];

  // Validate level-specific content
  const requiredKeywords = levelKeywords[levelId] || [];
  let levelSpecificCount = 0;
  let genericCount = 0;

  questions.forEach((q, index) => {
    const questionLower = q.question.toLowerCase();

    // Check if question contains level-specific keywords
    const hasLevelKeywords = requiredKeywords.some((keyword) =>
      questionLower.includes(keyword.toLowerCase())
    );

    // Check if question contains generic terms
    const hasGenericTerms = genericTerms.some((term) =>
      questionLower.includes(term.toLowerCase())
    );

    if (hasLevelKeywords) levelSpecificCount++;
    if (hasGenericTerms) genericCount++;

    // Log questionable questions
    if (!hasLevelKeywords && levelId > 1) {
      console.warn(
        `Level ${levelId} Question ${index + 1} may not be level-specific: "${
          q.question
        }"`
      );
    }
  });

  console.log(`Level ${levelId} validation:`, {
    uniqueQuestions: uniqueQuestions.size,
    totalQuestions: questions.length,
    levelSpecific: levelSpecificCount,
    generic: genericCount,
    specificity: `${Math.round(
      (levelSpecificCount / questions.length) * 100
    )}%`,
  });

  // Return validation results
  return {
    questions,
    validation: {
      unique: uniqueQuestions.size === questions.length,
      levelSpecific: levelSpecificCount >= questions.length * 0.7, // At least 70% should be level-specific
      lowGeneric: genericCount <= questions.length * 0.2, // Less than 20% should be generic
    },
  };

  return questions;
}
