"use client";

import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck, Stethoscope, User } from "@/components/icons";
import { PRESET_ACCOUNTS, setLocalUser, type LocalUser } from "@/lib/local-store";

export function LocalAuthSwitch({ onLoggedIn, compact = false }: { onLoggedIn?: () => void; compact?: boolean }) {
  const router = useRouter();

  function handleLogin(account: LocalUser) {
    setLocalUser(account);
    if (onLoggedIn) {
      onLoggedIn();
    } else {
      if (account.role === "admin") {
        router.push("/admin");
      } else if (account.role === "reviewer") {
        router.push("/review");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    }
  }

  return (
    <div className={`local-auth-panel ${compact ? "compact" : ""}`} style={{
      marginTop: "1.5rem",
      padding: "1.25rem",
      borderRadius: "0.75rem",
      border: "1px solid var(--border, rgba(0,0,0,0.1))",
      background: "var(--card-subtle, rgba(0,0,0,0.02))",
    }}>
      <div style={{ marginBottom: "0.85rem" }}>
        <strong style={{ display: "block", fontSize: "0.95rem" }}>Local Admin & Role Access</strong>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--muted, #666)" }}>
          Sign in immediately to test administrative tools, pharmacist reviews, or user scans without requiring cloud credentials.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem" }}>
        <button
          type="button"
          onClick={() => handleLogin(PRESET_ACCOUNTS[0])}
          className="button button-secondary"
          style={{ justifyContent: "flex-start", textAlign: "left", padding: "0.6rem 0.85rem" }}
        >
          <ShieldCheck size={18} style={{ color: "var(--primary, #063F3C)", flexShrink: 0 }} />
          <div>
            <strong style={{ display: "block", fontSize: "0.85rem" }}>Administrator</strong>
            <small style={{ display: "block", fontSize: "0.72rem", opacity: 0.8 }}>Full catalogue & settings</small>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleLogin(PRESET_ACCOUNTS[1])}
          className="button button-secondary"
          style={{ justifyContent: "flex-start", textAlign: "left", padding: "0.6rem 0.85rem" }}
        >
          <Stethoscope size={18} style={{ color: "#0284c7", flexShrink: 0 }} />
          <div>
            <strong style={{ display: "block", fontSize: "0.85rem" }}>Pharmacist Reviewer</strong>
            <small style={{ display: "block", fontSize: "0.72rem", opacity: 0.8 }}>Review flagged reports</small>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleLogin(PRESET_ACCOUNTS[2])}
          className="button button-secondary"
          style={{ justifyContent: "flex-start", textAlign: "left", padding: "0.6rem 0.85rem" }}
        >
          <User size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
          <div>
            <strong style={{ display: "block", fontSize: "0.85rem" }}>Patient / User</strong>
            <small style={{ display: "block", fontSize: "0.72rem", opacity: 0.8 }}>Standard scan & reports</small>
          </div>
        </button>
      </div>
    </div>
  );
}

export function LocalAdminLoginButton() {
  const router = useRouter();

  function enterAdmin() {
    setLocalUser(PRESET_ACCOUNTS[0]);
    router.refresh();
  }

  return (
    <button onClick={enterAdmin} className="button button-primary" type="button">
      <LockKeyhole size={18} />
      Log in as Local Administrator
    </button>
  );
}

export function LocalReviewerLoginButton() {
  const router = useRouter();

  function enterReviewer() {
    setLocalUser(PRESET_ACCOUNTS[1]);
    router.refresh();
  }

  return (
    <button onClick={enterReviewer} className="button button-primary" type="button">
      <Stethoscope size={18} />
      Log in as Pharmacist Reviewer
    </button>
  );
}
