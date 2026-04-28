import { NextRequest, NextResponse } from "next/server";
import { getNewsServiceClient, isValidNewsAdminPassword } from "@/lib/news/server";

async function sendWithResend(subject: string, html: string, recipients: string[]) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;

  if (!resendApiKey || !from) {
    throw new Error("RESEND_API_KEY and NEWSLETTER_FROM_EMAIL must be configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Failed to send newsletter: ${payload}`);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { adminPassword?: string };

    if (!isValidNewsAdminPassword(body.adminPassword)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getNewsServiceClient();
    const { data: issue, error: issueError } = await supabase
      .from("newsletter_issues")
      .select("*")
      .eq("id", id)
      .single();
    if (issueError) throw issueError;
    if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    if (issue.status !== "approved") {
      return NextResponse.json({ error: "Only approved issues can be sent" }, { status: 400 });
    }

    const { data: subscribers, error: subscribersError } = await supabase
      .from("news_subscribers")
      .select("email")
      .is("unsubscribed_at", null);
    if (subscribersError) throw subscribersError;

    const recipients = (subscribers ?? [])
      .map((entry) => entry.email)
      .filter((email): email is string => typeof email === "string" && email.length > 0);

    if (!recipients.length) {
      return NextResponse.json({ error: "No active subscribers found" }, { status: 400 });
    }

    await sendWithResend(issue.subject, issue.html, recipients);

    const { data: sentIssue, error: updateError } = await supabase
      .from("newsletter_issues")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_count: recipients.length,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (updateError) throw updateError;

    return NextResponse.json(sentIssue);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send newsletter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
