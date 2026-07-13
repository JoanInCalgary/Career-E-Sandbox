"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/src/components/AppNav";
import { useAuth } from "@/src/components/AuthProvider";

function Banner({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const styles =
    tone === "error"
      ? "border-[#EE0000]/30 bg-[#FFEEEE] text-[#CC0000]"
      : "border-[#00AA55]/30 bg-[#EEFFF6] text-[#007744]";
  return <div className={`mb-5 rounded-lg border px-3 py-2.5 text-sm ${styles}`}>{children}</div>;
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, updateAccount, deleteAccount } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sync the editable fields once the account loads, without a setState-in-effect
  // (React's recommended "adjusting state during render" pattern).
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  if (user && user.id !== loadedForId) {
    setLoadedForId(user.id);
    setName(user.name);
    setEmail(user.email);
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-cream">
        <AppNav active="account" />
      </div>
    );
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const patch: Parameters<typeof updateAccount>[0] = {};
    if (name !== user!.name) patch.name = name;
    if (email !== user!.email) patch.email = email;
    if (newPassword) patch.newPassword = newPassword;
    if ((patch.email || patch.newPassword) && !currentPassword) {
      setProfileError("Enter your current password to change your email or password.");
      return;
    }
    if (currentPassword) patch.currentPassword = currentPassword;

    if (Object.keys(patch).length === 0) {
      setProfileSuccess("Nothing to update.");
      return;
    }

    setSavingProfile(true);
    const result = await updateAccount(patch);
    setSavingProfile(false);

    if (!result.ok) {
      setProfileError(result.error ?? "Unable to update account.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setProfileSuccess("Account updated.");
  }

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    const result = await deleteAccount(deletePassword || undefined);
    setDeleting(false);
    if (!result.ok) {
      setDeleteError(result.error ?? "Unable to delete account.");
      return;
    }
    router.push("/");
  }

  const usage = user.searchUsage;
  const usagePct = usage ? Math.min(100, Math.round((usage.used / Math.max(usage.limit, 1)) * 100)) : 0;

  return (
    <div className="min-h-screen bg-cream">
      <AppNav active="account" />
      <main className="max-w-2xl mx-auto p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Account Settings</h1>
          <p className="text-sm text-[#555555] mt-1">Manage your profile, password, and usage.</p>
        </div>

        {/* ── Search usage ── */}
        <section className="bg-cream rounded-xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
          <h2 className="text-sm font-bold text-[#111111] mb-1">Search Usage</h2>
          {usage ? (
            <>
              <p className="text-xs text-[#888888] mb-3">
                {usage.used} of {usage.limit} searches used this period · resets{" "}
                {new Date(usage.periodResetsAt).toLocaleDateString()}
              </p>
              <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${usagePct}%`, backgroundColor: usagePct >= 100 ? "#EE0000" : "#FF5500" }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-[#888888]">No usage data yet.</p>
          )}
        </section>

        {/* ── Profile / password ── */}
        <section className="bg-cream rounded-xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
          <h2 className="text-sm font-bold text-[#111111] mb-4">Profile</h2>

          {profileError && <Banner tone="error">{profileError}</Banner>}
          {profileSuccess && <Banner tone="success">{profileSuccess}</Banner>}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-widest block mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-widest block mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-widest block mb-2">
                New Password <span className="normal-case font-normal text-[#888888]">(optional)</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-widest block mb-2">
                Current Password{" "}
                <span className="normal-case font-normal text-[#888888]">
                  (required to change email or password)
                </span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="bg-[#FF5500] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#DD4400] transition-colors disabled:opacity-60"
            >
              {savingProfile ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </section>

        {/* ── Danger zone ── */}
        <section className="bg-cream rounded-xl border border-[#EE0000]/30 p-6">
          <h2 className="text-sm font-bold text-[#CC0000] mb-1">Delete Account</h2>
          <p className="text-xs text-[#888888] mb-4">
            Permanently deletes your account, saved profile, and search history. This cannot be undone.
          </p>

          {deleteError && <Banner tone="error">{deleteError}</Banner>}

          {confirmingDelete ? (
            <div className="space-y-3">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#EE0000]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(false);
                    setDeletePassword("");
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold border border-[#E8E8E8] rounded text-[#555555] hover:bg-[#F5F5F5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-semibold bg-[#EE0000] text-white rounded hover:bg-[#CC0000] transition-colors disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Permanently Delete Account"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="px-4 py-2 text-sm font-semibold border border-[#EE0000] text-[#EE0000] rounded hover:bg-[#FFEEEE] transition-colors"
            >
              Delete Account
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
