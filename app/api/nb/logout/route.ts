import { NextResponse } from "next/server";
import { clearDashboardSession } from "@/lib/bot/services/oauth";

export async function POST() {
  await clearDashboardSession();
  return NextResponse.json({ ok: true });
}
