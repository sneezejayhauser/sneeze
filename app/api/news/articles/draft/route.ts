import { NextRequest, NextResponse } from "next/server";
import { extractErrorMessage, generateNewsAiText, isValidNewsAdminPassword } from "@/lib/news/server";

interface DraftRequestBody {
  adminPassword?: string;
  topic?: string;
  audience?: string;
  tone?: string;
  length?: "short" | "medium" | "long";
  references?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DraftRequestBody;
    if (!isValidNewsAdminPassword(body.adminPassword)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!body.topic?.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const targetWords =
      body.length === "short" ? 500 : body.length === "long" ? 1600 : 1000;
    const references = (body.references ?? []).filter((ref) => typeof ref === "string" && ref.trim());

    const prompt = `Write a high-quality draft news article in Markdown.
Output strict JSON with keys: title, excerpt, category, tags, read_time, body, fact_checks.

Constraints:
- Target audience: ${body.audience ?? "General readers"}.
- Tone: ${body.tone ?? "Crisp, thoughtful, editorial"}.
- Target length: about ${targetWords} words.
- Topic: ${body.topic.trim()}.
- Use headings and short paragraphs.
- If uncertain about a claim, phrase cautiously.
- fact_checks should be an array of claims an editor should verify before publishing.

References:
${references.length ? references.map((ref, i) => `${i + 1}. ${ref}`).join("\n") : "None provided."}`;

    const result = await generateNewsAiText([
      {
        role: "system",
        content:
          "You are a newsroom writing assistant. Return valid JSON only. Do not include markdown code fences.",
      },
      { role: "user", content: prompt },
    ]);

    const parsed = JSON.parse(result) as {
      title?: string;
      excerpt?: string;
      category?: string;
      tags?: string[];
      read_time?: string;
      body?: string;
      fact_checks?: string[];
    };

    return NextResponse.json({
      article: {
        title: parsed.title ?? body.topic,
        excerpt: parsed.excerpt ?? "",
        category: parsed.category ?? "Analysis",
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        read_time: parsed.read_time ?? "6 min",
        body: parsed.body ?? "",
      },
      factChecks: Array.isArray(parsed.fact_checks) ? parsed.fact_checks : [],
      generationSource: "ai_draft",
      requiresHumanApproval: true,
    });
  } catch (err) {
    const message = extractErrorMessage(err, "Failed to generate draft");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
