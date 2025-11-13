import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMIT_CONFIG } from '@/utils/rateLimiter';
import { constructSystemPrompt, formatConversationHistory } from '@/utils/chatbotPrompts';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
);

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
  
  if (body.gameContext && typeof body.gameContext !== 'object') {
    errors.push('Game context must be an object');
  }
  
  if (body.action && !['chat', 'hint', 'explain'].includes(body.action)) {
    errors.push('Action must be one of: chat, hint, explain');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
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
    
    // Check API key configuration
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key is not configured');
      return NextResponse.json(
        { error: 'Chatbot is currently unavailable. Please contact support.' },
        { status: 503 }
      );
    }
    
    // Get model configuration from environment or use defaults
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '500', 10);
    const temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
    
    // Initialize model
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature,
      },
    });
    
    // Construct system prompt
    const systemPrompt = constructSystemPrompt(body.gameContext, body.action);
    
    // Format conversation history
    const history = formatConversationHistory(body.conversationHistory);
    
    // Start chat session
    const chat = model.startChat({
      history: history,
      systemInstruction: systemPrompt,
    });
    
    // Send message with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    
    const responsePromise = chat.sendMessage(body.message);
    
    const result = await Promise.race([responsePromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();
    
    // Log successful request (for monitoring)
    console.log(`[Chat API] Success - IP: ${ip}, Action: ${body.action || 'chat'}, Response length: ${text.length}`);
    
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
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    configured: !!apiKey,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  });
}
