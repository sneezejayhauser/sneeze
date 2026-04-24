import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getDefaultModelForProvider, normalizeModelForProvider } from "@/utils/chat/modelResolver";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, model } = await request.json();
  const apiBaseUrl = process.env.API_BASE_URL || "";
  const resolvedModel = normalizeModelForProvider(
    typeof model === "string" ? model : getDefaultModelForProvider(apiBaseUrl),
    apiBaseUrl
  );

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      title: title || "New chat",
      model: resolvedModel,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
