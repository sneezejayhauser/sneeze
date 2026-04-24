import { NextResponse } from "next/server";

interface CreateSandboxResponse {
  sandboxId: string | null;
  message?: string;
  error?: string;
}

export async function POST(): Promise<NextResponse<CreateSandboxResponse>> {
  const e2bApiKey = process.env.E2B_API_KEY;
  if (!e2bApiKey) {
    return NextResponse.json(
      { sandboxId: null, error: "E2B_API_KEY not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sandboxId: "ephemeral",
    message: "Sandbox checks passed. Execution uses short-lived per-request sandboxes.",
  });
}
