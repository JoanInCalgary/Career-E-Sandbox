/**
 * POST /api/account
 *
 * Creates a new Auth user (+ empty profile via DB trigger).
 * If email confirmation is enabled, no session is created until the user confirms.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  AccountError,
  signUpAccount,
  toPublicAccount,
} from "@/src/lib/server/accountStore";

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    engagement?: string[];
  };
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
    const result = await signUpAccount({
      name,
      email,
      password,
      engagement: Array.isArray(engagement) ? engagement.filter((e) => typeof e === "string") : [],
    });

    if (result.needsEmailConfirmation) {
      return NextResponse.json(
        {
          needsEmailConfirmation: true,
          message:
            "Account created. Check your email for a confirmation link before signing in.",
        },
        { status: 201 }
      );
    }

    if (!result.account) {
      return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
    }

    return NextResponse.json(
      { account: toPublicAccount(result.account), usage: result.usage },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AccountError) {
      const status = err.code === "EMAIL_TAKEN" ? 409 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error("[/api/account] Error:", err);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
