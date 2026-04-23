import { NextResponse } from "next/server";

type ExecType = "bash" | "python" | "write_file" | "read_file" | "list_dir";

interface ExecRequest {
  sandboxId: string;
  type: ExecType;
  options: {
    code?: string;
    path?: string;
    content?: string;
  };
}

interface ExecResponse {
  result?: string;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<ExecResponse>> {
  try {
    const body = (await request.json()) as ExecRequest;
    const { sandboxId, type, options } = body;

    if (!sandboxId || !type) {
      return NextResponse.json({ error: "Missing sandboxId or type" }, { status: 400 });
    }

    const e2bApiKey = process.env.E2B_API_KEY;

    if (!e2bApiKey) {
      return NextResponse.json({ error: "E2B_API_KEY not configured" }, { status: 500 });
    }

    let e2bRequest: Record<string, unknown>;

    switch (type) {
      case "bash":
        if (!options.code) {
          return NextResponse.json({ error: "Missing code for bash execution" }, { status: 400 });
        }
        e2bRequest = {
          cmd: options.code,
        };
        break;

      case "python":
        if (!options.code) {
          return NextResponse.json({ error: "Missing code for python execution" }, { status: 400 });
        }
        e2bRequest = {
          code: options.code,
          kernel: "python",
        };
        break;

      case "write_file":
        if (!options.path || options.content === undefined) {
          return NextResponse.json({ error: "Missing path or content for write_file" }, { status: 400 });
        }
        e2bRequest = {
          cmd: `cat > ${options.path} << 'SNEZ_EOF'\n${options.content}\nSNEZ_EOF`,
        };
        break;

      case "read_file":
        if (!options.path) {
          return NextResponse.json({ error: "Missing path for read_file" }, { status: 400 });
        }
        e2bRequest = {
          cmd: `cat ${options.path}`,
        };
        break;

      case "list_dir":
        if (!options.path) {
          return NextResponse.json({ error: "Missing path for list_dir" }, { status: 400 });
        }
        e2bRequest = {
          cmd: `ls -la ${options.path}`,
        };
        break;

      default:
        return NextResponse.json({ error: `Unknown exec type: ${type}` }, { status: 400 });
    }

    const response = await fetch(
      `https://api.e2b.dev/v1/sandboxes/${sandboxId}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${e2bApiKey}`,
        },
        body: JSON.stringify({
          method: "POST",
          path: "/api/v1/exec",
          body: e2bRequest,
          timeout: 60000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `E2B API error: ${errorText}` }, { status: response.status });
    }

    const data = (await response.json()) as { stdout?: string; stderr?: string; logs?: string };
    let result = data.stdout || data.logs || "";

    if (data.stderr) {
      result = result ? `${result}\nSTDERR:\n${data.stderr}` : `STDERR:\n${data.stderr}`;
    }

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute in sandbox";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
