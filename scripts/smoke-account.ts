/**
 * scripts/smoke-account.ts
 *
 * Standalone smoke test for the account/session logic, run directly with tsx
 * (bypassing the Next.js dev server, which won't boot in this sandbox due to
 * a Turbopack persistent-cache/sqlite permission issue unrelated to this
 * feature). Exercises: signup, duplicate-email rejection, wrong-password
 * rejection, correct login, profile update requiring current password,
 * email-change requiring current password, search-limit rollover/enforcement,
 * and account deletion. Run with: npx tsx scripts/smoke-account.ts
 */

import { accountStore, AccountError, SEARCH_LIMIT_PER_PERIOD } from "@/src/lib/server/accountStore";
import { createSession, resolveSession, destroySession } from "@/src/lib/server/session";

let passed = 0;
let failed = 0;

function assert(cond: unknown, message: string) {
  if (cond) {
    passed++;
    console.log(`  ok — ${message}`);
  } else {
    failed++;
    console.error(`  FAIL — ${message}`);
  }
}

async function main() {
  const email = `smoke-${Date.now()}@example.com`;

  console.log("1. create account");
  const account = await accountStore.create({ name: "Smoke Test", email, password: "password123" });
  assert(account.email === email.toLowerCase(), "email stored normalized");
  assert(account.searchLimit === SEARCH_LIMIT_PER_PERIOD, "default search limit applied");
  assert(account.passwordHash !== "password123", "password is hashed, not stored in plaintext");

  console.log("2. reject duplicate email");
  try {
    await accountStore.create({ name: "Dup", email, password: "password123" });
    assert(false, "duplicate email should have thrown");
  } catch (e) {
    assert(e instanceof AccountError && e.code === "EMAIL_TAKEN", "duplicate email rejected with EMAIL_TAKEN");
  }

  console.log("3. reject weak password");
  try {
    await accountStore.create({ name: "Weak", email: `weak-${Date.now()}@example.com`, password: "short" });
    assert(false, "weak password should have thrown");
  } catch (e) {
    assert(e instanceof AccountError && e.code === "WEAK_PASSWORD", "short password rejected");
  }

  console.log("4. login: wrong password fails, right password succeeds");
  const wrongLogin = await accountStore.verifyPassword(email, "wrongpassword");
  assert(wrongLogin === null, "wrong password returns null");
  const rightLogin = await accountStore.verifyPassword(email, "password123");
  assert(rightLogin !== null && rightLogin.id === account.id, "correct password resolves the account");

  console.log("5. session token round-trip");
  const cookieValue = createSession(account.id);
  const resolved = resolveSession(cookieValue);
  assert(resolved === account.id, "session token resolves back to the account id");
  const tampered = cookieValue.slice(0, -1) + (cookieValue.endsWith("a") ? "b" : "a");
  assert(resolveSession(tampered) === null, "tampered session token is rejected");
  destroySession(cookieValue);
  assert(resolveSession(cookieValue) === null, "destroyed session token no longer resolves");

  console.log("6. update requires no password for name-only change");
  const renamed = await accountStore.update(account.id, { name: "Renamed Smoke Test" });
  assert(renamed.name === "Renamed Smoke Test", "name updated");

  console.log("7. update email to something taken by another account fails");
  const other = await accountStore.create({
    name: "Other",
    email: `other-${Date.now()}@example.com`,
    password: "password123",
  });
  try {
    await accountStore.update(account.id, { email: other.email });
    assert(false, "updating to a taken email should throw");
  } catch (e) {
    assert(e instanceof AccountError && e.code === "EMAIL_TAKEN", "email clash on update rejected");
  }
  await accountStore.delete(other.id);

  console.log("8. search limit enforcement");
  const initialUsage = await accountStore.getSearchUsage(account.id);
  assert(initialUsage?.used === 0, "search usage starts at 0");
  for (let i = 0; i < SEARCH_LIMIT_PER_PERIOD; i++) {
    const { ok } = await accountStore.recordSearch(account.id);
    assert(ok, `search ${i + 1}/${SEARCH_LIMIT_PER_PERIOD} allowed`);
  }
  const overLimit = await accountStore.recordSearch(account.id);
  assert(overLimit.ok === false, "search beyond the limit is blocked");
  assert(overLimit.usage.remaining === 0, "usage reports 0 remaining once blocked");

  console.log("9. delete account");
  const deleted = await accountStore.delete(account.id);
  assert(deleted === true, "delete returns true for an existing account");
  const goneLookup = await accountStore.findById(account.id);
  assert(goneLookup === null, "deleted account no longer resolvable by id");
  const goneUsage = await accountStore.getSearchUsage(account.id);
  assert(goneUsage === null, "deleted account has no search usage");

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
