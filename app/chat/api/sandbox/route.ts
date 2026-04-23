import { NextResponse } from "next/server";

interface CreateSandboxResponse {
  sandboxId: string | null;
  message?: string;
  error?: string;
}

export async function POST(): Promise<NextResponse<CreateSandboxResponse>> {
  // The sandbox is now created per-execution in the exec endpoint
  // This endpoint is kept for backwards compatibility but returns a placeholder
  return NextResponse.json({ 
    sandboxId: "placeholder",
    message: "Sandbox is now created per-execution. Use /chat/api/sandbox/exec directly."
  });
}