import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { normalizeModelForProvider } from "@/utils/chat/modelResolver";

type ConversationMessage = {
  role?: "user" | "assistant" | "system";
  content?: string;
  attachments?: unknown;
  toolRuns?: unknown;
};

function normalizeMessages(input: unknown): Array<{
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments: unknown[];
  tool_runs: unknown[];
}> {
  if (!Array.isArray(input)) return [];

  return input
    .filter((msg): msg is ConversationMessage => typeof msg === "object" && msg !== null)
    .map((msg) => ({
      // conversation_id is filled later
      conversation_id: "",
      role:
        msg.role === "assistant" || msg.role === "system" || msg.role === "user"
          ? msg.role
          : "user",
      content: typeof msg.content === "string" ? msg.content : "",
      attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
      tool_runs: Array.isArray(msg.toolRuns) ? msg.toolRuns : [],
    }));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (convError) return NextResponse.json({ error: convError.message }, { status: 404 });

  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

  const normalizedMessages = (messages ?? []).map((message) => ({
    ...message,
    toolRuns: Array.isArray(message.tool_runs) ? message.tool_runs : [],
  }));

  return NextResponse.json({ ...conversation, messages: normalizedMessages });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.title === "string") {
      updatePayload.title = body.title;
    }

    if (typeof body.model === "string") {
      const apiBaseUrl = process.env.API_BASE_URL || "";
      updatePayload.model = normalizeModelForProvider(body.model, apiBaseUrl);
    }

    if (Array.isArray(body.messages)) {
      const normalized = normalizeMessages(body.messages).map((message) => ({
        ...message,
        conversation_id: id,
      }));

      const { error: deleteError } = await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      if (normalized.length > 0) {
        const { error: insertError } = await supabase.from("messages").insert(normalized);
        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }
    }

    const { data, error } = await supabase
      .from("conversations")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update conversation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("conversations").delete().eq("id", id).eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
