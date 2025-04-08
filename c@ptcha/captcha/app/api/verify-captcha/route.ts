
import { NextRequest, NextResponse } from 'next/server';
const CAPTCHA_API_URL = process.env.CAPTCHA_API_URL || 'http://localhost:3001/captcha';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId, answer } = body;

        if (!sessionId || !answer) {
            return new NextResponse(JSON.stringify({ valid: false, error: 'Missing required fields' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const response = await fetch(`${CAPTCHA_API_URL}/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId, answer })
        });

        const data = await response.json();

        return new NextResponse(JSON.stringify({ valid: data.valid }), {
            status: response.ok ? 200 : 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error validating captcha:', error);
        return new NextResponse(JSON.stringify({ valid: false, error: 'Failed to validate captcha' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}