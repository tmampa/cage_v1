import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db.js';
import { COOKIE_NAME, verifyJWT } from '../../../lib/auth.js';
import { chatMessages, users } from '../../../db/schema.js';
import { checkRateLimit, RATE_LIMIT_CONFIG } from '@/utils/rateLimiter';

// Initialize Gemini AI with server-only API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Validate request body
 * @param {object} body - Request body
 * @returns {object} - Validation result
 */
function validateRequest(body) {
  const errors = [];
  
  if (!body.message || typeof body.message !== 'string') {
    errors.push('Message is required and must be a string');
  } else if (body.message.length > 500) {
    errors.push('Message must be 500 characters or less');
  } else if (body.message.trim().length === 0) {
    errors.push('Message cannot be empty');
  }
  
  if (body.conversationHistory && !Array.isArray(body.conversationHistory)) {
    errors.push('Conversation history must be an array');
  }

  if (body.sessionId && typeof body.sessionId !== 'string') {
    errors.push('Session ID must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function normalizeSessionId(sessionId) {
  if (typeof sessionId === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(sessionId)) {
    return sessionId;
  }

  return `server-${Date.now()}`;
}

async function getAuthenticatedChatUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  const [user] = await db
    .select({
      id:      users.id,
      isAdmin: users.isAdmin,
    })
    .from(users)
    .where(eq(users.id, Number(payload.sub)))
    .limit(1);

  return user || null;
}

async function saveChatMessage({ chatUser, sessionId, role, content }) {
  if (!chatUser || chatUser.isAdmin) return;

  try {
    await db.insert(chatMessages).values({
      userId: chatUser.id,
      sessionId,
      role,
      content,
    });
  } catch (error) {
    console.error('[Chat API] Failed to save chat message:', error);
  }
}



/**
 * POST handler for chat endpoint
 */
export async function POST(request) {
  try {
    // Get user identifier for rate limiting (IP address)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: RATE_LIMIT_CONFIG.message,
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': rateLimitResult.retryAfter.toString()
          }
        }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request
    const validation = validateRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    const sessionId = normalizeSessionId(body.sessionId);
    const chatUser = await getAuthenticatedChatUser();
    await saveChatMessage({
      chatUser,
      sessionId,
      role: 'user',
      content: body.message.trim(),
    });
    
    // Check API key configuration
    if (!process.env.GEMINI_API_KEY) {
      console.error('Gemini API key is not configured');
      return NextResponse.json(
        { error: 'Chatbot is currently unavailable. Please contact support.' },
        { status: 503 }
      );
    }
    
    // Get model configuration from environment or use defaults
    const modelName = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
    const maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '500', 10);
    const temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
    
    // Simple system prompt without game context
    const systemPrompt = `You are a friendly AI tutor helping students learn cybersecurity through the CagE game.

Guidelines:
- Be encouraging and supportive
- Use simple language appropriate for students
- Provide clear, concise explanations
- Use emojis occasionally to be friendly (🔒, 🛡️, 💡, etc.)
- IMPORTANT: Keep responses SHORT - maximum 600 characters (about 3-4 sentences)
- Focus on cybersecurity education
- Get straight to the point`;
    
    // Format conversation history as a single prompt
    let fullPrompt = systemPrompt + '\n\n';
    
    // Add conversation history to the prompt
    if (body.conversationHistory && body.conversationHistory.length > 0) {
      fullPrompt += 'Previous conversation:\n';
      body.conversationHistory.slice(-10).forEach(msg => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        fullPrompt += `${role}: ${msg.content}\n`;
      });
      fullPrompt += '\n';
    }
    
    // Add current message
    fullPrompt += `User: ${body.message}\n\nAssistant:`;
    
    // Generate response with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    
    const responsePromise = ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
      config: {
        temperature: temperature,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: maxTokens,
      },
    });
    
    const result = await Promise.race([responsePromise, timeoutPromise]);
    const text = result.text;
    await saveChatMessage({
      chatUser,
      sessionId,
      role: 'assistant',
      content: text,
    });
    
    // Log successful request (for monitoring)
    console.log(`[Chat API] Success - IP: ${ip}, Response length: ${text.length}`);
    
    return NextResponse.json({ message: text });
    
  } catch (error) {
    console.error('[Chat API] Error:', error);
    
    // Handle specific error types
    if (error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'Response is taking longer than expected. Please try again.' },
        { status: 504 }
      );
    }
    
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Chatbot is currently unavailable. Please contact support.' },
        { status: 503 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { error: 'Sorry, I couldn\'t process that. Please try rephrasing.' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - return API status
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    configured: !!process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
  });
}
