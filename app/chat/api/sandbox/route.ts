import { NextResponse } from "next/server";

interface CreateSandboxResponse {
  sandboxId: string | null;
  error?: string;
}

export async function POST(): Promise<NextResponse<CreateSandboxResponse>> {
  try {
    const e2bApiKey = process.env.E2B_API_KEY;

    if (!e2bApiKey) {
      return NextResponse.json(
        { sandboxId: null, error: "E2B_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.e2b.dev/v1/sandboxes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${e2bApiKey}`,
      },
      body: JSON.stringify({
        timeout: 300,
        metadata: { description: "Sneeze chat sandbox" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { sandboxId: null, error: `E2B API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as { sandbox_id?: string; id?: string };
    const sandboxId = data.sandbox_id || data.id || null;

    if (!sandboxId) {
      return NextResponse.json(
        { sandboxId: null, error: "No sandbox ID returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sandboxId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create sandbox";
    return NextResponse.json({ sandboxId: null, error: message }, { status: 500 });
  }
}
