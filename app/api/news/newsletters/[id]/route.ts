import { NextRequest, NextResponse } from "next/server";
import { extractErrorMessage, getNewsServiceClient, isValidNewsAdminPassword } from "@/lib/news/server";

interface IssuePatchBody {
  adminPassword?: string;
  status?: "draft" | "approved" | "sent";
  subject?: string;
  preheader?: string;
  intro?: string;
  closing?: string;
  html?: string;
  text?: string;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as IssuePatchBody;

    if (!isValidNewsAdminPassword(body.adminPassword)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.subject === "string") updates.subject = body.subject.trim();
    if (typeof body.preheader === "string") updates.preheader = body.preheader.trim();
    if (typeof body.intro === "string") updates.intro = body.intro;
    if (typeof body.closing === "string") updates.closing = body.closing;
    if (typeof body.html === "string") updates.html = body.html;
    if (typeof body.text === "string") updates.text = body.text;
    if (body.status) updates.status = body.status;

    if (body.status === "approved") {
      updates.approved_at = new Date().toISOString();
    }

    const supabase = getNewsServiceClient();
    const { data, error } = await supabase
      .from("newsletter_issues")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const message = extractErrorMessage(err, "Failed to update newsletter issue");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
