import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, validateUUID } from "@/lib/validation";
import { getNewsServiceClient } from "@/lib/news/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminPassword } = body;

    if (!validateUUID(id)) {
      return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
    }

    if (!verifyPassword(adminPassword ?? "", process.env.NEWS_ADMIN_PASSWORD ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getNewsServiceClient();
    const { data, error } = await supabase
      .from("news_articles")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete article";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
