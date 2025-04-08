export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
const CAPTCHA_API_URL = process.env.CAPTCHA_API_URL || 'http://localhost:3001/captcha';

export async function GET(request: NextRequest) {
  try {

    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Call the NestJS backend
    const response = await fetch(`${CAPTCHA_API_URL}/generate`, {
      method: 'GET',
      headers: {
        'X-Forwarded-For': ip
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to generate captcha: ${response.status}`);
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();

    // Get the session ID from the header
    const sessionId = response.headers.get('X-Session-Id');
    const imageUrl = `data:image/png;base64,${Buffer.from(imageBuffer).toString("base64")}`;
    console.log('this is my session id')
    console.log(sessionId)
    const res = new Response(imageUrl, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'X-Session-Id': sessionId || '',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    return res;
  } catch (error) {
    console.error('Error generating captcha:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate captcha' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
