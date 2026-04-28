import { NextRequest, NextResponse } from "next/server";
import { extractErrorMessage, generateNewsAiText, getNewsServiceClient, isValidNewsAdminPassword } from "@/lib/news/server";

interface ArticleRow {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  created_at: string;
}

function getWeekRange(reference: Date) {
  const end = new Date(reference);
  const start = new Date(reference);
  start.setDate(end.getDate() - 7);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function buildWeeklyPrompt(articles: ArticleRow[], weekStart: string, weekEnd: string) {
  const digest = articles
    .map(
      (article, index) =>
        `${index + 1}. ${article.title}\n` +
        `Category: ${article.category}\n` +
        `Author: ${article.author}\n` +
        `Date: ${article.date}\n` +
        `Excerpt: ${article.excerpt}\n` +
        `Link: https://news.cjhauser.me/#article-${article.id}`
    )
    .join("\n\n");

  return `You are editing a weekly newsletter. Use only facts from the article list below.
Return strict JSON with keys: subject, preheader, intro, highlights (array of {title,summary,link}), closing, html.
The html should be a single lightweight email-safe fragment.

Week window: ${weekStart} to ${weekEnd}

Articles:
${digest}`;
}


export async function GET() {
  try {
    const supabase = getNewsServiceClient();
    const { data, error } = await supabase
      .from("newsletter_issues")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { adminPassword?: string; weekEnding?: string };
    if (!isValidNewsAdminPassword(body.adminPassword)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const referenceDate = body.weekEnding ? new Date(body.weekEnding) : new Date();
    if (Number.isNaN(referenceDate.getTime())) {
      return NextResponse.json({ error: "Invalid weekEnding date" }, { status: 400 });
    }

    const week = getWeekRange(referenceDate);
    const supabase = getNewsServiceClient();
    const { data: articles, error: articlesError } = await supabase
      .from("news_articles")
      .select("id,title,excerpt,category,author,date,created_at")
      .gte("created_at", week.startIso)
      .lte("created_at", week.endIso)
      .order("created_at", { ascending: false })
      .limit(20);

    if (articlesError) throw articlesError;
    const weeklyArticles = (articles ?? []) as ArticleRow[];
    if (!weeklyArticles.length) {
      return NextResponse.json({ error: "No articles found in the selected week" }, { status: 400 });
    }

    const aiOutput = await generateNewsAiText([
      {
        role: "system",
        content:
          "You are a precise newsletter editor. Return valid JSON only and never invent sources.",
      },
      {
        role: "user",
        content: buildWeeklyPrompt(weeklyArticles, week.startDate, week.endDate),
      },
    ]);

    const parsed = JSON.parse(aiOutput) as {
      subject?: string;
      preheader?: string;
      intro?: string;
      highlights?: Array<{ title: string; summary: string; link: string }>;
      closing?: string;
      html?: string;
    };

    const subject = parsed.subject?.trim() || `Signal Weekly • ${week.startDate} to ${week.endDate}`;
    const preheader = parsed.preheader?.trim() || "Top stories from Signal this week.";
    const intro = parsed.intro?.trim() || "";
    const closing = parsed.closing?.trim() || "";
    const highlights = Array.isArray(parsed.highlights) ? parsed.highlights : [];
    const html =
      parsed.html?.trim() ||
      `<h1>${subject}</h1><p>${intro}</p>${highlights
        .map((h) => `<h2>${h.title}</h2><p>${h.summary}</p><p><a href="${h.link}">Read article</a></p>`)
        .join("")}<p>${closing}</p>`;

    const text = [intro, ...highlights.map((h) => `${h.title}\n${h.summary}\n${h.link}`), closing]
      .filter(Boolean)
      .join("\n\n");

    const { data: issue, error: insertError } = await supabase
      .from("newsletter_issues")
      .insert({
        week_start: week.startDate,
        week_end: week.endDate,
        status: "draft",
        subject,
        preheader,
        intro,
        highlights,
        closing,
        html,
        text,
        source_article_ids: weeklyArticles.map((article) => article.id),
        ai_model: process.env.AI_MODEL ?? "gpt-4o-mini",
      })
      .select("*")
      .single();

    if (insertError) throw insertError;
    return NextResponse.json(issue, { status: 201 });
  } catch (err) {
    const message = extractErrorMessage(err, "Failed to generate newsletter issue");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
