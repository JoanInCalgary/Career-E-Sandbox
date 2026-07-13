/**
 * POST /api/account
 *
 * Creates a new user account (+ empty profile) and starts a session for it.
 *
 * Request body: { name: string; email: string; password: string; engagement?: string[] }
 * Response: { account: PublicAccount, usage: SearchUsage } or { error, code } on failure
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { accountStore, AccountError, toPublicAccount } from "@/src/lib/server/accountStore";
import { createSession, SESSION_COOKIE, SESSION_TTL_MS } from "@/src/lib/server/session";

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; password?: string; confirmPassword?: string; engagement?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, password, confirmPassword, engagement } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }
  if (typeof confirmPassword === "string" && confirmPassword !== password) {
    return NextResponse.json({ error: "Passwords do not match.", code: "PASSWORD_MISMATCH" }, { status: 400 });
  }

  try {
    const account = await accountStore.create({
      name,
      email,
      password,
      engagement: Array.isArray(engagement) ? engagement.filter((e) => typeof e === "string") : [],
    });

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
    return NextResponse.json({ account: toPublicAccount(account), usage }, { status: 201 });
  } catch (err) {
    if (err instanceof AccountError) {
      const status = err.code === "EMAIL_TAKEN" ? 409 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error("[/api/account] Error:", err);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
