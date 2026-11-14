"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LockKeyhole, LogOut, Trash2, UserRound, ShieldCheck } from "@/components/icons";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getLocalUser, clearLocalUser } from "@/lib/local-store";

export function ProfileClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");

  useEffect(() => {
    queueMicrotask(async () => {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            setEmail(data.user.email ?? "");
            setDisplayName(data.user.user_metadata?.name || data.user.email?.split("@")[0] || "");
            const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
            setRole(profile?.role ?? "user");
            return;
          }
        } catch {}
      }

      const local = getLocalUser();
      if (local) {
        setEmail(local.email);
        setDisplayName(local.name || local.email.split("@")[0]);
        setRole(local.role);
      }
    });
  }, []);

  async function handleSignOut() {
    if (isSupabaseConfigured()) {
      try {
        await createClient().auth.signOut();
      } catch {}
    }
    clearLocalUser();
    setEmail("");
    setDisplayName("");
    setRole("user");
    router.push("/login");
    router.refresh();
  }

  async function deleteData() {
    if (!confirm("Permanently delete your retained scans, package images, reports, and review history?")) return;
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: images } = await supabase.from("scan_images").select("storage_path");
        if (images?.length) await supabase.storage.from("package-images").remove(images.map((image) => image.storage_path));
        const { error } = await supabase.rpc("delete_my_pharmalens_data");
        setMessage(error ? error.message : "Your retained PharmaLens data was deleted.");
        return;
      } catch {}
    }
    localStorage.removeItem("pharmalens-guest-scans");
    localStorage.removeItem("pharmalens_local_reports");
    setMessage("Your local scans and reports were cleared.");
  }

  if (!email) {
    return (
      <>
        <div className="profile-card card">
          <div className="profile-avatar"><UserRound /></div>
          <div>
            <h2>Guest user</h2>
            <p>You are using guest mode. Scans are saved only to this device.</p>
          </div>
          <div className="profile-actions">
            <Link className="button button-primary" href="/signup">
              <LockKeyhole size={18} /> Create account
            </Link>
            <Link className="button button-secondary" href="/login">
              Log in
            </Link>
          </div>
        </div>
        <Benefits />
      </>
    );
  }

  return (
    <>
      <div className="profile-card card">
        <div className="profile-avatar"><UserRound /></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>{displayName || email}</h2>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "6px",
                background: role === "admin" ? "var(--teal)" : role === "reviewer" ? "#1e40af" : "var(--grey-bg)",
                color: role === "user" ? "var(--ink)" : "white",
                textTransform: "uppercase",
              }}
            >
              {role}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
            {email} · {role === "admin" ? "Full Administrator Privileges" : role === "reviewer" ? "Pharmacist Reviewer Access" : "Standard Patient Account"}
          </p>
        </div>
        <div className="profile-actions">
          {role === "admin" && (
            <Link href="/admin" className="button button-secondary" style={{ fontSize: "13px" }}>
              <ShieldCheck size={16} /> Admin Panel
            </Link>
          )}
          <button onClick={handleSignOut} className="button button-secondary" style={{ fontSize: "13px" }}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>

      <Benefits />

      {message && <div className="form-alert success profile-message">{message}</div>}

      <section className="card danger-zone">
        <h2>Delete my retained data</h2>
        <p>Deletes scans, stored package images, reports, and review history. This cannot be undone.</p>
        <button onClick={deleteData} className="button button-ghost">
          <Trash2 size={17} /> Delete retained data
        </button>
      </section>
    </>
  );
}

function Benefits() {
  return (
    <div className="card account-benefits">
      <h2>Privacy commitments</h2>
      <ul>
        <li><Check /> Guest records remain separate and device-only</li>
        <li><Check /> Package images upload only after explicit retention consent</li>
        <li><Check /> Reports are stored securely and never shared without permission</li>
      </ul>
    </div>
  );
}
