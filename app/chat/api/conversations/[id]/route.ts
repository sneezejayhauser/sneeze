import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { normalizeModelForProvider } from "@/utils/chat/modelResolver";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  return NextResponse.json({ ...conversation, messages });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    updatePayload.messages = body.messages;
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
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
