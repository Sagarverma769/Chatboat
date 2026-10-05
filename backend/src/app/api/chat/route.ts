import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { history, message, role } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        response: 'API Key missing in environment.\n\n⚠️ If you do not know how to resolve this, please contact the IT team.'
      });
    }

    const systemInstruction = role === 'admin'
      ? 'You are an Admin Security AI for IND SPHINX. Provide technical and security guidance.'
      : 'You are an IT Support AI Assistant for IND SPHINX. Answer user queries clearly with step-by-step troubleshooting steps.';

    // Format previous messages for Gemini contents API
    const formattedContents = [];

    // System prompt as first turn
    formattedContents.push({
      role: 'user',
      parts: [{ text: `System Instruction: ${systemInstruction}` }]
    });
    formattedContents.push({
      role: 'model',
      parts: [{ text: 'Understood. How can I assist you today?' }]
    });

    // Append conversation history
    if (Array.isArray(history)) {
      history.forEach((msg: { sender: string; text: string }) => {
        formattedContents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Append latest prompt
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: formattedContents })
      }
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({
        response: `Gemini API Error: ${data.error.message}\n\n⚠️ If you do not know how to resolve this, please contact the IT team.`
      });
    }

    let aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiReply) {
      aiReply = "I couldn't process that request right now.";
    }

    // Append mandatory IT disclaimer
    aiReply += '\n\n⚠️ Note: If you do not know how to resolve this or need further assistance, please contact the IT team.';

    return NextResponse.json({ response: aiReply });
  } catch (error) {
    return NextResponse.json({
      response: 'Unable to process your request right now.\n\n⚠️ If you do not know how to resolve this, please contact the IT team.'
    });
  }
}
