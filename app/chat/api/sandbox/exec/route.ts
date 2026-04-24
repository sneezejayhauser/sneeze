import { NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";

interface RunCodeRequest {
  type?: "python" | "bash" | "write_file" | "read_file" | "list_dir";
  code?: string;
  language?: string;
  path?: string;
  content?: string;
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
    const { type = "python", code, language = "python", path, content } = body;

    const e2bApiKey = process.env.E2B_API_KEY;

    if (!e2bApiKey) {
      return NextResponse.json({ error: "E2B_API_KEY not configured" }, { status: 500 });
    }

    // Create a sandbox using the code-interpreter template
    sandbox = await Sandbox.create({
      apiKey: e2bApiKey,
    });

    try {
      if (type === "bash") {
        if (!code?.trim()) {
          return NextResponse.json({ error: "Missing command" }, { status: 400 });
        }

        const cmd = await sandbox.commands.run(code);
        const text = [cmd.stdout.trim(), cmd.stderr.trim()].filter(Boolean).join("\n\n");
        if (cmd.exitCode !== 0) {
          return NextResponse.json({
            error: cmd.error || `Command failed with exit code ${cmd.exitCode}`,
            logs: { stdout: [cmd.stdout], stderr: [cmd.stderr] },
          });
        }

        return NextResponse.json({
          text: text || "Command executed successfully",
          logs: { stdout: [cmd.stdout], stderr: [cmd.stderr] },
        });
      }

      if (type === "write_file") {
        if (!path?.trim()) {
          return NextResponse.json({ error: "Missing path" }, { status: 400 });
        }
        await sandbox.files.write(path, content ?? "");
        return NextResponse.json({
          text: `File written successfully: ${path}`,
          logs: { stdout: [], stderr: [] },
        });
      }

      if (type === "read_file") {
        if (!path?.trim()) {
          return NextResponse.json({ error: "Missing path" }, { status: 400 });
        }
        const text = await sandbox.files.read(path);
        return NextResponse.json({ text, logs: { stdout: [], stderr: [] } });
      }

      if (type === "list_dir") {
        const entries = await sandbox.files.list(path?.trim() || ".");
        const text = entries
          .map((entry) => `${entry.type === "dir" ? "d" : "-"} ${entry.name}`)
          .join("\n");
        return NextResponse.json({ text: text || "No files found", logs: { stdout: [], stderr: [] } });
      }

      if (!code?.trim()) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 });
      }

      // Run python/javascript code
      const execution = await sandbox.runCode(code, {
        language: (language === "javascript" ? "javascript" : "python") as "python" | "javascript",
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
