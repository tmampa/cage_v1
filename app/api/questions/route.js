import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

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

// In-memory cache for generated questions (server-side)
const questionCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

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

// Fallback questions for when AI is unavailable
const fallbackQuestions = {
  1: [
    { question: "What is the most important rule when using the internet?", options: ["Share your password with friends", "Never give personal information to strangers", "Click on all interesting links", "Use public WiFi for banking"], correctIndex: 1, explanation: "Never sharing personal information with strangers online is a fundamental internet safety rule.", hint: "Think about what you should protect online." },
    { question: "What should you do if you receive a suspicious email?", options: ["Open all attachments to check them", "Forward it to all your friends", "Delete it without opening attachments", "Reply asking for more information"], correctIndex: 2, explanation: "Deleting suspicious emails without opening attachments protects you from malware and scams.", hint: "Consider what could happen if the email contains something harmful." },
    { question: "Why is it important to keep your software updated?", options: ["To get new features only", "To fix security vulnerabilities", "To make your computer slower", "Updates are not important"], correctIndex: 1, explanation: "Software updates often include security patches that protect against new threats.", hint: "Updates fix more than just bugs." },
    { question: "What is a digital footprint?", options: ["The size of your computer screen", "The trail of data you leave online", "A type of computer virus", "The speed of your internet"], correctIndex: 1, explanation: "A digital footprint is the record of all your online activities and the data trail you create.", hint: "It's about the traces you leave behind when you go online." },
    { question: "Which of these is a good cybersecurity habit?", options: ["Using the same password for everything", "Sharing your location at all times", "Logging out of accounts on shared computers", "Accepting all friend requests"], correctIndex: 2, explanation: "Logging out of accounts on shared computers prevents unauthorized access to your accounts.", hint: "Think about what happens when you walk away from a public computer." },
  ],
  2: [
    { question: "What makes a password strong?", options: ["Using your birthday", "Using the same password everywhere", "Mixing letters, numbers, and symbols", "Using only lowercase letters"], correctIndex: 2, explanation: "Strong passwords combine uppercase and lowercase letters, numbers, and special symbols.", hint: "Think about variety and complexity." },
    { question: "What is two-factor authentication?", options: ["Using two passwords", "A verification method requiring two forms of identity", "Logging in twice", "Having two user accounts"], correctIndex: 1, explanation: "Two-factor authentication adds an extra layer of security by requiring a second verification step.", hint: "It involves something you know AND something you have." },
    { question: "Where is the safest place to store passwords?", options: ["On a sticky note on your monitor", "In a text file on your desktop", "In a reputable password manager", "In your email drafts"], correctIndex: 2, explanation: "Password managers encrypt and securely store your passwords, making them the safest option.", hint: "Think about which option uses encryption." },
    { question: "How often should you change important passwords?", options: ["Never", "Every few months or when a breach occurs", "Every hour", "Only when you forget them"], correctIndex: 1, explanation: "Regularly changing passwords and immediately after breaches helps maintain account security.", hint: "There's a balance between too often and never." },
    { question: "Which password is the strongest?", options: ["password123", "MyDogSpot", "P@55w0rd!Xyz#2024", "123456789"], correctIndex: 2, explanation: "The password with mixed case, numbers, symbols, and length is the strongest.", hint: "Look for the one with the most variety of character types." },
    { question: "What is a password manager?", options: ["A person who remembers passwords for you", "Software that securely stores and generates passwords", "A type of antivirus", "A browser extension that removes passwords"], correctIndex: 1, explanation: "Password managers are software tools that securely store, generate, and auto-fill passwords.", hint: "It's a software tool designed specifically for handling passwords." },
  ],
  3: [
    { question: "What is a common sign of a phishing email?", options: ["Perfect spelling and grammar", "Urgent requests for personal information", "Emails from known contacts", "Professional email signatures"], correctIndex: 1, explanation: "Phishing emails often create urgency to trick people into sharing personal information quickly.", hint: "Scammers try to make you act fast without thinking." },
    { question: "What should you check before clicking a link in an email?", options: ["The color of the link", "The actual URL by hovering over it", "Nothing, just click it", "The font of the email"], correctIndex: 1, explanation: "Hovering over links reveals their true destination, helping you avoid malicious sites.", hint: "You can preview where a link actually goes without clicking it." },
    { question: "Which is an example of social engineering?", options: ["Installing antivirus software", "Someone pretending to be IT support to get your password", "Updating your browser", "Creating a strong password"], correctIndex: 1, explanation: "Social engineering manipulates people into revealing confidential information through deception.", hint: "It involves tricking humans, not hacking computers." },
    { question: "What type of phishing targets specific individuals?", options: ["Bulk phishing", "Spear phishing", "General phishing", "Random phishing"], correctIndex: 1, explanation: "Spear phishing targets specific individuals using personalized information to seem more legitimate.", hint: "Think of a spear vs. a net — one is precise." },
    { question: "How can you verify if an email from your bank is real?", options: ["Click the link in the email", "Reply to the email asking", "Call your bank using the official number", "Forward it to friends"], correctIndex: 2, explanation: "Contacting your bank through official channels (not via the email) verifies the authenticity.", hint: "Use a communication channel you know is legitimate." },
    { question: "What is vishing?", options: ["Video phishing", "Voice phishing via phone calls", "Virtual fishing game", "Virus phishing"], correctIndex: 1, explanation: "Vishing uses phone calls to trick people into revealing personal information.", hint: "The 'v' stands for a type of communication." },
    { question: "Which email sender address is most suspicious?", options: ["support@google.com", "help@amaz0n-security.xyz", "noreply@bank.com", "contact@microsoft.com"], correctIndex: 1, explanation: "The misspelled domain with unusual TLD is a classic sign of a phishing attempt.", hint: "Look carefully at the spelling and domain extension." },
  ],
  4: [
    { question: "What does HTTPS indicate in a website URL?", options: ["The site is fast", "The connection is encrypted and secure", "The site is popular", "The site is free"], correctIndex: 1, explanation: "HTTPS means the website uses SSL/TLS encryption to protect data in transit.", hint: "The 'S' stands for something that means protected." },
    { question: "What should you check before downloading software?", options: ["Only the file size", "The source reputation and reviews", "Nothing, downloads are always safe", "The download speed"], correctIndex: 1, explanation: "Verifying the source and reading reviews helps avoid downloading malicious software.", hint: "Consider who is providing the software." },
    { question: "What is a browser cookie?", options: ["A type of virus", "Data stored by websites to remember your preferences", "A hacking tool", "An internet speed booster"], correctIndex: 1, explanation: "Cookies are small data files websites store on your computer to remember settings and login info.", hint: "Websites use these to remember you between visits." },
    { question: "Which is safer for online transactions?", options: ["Public WiFi at a cafe", "Your home private WiFi", "Any open WiFi network", "A stranger's hotspot"], correctIndex: 1, explanation: "Private home WiFi is encrypted and controlled by you, making it safer for sensitive activities.", hint: "Think about who else could be watching the network traffic." },
    { question: "What is an SSL certificate?", options: ["A type of degree", "A digital certificate that verifies a website's identity", "A software update", "An email attachment"], correctIndex: 1, explanation: "SSL certificates authenticate a website's identity and enable encrypted connections.", hint: "It's what makes the padlock icon appear in your browser." },
    { question: "What does a VPN do?", options: ["Speeds up your internet", "Creates an encrypted tunnel for your internet traffic", "Removes all viruses", "Makes websites load faster"], correctIndex: 1, explanation: "A VPN encrypts your internet connection and masks your IP address for privacy.", hint: "It creates a private pathway through the public internet." },
    { question: "What is a popup blocker used for?", options: ["Blocking all website content", "Preventing unwanted popup windows that may contain ads or malware", "Speeding up your browser", "Blocking emails"], correctIndex: 1, explanation: "Popup blockers prevent potentially malicious or annoying popup windows from appearing.", hint: "Unwanted windows that appear suddenly can be dangerous." },
    { question: "What does 'incognito mode' in a browser do?", options: ["Makes you completely anonymous online", "Prevents your browser from saving local history and cookies", "Blocks all tracking", "Encrypts all your data"], correctIndex: 1, explanation: "Incognito mode prevents local storage of browsing history but doesn't make you anonymous to websites or ISPs.", hint: "It only affects what gets saved on YOUR device." },
  ],
  5: [
    { question: "What information should you avoid sharing on social media?", options: ["Your favorite color", "Your home address and phone number", "Your favorite movie", "Your opinion on a TV show"], correctIndex: 1, explanation: "Personal contact information like home address and phone number can be used for identity theft or stalking.", hint: "Think about what could be used to find you in real life." },
    { question: "What is the safest privacy setting for social media?", options: ["Public - everyone can see everything", "Friends only - limit visibility to connections", "No settings needed", "Share everything with everyone"], correctIndex: 1, explanation: "Restricting visibility to friends only limits who can see your personal information and posts.", hint: "Less visibility to strangers means more safety." },
    { question: "What is cyberbullying?", options: ["Playing video games online", "Using technology to harass or intimidate others", "Posting positive comments", "Sharing educational content"], correctIndex: 1, explanation: "Cyberbullying is the use of digital tools to repeatedly harm, harass, or humiliate someone.", hint: "It's bullying, but through digital channels." },
    { question: "What should you do if a stranger sends you a friend request?", options: ["Always accept it", "Check their profile carefully before deciding", "Share your personal info first", "Give them your phone number"], correctIndex: 1, explanation: "Reviewing profiles helps identify fake accounts and prevents connecting with potentially malicious users.", hint: "Don't act without investigating first." },
    { question: "Why is your digital reputation important?", options: ["It doesn't matter", "It can affect college admissions and job opportunities", "Only celebrities need to worry", "It resets every year"], correctIndex: 1, explanation: "Your digital reputation is permanent and can be reviewed by schools, employers, and others.", hint: "What you post today can be found years later." },
    { question: "What is doxxing?", options: ["A type of dance", "Publishing someone's private information online without consent", "A video editing technique", "A social media trend"], correctIndex: 1, explanation: "Doxxing is the malicious practice of revealing someone's personal information publicly online.", hint: "It involves exposing private details publicly." },
    { question: "How can you protect yourself from social media scams?", options: ["Click every link you see", "Be skeptical of offers that seem too good to be true", "Share everything publicly", "Accept all messages from strangers"], correctIndex: 1, explanation: "Being cautious of unrealistic offers protects you from fraudulent schemes on social media.", hint: "If it seems too good to be true, it probably is." },
    { question: "What is geotagging?", options: ["A type of game", "Adding location data to photos and posts", "A programming language", "A type of antivirus"], correctIndex: 1, explanation: "Geotagging embeds GPS coordinates in your content, which can reveal your location.", hint: "Your photos might be sharing more than just the image." },
    { question: "What should you do before posting online?", options: ["Post immediately without thinking", "Think about whether you'd be comfortable if everyone saw it", "Share as much as possible", "Use only emojis"], correctIndex: 1, explanation: "Considering the audience and permanence of posts helps protect your digital reputation.", hint: "Imagine your future employer or grandmother seeing it." },
  ],
  6: [
    { question: "What is malware?", options: ["A type of hardware", "Malicious software designed to damage or gain unauthorized access", "A software update", "A type of firewall"], correctIndex: 1, explanation: "Malware is any software intentionally designed to cause damage to computers or networks.", hint: "The name is short for two words — one describes its intent." },
    { question: "What is the difference between a virus and a worm?", options: ["They are the same thing", "A virus needs a host file, a worm can spread on its own", "A worm is harmless", "A virus can't spread"], correctIndex: 1, explanation: "Viruses attach to files and need user action to spread, while worms self-replicate across networks.", hint: "Think about whether human action is required to spread." },
    { question: "What is ransomware?", options: ["Free software", "Malware that encrypts files and demands payment", "A type of antivirus", "A security update"], correctIndex: 1, explanation: "Ransomware locks your files with encryption and demands a ransom payment for the decryption key.", hint: "The name tells you what the attacker wants from you." },
    { question: "How can you protect against malware?", options: ["Never use a computer", "Keep software updated and use reputable antivirus", "Download everything you find", "Disable your firewall"], correctIndex: 1, explanation: "Regular updates patch vulnerabilities, and antivirus software detects and removes malware.", hint: "Think about multiple layers of protection." },
    { question: "What is a trojan horse in cybersecurity?", options: ["A type of computer", "Malware disguised as legitimate software", "A helpful program", "A network cable"], correctIndex: 1, explanation: "Like its namesake, a trojan horse appears harmless but contains hidden malicious code.", hint: "Think about the ancient Greek story of deception." },
    { question: "What is a firewall?", options: ["A wall made of fire", "A security system that monitors and controls network traffic", "A type of virus", "A screen protector"], correctIndex: 1, explanation: "Firewalls act as barriers between trusted and untrusted networks, filtering traffic.", hint: "It acts as a security guard for your network." },
    { question: "What is spyware?", options: ["A spy movie", "Software that secretly monitors your computer activity", "A type of camera", "A browser extension"], correctIndex: 1, explanation: "Spyware secretly collects information about your activities without your knowledge or consent.", hint: "It watches what you do without you knowing." },
    { question: "What should you do if you suspect malware on your device?", options: ["Ignore it", "Disconnect from the internet and run a full antivirus scan", "Share it with friends", "Delete your browser"], correctIndex: 1, explanation: "Disconnecting limits damage and a full scan can detect and remove the malware.", hint: "First, stop the malware from communicating, then find it." },
    { question: "What is a botnet?", options: ["A robot network for good", "A network of infected computers controlled by an attacker", "A type of social media", "A gaming platform"], correctIndex: 1, explanation: "Botnets are collections of compromised devices that attackers use for DDoS attacks and spam.", hint: "Imagine many computers being controlled like puppets." },
    { question: "What is zero-day vulnerability?", options: ["A holiday", "A security flaw unknown to the software vendor with no available fix", "A type of update", "A password technique"], correctIndex: 1, explanation: "Zero-day vulnerabilities are unpatched security flaws that attackers can exploit before a fix exists.", hint: "The vendor has had 'zero days' to create a patch." },
  ],
};

async function generateQuestionsForLevel(levelId) {
  const level = levelDefinitions.find((l) => l.id === parseInt(levelId));
  if (!level) {
    throw new Error(`Level with ID ${levelId} not found`);
  }

  // Check cache
  const cacheKey = `level_${levelId}`;
  const cachedData = questionCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return JSON.parse(JSON.stringify(cachedData.questions));
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn("Gemini API key not found, using fallback questions");
    return getFallbackQuestions(levelId, level);
  }

  const prompt = createPromptForLevel(level);
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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

      // Cache results
      questionCache.set(cacheKey, {
        questions: finalQuestions,
        timestamp: Date.now(),
      });

      return finalQuestions;
    } catch (error) {
      retryCount++;
      console.error(`API attempt ${retryCount} failed:`, error.message);
      if (retryCount >= maxRetries) {
        console.warn("All AI attempts failed, using fallback questions");
        return getFallbackQuestions(levelId, level);
      }
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }
  }

  return getFallbackQuestions(levelId, level);
}

function getFallbackQuestions(levelId, level) {
  const questions = fallbackQuestions[levelId] || fallbackQuestions[1];
  return questions.slice(0, level.questionsCount).map((q) => ({
    ...shuffleQuestionOptions({ ...q }),
    levelId: parseInt(levelId),
    isFallback: true,
  }));
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
