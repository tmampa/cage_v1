/**
 * Single source of truth for level definitions.
 *
 * This module replaces previously duplicated arrays in:
 *   - app/api/questions/route.js
 *   - utils/generateQuestions.js
 *   - app/game/levels/page.js
 *
 * Core fields (id/title/description/difficulty/topics/focusAreas/questionsCount)
 * are required for AI question generation. UI fields (icon/color/points) are
 * here too so the levels page can render purely from this list.
 */

/**
 * @typedef {Object} LevelDefinition
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {'Easy'|'Medium'|'Hard'} difficulty
 * @property {string[]} topics
 * @property {string[]} focusAreas
 * @property {number} questionsCount
 * @property {string} icon
 * @property {string} color   Tailwind gradient classes for the level card
 * @property {number} points  Reward points awarded for completing the level
 */

/** @type {ReadonlyArray<LevelDefinition>} */
export const LEVEL_DEFINITIONS = Object.freeze([
  {
    id: 1,
    title: 'Cyber Security Basics',
    description: 'Learn the fundamentals of staying safe online',
    difficulty: 'Easy',
    topics: ['basic internet safety', 'digital citizenship', 'online privacy fundamentals'],
    focusAreas: ['what is cyber security', 'basic online threats', 'digital footprints'],
    questionsCount: 5,
    icon: '🛡️',
    color: 'from-blue-400 to-blue-600',
    points: 100,
  },
  {
    id: 2,
    title: 'Password Protection',
    description: 'Create strong passwords and keep them safe',
    difficulty: 'Easy',
    topics: ['password strength', 'password managers', 'credential security', 'two-factor authentication'],
    focusAreas: ['creating strong passwords', 'password storage', 'authentication methods'],
    questionsCount: 6,
    icon: '🔑',
    color: 'from-green-400 to-green-600',
    points: 150,
  },
  {
    id: 3,
    title: 'Phishing Attacks',
    description: 'Identify and avoid dangerous emails and messages',
    difficulty: 'Medium',
    topics: ['phishing emails', 'suspicious links', 'social engineering tactics', 'email scams'],
    focusAreas: ['recognizing phishing emails', 'suspicious website indicators', 'social engineering red flags'],
    questionsCount: 7,
    icon: '🎣',
    color: 'from-yellow-400 to-yellow-600',
    points: 200,
  },
  {
    id: 4,
    title: 'Safe Web Browsing',
    description: 'Navigate the internet safely and avoid threats',
    difficulty: 'Medium',
    topics: ['browser security', 'safe websites', 'download safety', 'HTTPS protocols', 'URL verification'],
    focusAreas: ['identifying secure websites', 'browser privacy settings', 'safe downloading practices', 'certificate verification', 'avoiding malicious websites'],
    questionsCount: 8,
    icon: '🌐',
    color: 'from-purple-400 to-purple-600',
    points: 250,
  },
  {
    id: 5,
    title: 'Social Media Safety',
    description: 'Protect your personal information on social platforms',
    difficulty: 'Hard',
    topics: ['privacy settings', 'information sharing', 'social media scams', 'digital reputation', 'account security'],
    focusAreas: ['configuring privacy settings', 'safe information sharing', 'recognizing social media scams', 'protecting personal data', 'managing digital footprint'],
    questionsCount: 9,
    icon: '📱',
    color: 'from-pink-400 to-pink-600',
    points: 300,
  },
  {
    id: 6,
    title: 'Malware Defense',
    description: 'Understand and protect against computer viruses',
    difficulty: 'Hard',
    topics: ['malware types', 'virus protection', 'infection prevention', 'antivirus software', 'system security'],
    focusAreas: ['identifying malware types', 'antivirus best practices', 'system vulnerability protection', 'malware removal techniques', 'preventive security measures'],
    questionsCount: 10,
    icon: '🦠',
    color: 'from-red-400 to-red-600',
    points: 350,
  },
]);

export const MAX_LEVEL_ID = LEVEL_DEFINITIONS.length;

/**
 * Look up a level by id.
 * @param {number|string} id
 * @returns {LevelDefinition | undefined}
 */
export function getLevelById(id) {
  const numericId = typeof id === 'number' ? id : parseInt(id, 10);
  if (!Number.isFinite(numericId)) return undefined;
  return LEVEL_DEFINITIONS.find((l) => l.id === numericId);
}

/**
 * Whether a value parses to a valid level id.
 * @param {unknown} id
 * @returns {boolean}
 */
export function isValidLevelId(id) {
  const numericId = typeof id === 'number' ? id : parseInt(id, 10);
  return Number.isFinite(numericId) && numericId >= 1 && numericId <= MAX_LEVEL_ID;
}
