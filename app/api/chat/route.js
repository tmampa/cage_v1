import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMIT_CONFIG } from '@/utils/rateLimiter';

// Initialize Gemini AI - using the same approach as generateQuestions.js
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

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
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.error('Gemini API key is not configured');
      return NextResponse.json(
        { error: 'Chatbot is currently unavailable. Please contact support.' },
        { status: 503 }
      );
    }
    
    // Get model configuration from environment or use defaults - using same model as generateQuestions
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '500', 10);
    const temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
    
    // Initialize model with same config as generateQuestions.js
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: temperature,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: maxTokens,
        candidateCount: 1,
      },
    });
    
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
    
    const responsePromise = model.generateContent(fullPrompt);
    
    const result = await Promise.race([responsePromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();
    
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
    configured: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });
}
