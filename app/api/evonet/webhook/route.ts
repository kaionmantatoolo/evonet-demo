import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await req.json();
  } catch {
    // Ignore parse errors; still return SUCCESS per Evonet docs
  }
  return new NextResponse("SUCCESS", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
