import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, validateArticleBody } from "@/lib/validation";
import { getNewsAnonClient, getNewsServiceClient } from "@/lib/news/server";

export async function GET() {
  try {
    const supabase = getNewsAnonClient();
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

    if (!verifyPassword(adminPassword ?? "", process.env.NEWS_ADMIN_PASSWORD ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!title || !excerpt || !articleBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bodyValidation = validateArticleBody(articleBody);
    if (!bodyValidation.valid) {
      return NextResponse.json({ error: bodyValidation.error }, { status: 400 });
    }

    const supabase = getNewsServiceClient();
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
        generation_source: "human",
        fact_check_status: "verified",
        editor_approved_at: new Date().toISOString(),
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
