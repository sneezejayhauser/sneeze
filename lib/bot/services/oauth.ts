import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "nb_dash_session";
const COOKIE_TTL_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  userId: string;
  username: string;
  accessToken: string;
  expiresAt: number;
};

function getSecret() {
  const secret = process.env.NB_DASHBOARD_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing NB_DASHBOARD_SESSION_SECRET env var");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function encodeSession(session: SessionPayload) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function decodeSession(value: string): SessionPayload | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
  if (parsed.expiresAt < Date.now()) return null;
  return parsed;
}

export async function setDashboardSession(input: { userId: string; username: string; accessToken: string }) {
  const store = await cookies();
  const expiresAt = Date.now() + COOKIE_TTL_SECONDS * 1000;
  const value = encodeSession({ ...input, expiresAt });
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_TTL_SECONDS,
  });
}

export async function clearDashboardSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getDashboardSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}
