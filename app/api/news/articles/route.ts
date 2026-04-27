import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

export async function GET() {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from("news_articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch articles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPassword, title, category, date, excerpt, tags, author, read_time, body: articleBody } = body;

    if (adminPassword !== process.env.NEWS_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!title || !excerpt || !articleBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("news_articles")
      .insert({
        title,
        category: category ?? "Essay",
        date: date ?? new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        excerpt,
        tags: tags ?? [],
        author: author ?? "Editorial Team",
        read_time: read_time ?? "5 min",
        body: articleBody,
        related_ids: [],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to publish article";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
