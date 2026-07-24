/**
 * GET    /api/account/me  — current account + search usage
 * PATCH  /api/account/me  — update name / email / password / profile / engagement
 * DELETE /api/account/me  — permanently delete the current Auth user (+ cascaded rows)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  AccountError,
  deleteAccount,
  getSearchUsage,
  toPublicAccount,
  updateAccount,
  verifyCurrentPassword,
} from "@/src/lib/server/accountStore";
import { getCurrentAccount } from "@/src/lib/server/currentAccount";
import type { FullAssessmentPayload } from "@/src/lib/types";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const usage = await getSearchUsage(account.id);
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

  const changesEmailOrPassword = Boolean(body.newPassword || body.email);
  if (changesEmailOrPassword) {
    if (!body.currentPassword) {
      return NextResponse.json(
        {
          error: "Enter your current password to change your email or password.",
          code: "CURRENT_PASSWORD_REQUIRED",
        },
        { status: 400 }
      );
    }
    const verified = await verifyCurrentPassword(account.email, body.currentPassword);
    if (!verified) {
      return NextResponse.json(
        { error: "Current password is incorrect.", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }
  }

  try {
    const updated = await updateAccount(account.id, {
      name: body.name,
      email: body.email,
      password: body.newPassword,
      profile: body.profile,
      engagement: body.engagement,
    });
    const usage = await getSearchUsage(updated.id);
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
    // optional body
  }

  if (body.currentPassword) {
    const verified = await verifyCurrentPassword(account.email, body.currentPassword);
    if (!verified) {
      return NextResponse.json(
        { error: "Current password is incorrect.", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }
  }

  try {
    await deleteAccount(account.id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err instanceof AccountError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    console.error("[/api/account/me] DELETE error:", err);
    return NextResponse.json({ error: "Unable to delete account." }, { status: 500 });
  }
}
