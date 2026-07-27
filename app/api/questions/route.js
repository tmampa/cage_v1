import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';
import { GEMINI_MODEL } from "../../../lib/gemini.js";

// Initialize the Gemini API with server-only key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Level definitions with their topics and difficulty
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

// File-based cache for generated questions (persists across server restarts)
const CACHE_FILE = path.join(process.cwd(), '.questions-cache.json');

async function getCachedQuestions() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {}; // Return empty object if file doesn't exist or is invalid
  }
}

async function saveToCache(levelId, questions) {
  try {
    const currentCache = await getCachedQuestions();
    currentCache[levelId] = {
      questions,
      timestamp: Date.now(),
    };
    await fs.writeFile(CACHE_FILE, JSON.stringify(currentCache, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save questions to cache:', err);
  }
}

function createPromptForLevel(level) {
  const topics = level.topics.join(", ");
  const focusAreas = level.focusAreas ? level.focusAreas.join(", ") : "";
  const count = level.questionsCount;

  return `Generate EXACTLY ${count} cybersecurity questions for "${level.title}".

TOPIC: ${topics}
DIFFICULTY: ${level.difficulty.toLowerCase()}
${focusAreas ? `FOCUS AREAS: ${focusAreas}` : ""}

REQUIREMENTS:
1. Create EXACTLY ${count} questions (no more, no less)
2. Each question must have 4 multiple choice options (A, B, C, D)
3. Questions must be about: ${topics}
4. Difficulty level: ${level.difficulty.toLowerCase()}
5. Include practical, real-world scenarios
6. Provide clear explanations for correct answers
7. Include a helpful hint for each question that guides without revealing the answer

Return ONLY a JSON array:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "...",
    "hint": "Think about..."
  }
]`;
}

function shuffleQuestionOptions(question) {
  const pairs = question.options.map((option, index) => ({
    option,
    isCorrect: index === question.correctIndex,
  }));

  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  question.options = pairs.map((p) => p.option);
  question.correctIndex = pairs.findIndex((p) => p.isCorrect);
  return question;
}



async function generateQuestionsForLevel(levelId) {
  const level = levelDefinitions.find((l) => l.id === parseInt(levelId));
  if (!level) {
    throw new Error(`Level with ID ${levelId} not found`);
  }

  // Check persistent cache
  const cachedData = await getCachedQuestions();
  const levelCache = cachedData[levelId];
  
  // Reuse cache indefinitely to avoid hitting API rate limits
  if (levelCache && levelCache.questions) {
    return JSON.parse(JSON.stringify(levelCache.questions));
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Cannot generate questions.");
  }

  const prompt = createPromptForLevel(level);
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        generationConfig: {
          temperature: 0.5,
          topP: 0.8,
          topK: 20,
          maxOutputTokens: 4000,
          candidateCount: 1,
        },
      });

      const text = result.text;
      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from AI");
      }

      // Parse response
      let cleanedText = text;
      if (text.includes("```json")) {
        cleanedText = text.replace(/```json\s*\n?|\n?\s*```/g, "");
      } else if (text.includes("```")) {
        cleanedText = text.replace(/```\s*\n?|\n?\s*```/g, "");
      }

      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) cleanedText = jsonMatch[0];

      cleanedText = cleanedText
        .trim()
        .replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, "")
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]");

      let questions = JSON.parse(cleanedText);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid questions format");
      }

      // Shuffle options and add level ID
      const finalQuestions = questions.map((q) => ({
        ...shuffleQuestionOptions(q),
        levelId: parseInt(levelId),
      }));

      // Save to persistent cache
      await saveToCache(levelId, finalQuestions);

      return finalQuestions;
    } catch (error) {
      retryCount++;
      console.error(`API attempt ${retryCount} failed:`, error.message);
      if (retryCount >= maxRetries) {
        throw new Error("All AI attempts failed to generate questions.");
      }
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }
  }

  throw new Error("Failed to generate questions.");
}


export async function POST(request) {
  try {
    const body = await request.json();
    const { levelId } = body;

    if (!levelId || isNaN(parseInt(levelId))) {
      return NextResponse.json({ error: "Valid levelId is required" }, { status: 400 });
    }

    const parsedLevelId = parseInt(levelId);
    if (parsedLevelId < 1 || parsedLevelId > 6) {
      return NextResponse.json({ error: "levelId must be between 1 and 6" }, { status: 400 });
    }

    const questions = await generateQuestionsForLevel(parsedLevelId);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[Questions API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    levels: levelDefinitions.map(l => ({ id: l.id, title: l.title, questionsCount: l.questionsCount })),
  });
}
