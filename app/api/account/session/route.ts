/**
 * POST   /api/account/session  — log in (email + password), starts a session cookie
 * DELETE /api/account/session  — log out, clears the session cookie
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { accountStore, toPublicAccount } from "@/src/lib/server/accountStore";
import { createSession, destroySession, SESSION_COOKIE, SESSION_TTL_MS } from "@/src/lib/server/session";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const account = await accountStore.verifyPassword(email, password);
  if (!account) {
    return NextResponse.json(
      { error: "Incorrect email or password.", code: "INVALID_CREDENTIALS" },
      { status: 401 }
    );
  }

  const cookieValue = createSession(account.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  const usage = await accountStore.getSearchUsage(account.id);
  return NextResponse.json({ account: toPublicAccount(account), usage }, { status: 200 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;
  destroySession(cookieValue);
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true }, { status: 200 });
}
