import { NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";

interface RunCodeRequest {
  code: string;
  language?: string;
}

interface RunCodeResponse {
  text?: string;
  logs?: {
    stdout: string[];
    stderr: string[];
  };
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<RunCodeResponse>> {
  try {
    const body = (await request.json()) as RunCodeRequest;
    const { code, language = "python" } = body;

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const e2bApiKey = process.env.E2B_API_KEY;

    if (!e2bApiKey) {
      return NextResponse.json({ error: "E2B_API_KEY not configured" }, { status: 500 });
    }

    // Create a sandbox using the code-interpreter template
    const sandbox = await Sandbox.create({
      apiKey: e2bApiKey,
      timeoutMs: 60000, // 60 seconds
    });

    try {
      // Run the code
      const execution = await sandbox.runCode(code, {
        language,
        timeoutMs: 60000,
      });

      // Collect logs
      const stdout = execution.logs.stdout.join("");
      const stderr = execution.logs.stderr.join("");

      // Get the main result text
      const resultText = execution.text;

      // Combine result with logs
      let responseText = resultText || "";
      if (stderr) {
        responseText = responseText ? `${responseText}\n\nSTDERR:\n${stderr}` : `STDERR:\n${stderr}`;
      }
      if (stdout && !responseText.includes(stdout)) {
        responseText = responseText ? `${responseText}\n\nSTDOUT:\n${stdout}` : stdout;
      }

      return NextResponse.json({
        text: responseText,
        logs: execution.logs,
      });
    } finally {
      // Always stop/kill the sandbox
      await sandbox.kill();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute code";
    return NextResponse.json({ error: message, logs: { stdout: [], stderr: [] } }, { status: 500 });
  }
}