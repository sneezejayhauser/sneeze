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
  let sandbox: Sandbox | null = null;

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
    sandbox = await Sandbox.create({
      apiKey: e2bApiKey,
    });

    try {
      // Run the code with the specified language
      const execution = await sandbox.runCode(code, {
        language: language as "python" | "javascript",
      });

      // Handle execution error
      if (execution.error) {
        // ExecutionError has name, value, and traceback properties
        const errorMessage = execution.error.traceback 
          ? `${execution.error.name}: ${execution.error.value}\n${execution.error.traceback}`
          : `${execution.error.name}: ${execution.error.value}`;
        return NextResponse.json({
          error: errorMessage || "Code execution failed",
          logs: execution.logs,
        });
      }

      // Extract text results from execution
      const textResults = execution.results
        .filter((r) => r.isMainResult)
        .map((r) => {
          if ("text" in r && r.text) {
            return r.text;
          }
          // Check for rawData with text property using type-safe access
          if (typeof r === "object" && r !== null && "rawData" in r) {
            const rawData = (r as { rawData?: { text?: string } }).rawData;
            if (rawData && typeof rawData === "object" && "text" in rawData && rawData.text) {
              return rawData.text;
            }
          }
          return "";
        })
        .filter(Boolean)
        .join("\n\n");

      // Combine results with logs
      let responseText = textResults || "";
      
      if (execution.logs.stderr.length > 0) {
        responseText = responseText
          ? `${responseText}\n\nSTDERR:\n${execution.logs.stderr.join("\n")}`
          : `STDERR:\n${execution.logs.stderr.join("\n")}`;
      }

      return NextResponse.json({
        text: responseText || "Code executed successfully",
        logs: execution.logs,
      });
    } finally {
      // Always kill the sandbox
      if (sandbox) {
        await sandbox.kill();
      }
    }
  } catch (error) {
    // Kill sandbox on error
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch {
        // ignore kill errors
      }
    }

    const message = error instanceof Error ? error.message : "Failed to execute code";
    return NextResponse.json({ error: message, logs: { stdout: [], stderr: [] } }, { status: 500 });
  }
}