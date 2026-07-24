/**
 * POST   /api/account/session  — log in (email + password) via Supabase Auth
 * DELETE /api/account/session  — log out
 */

import { NextRequest, NextResponse } from "next/server";
import {
  AccountError,
  getSearchUsage,
  signInAccount,
  signOutAccount,
  toPublicAccount,
} from "@/src/lib/server/accountStore";

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

  try {
    const account = await signInAccount(email, password);
    const usage = await getSearchUsage(account.id);
    return NextResponse.json({ account: toPublicAccount(account), usage }, { status: 200 });
  } catch (err) {
    if (err instanceof AccountError) {
      const status = err.code === "EMAIL_NOT_CONFIRMED" ? 403 : 401;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error("[/api/account/session] Error:", err);
    return NextResponse.json({ error: "Unable to log in." }, { status: 500 });
  }
}

export async function DELETE() {
  await signOutAccount();
  return NextResponse.json({ ok: true }, { status: 200 });
}
