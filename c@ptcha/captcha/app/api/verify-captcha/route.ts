import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { sessionId, answer } = await req.json(); // Parse the JSON body from the request

        const backendRes = await fetch("http://localhost:3001/captcha/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, answer }),
        });

        if (!backendRes.ok) {
            return NextResponse.json(
                { error: "Failed to validate CAPTCHA" },
                { status: backendRes.status }
            );
        }

        const result = await backendRes.json();
        console.log(result)
        return NextResponse.json({ valid: result.valid });
    } catch (error) {
        console.error("Error validating CAPTCHA:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}