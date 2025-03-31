import { NextResponse } from "next/server";

export async function GET() {
  const backendRes = await fetch("http://localhost:3001/captcha/generate");

  if (!backendRes.ok) {
    console.error("Failed to fetch CAPTCHA data from backend.");
    return NextResponse.json({ error: "Failed to fetch CAPTCHA data" }, { status: backendRes.status });
  }

  const sessionId = backendRes.headers.get("x-session-id"); // Assuming the backend sends the session ID in a header
  const imageBuffer = await backendRes.arrayBuffer(); // Read the binary image data

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID not provided by backend" }, { status: 500 });
  }
  return NextResponse.json({
    sessionId,
    imageUrl: `data:image/png;base64,${Buffer.from(imageBuffer).toString("base64")}`, // Convert binary to Base64
  });
}