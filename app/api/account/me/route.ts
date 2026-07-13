/**
 * GET    /api/account/me  — current account (from session cookie) + search usage
 * PATCH  /api/account/me  — update name / email / password / profile / engagement
 * DELETE /api/account/me  — permanently delete the current account
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { accountStore, AccountError, toPublicAccount } from "@/src/lib/server/accountStore";
import { getCurrentAccount } from "@/src/lib/server/currentAccount";
import { destroyAllSessionsForAccount, SESSION_COOKIE } from "@/src/lib/server/session";
import type { FullAssessmentPayload } from "@/src/lib/types";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const usage = await accountStore.getSearchUsage(account.id);
  return NextResponse.json({ account: toPublicAccount(account), usage }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    profile?: FullAssessmentPayload | null;
    engagement?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Changing email or password requires re-confirming the current password,
  // same as most account-settings flows.
  const changesEmailOrPassword = Boolean(body.newPassword || body.email);
  if (changesEmailOrPassword) {
    if (!body.currentPassword) {
      return NextResponse.json(
        { error: "Enter your current password to change your email or password.", code: "CURRENT_PASSWORD_REQUIRED" },
        { status: 400 }
      );
    }
    const verified = await accountStore.verifyPassword(account.email, body.currentPassword);
    if (!verified) {
      return NextResponse.json(
        { error: "Current password is incorrect.", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }
  }

  try {
    const updated = await accountStore.update(account.id, {
      name: body.name,
      email: body.email,
      password: body.newPassword,
      profile: body.profile,
      engagement: body.engagement,
    });
    const usage = await accountStore.getSearchUsage(updated.id);
    return NextResponse.json({ account: toPublicAccount(updated), usage }, { status: 200 });
  } catch (err) {
    if (err instanceof AccountError) {
      const status = err.code === "EMAIL_TAKEN" ? 409 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error("[/api/account/me] PATCH error:", err);
    return NextResponse.json({ error: "Unable to update account." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { currentPassword?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional for DELETE, but if present it must be valid JSON.
  }

  if (body.currentPassword) {
    const verified = await accountStore.verifyPassword(account.email, body.currentPassword);
    if (!verified) {
      return NextResponse.json(
        { error: "Current password is incorrect.", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }
  }

  await accountStore.delete(account.id);
  destroyAllSessionsForAccount(account.id);

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);

  return NextResponse.json({ ok: true }, { status: 200 });
}
