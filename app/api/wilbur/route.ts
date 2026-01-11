import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, acct_id } = body;
    
    if (!message || !acct_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Message and account ID are required" 
        },
        { status: 400 }
      );
    }
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('WilburAI: OPENAI_API_KEY is missing');
      return NextResponse.json({ 
        success: true, 
        response: "WilburAI requires an OPENAI_API_KEY environment variable to be configured. Please contact your administrator to enable this feature."
      });
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Use Chat Completions API with WilburAI system prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are WilburAI, a knowledgeable legal assistant specializing in property tax sales, tax deeds, tax liens, and related legal processes. 

Your role is to:
- Provide clear, accurate information about property tax sales and related legal topics
- Explain complex legal concepts in understandable terms
- Help users understand tax deed sales, tax liens, redemption rights, and legal procedures
- Answer questions about legal documents needed for property tax sales

Important guidelines:
- Always remind users that you provide general legal information, not legal advice
- Encourage users to consult with a qualified attorney for specific legal matters
- Be professional, helpful, and thorough in your responses
- Use clear language while maintaining legal accuracy
- Format your responses in a readable way with paragraphs and bullet points when appropriate`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0]?.message?.content || 
      "I apologize, but I couldn't generate a response. Please try asking your question differently.";
    
    return NextResponse.json({ success: true, response: aiResponse });
  } catch (e: any) {
    console.error('WilburAI error:', e);
    console.error('Error details:', {
      message: e.message,
      stack: e.stack,
      name: e.name
    });
    
    // Fallback response
    return NextResponse.json({ 
      success: true, 
      response: `I'm experiencing technical difficulties at the moment. Please try again later or contact support.`
    });
  }
}
