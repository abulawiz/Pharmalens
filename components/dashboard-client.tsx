"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, History, ImagePlus, ScanLine } from "@/components/icons";
import { OutcomeCard } from "@/components/outcome-card";
import { getGuestScans } from "@/lib/guest-storage";
import type { ScanRecord } from "@/lib/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getLocalUser } from "@/lib/local-store";

export function DashboardClient() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    queueMicrotask(async () => {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            setEmail(user.email ?? "");
            const { data } = await supabase
              .from("scans")
              .select("id, created_at, product_name, manufacturer, batch_number, expiry_date_text, registration_number, extracted_text, outcome, rationale")
              .order("created_at", { ascending: false })
              .limit(3);
            setScans(
              (data ?? []).map((row) => ({
                id: row.id,
                createdAt: row.created_at,
                productName: row.product_name,
                manufacturer: row.manufacturer ?? undefined,
                batchNumber: row.batch_number ?? undefined,
                expiryDate: row.expiry_date_text ?? undefined,
                registrationNumber: row.registration_number ?? undefined,
                extractedText: row.extracted_text,
                outcome: row.outcome,
                rationale: row.rationale,
                source: "account",
              }))
            );
            return;
          }
        } catch {}
      }

      const local = getLocalUser();
      if (local) {
        setEmail(local.email);
      }

      setScans(getGuestScans());
    });
  }, []);

  return (
    <>
      {!email && (
        <div
          className="card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
            borderLeft: "4px solid var(--primary, #063F3C)",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <strong style={{ display: "block", fontSize: "0.95rem" }}>Create an account or sign in</strong>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--muted, #666)" }}>
              Put your email and password to securely save your scans, request pharmacist reviews, and access administrator tools.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <Link href="/signup" className="button button-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              Create account
            </Link>
            <Link href="/login" className="button button-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              Log in
            </Link>
          </div>
        </div>
      )}

      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">Good to see you{email ? `, ${email.split("@")[0]}` : ""}</span>
          <h1>
            What would you like
            <br />
            to verify today?
          </h1>
          <p>Capture a clear photo of the medicine package. We will help you verify visible label information.</p>
          <div className="dashboard-actions">
            <Link href="/scan?mode=camera" className="button button-primary">
              <Camera size={20} /> Scan a package
            </Link>
            <Link href="/scan?mode=upload" className="button button-secondary">
              <ImagePlus size={20} /> Upload image
            </Link>
          </div>
        </div>
        <div className="scan-guide">
          <div className="guide-visual">
            <ScanLine size={54} />
            <span>Keep the front panel in frame</span>
          </div>
          <ul>
            <li>
              <b>1</b>
              <span>
                <strong>Use bright, even lighting</strong>
                <small>Avoid reflections and glare across the text.</small>
              </span>
            </li>
            <li>
              <b>2</b>
              <span>
                <strong>Fill the frame</strong>
                <small>Keep text sharp, focused and readable.</small>
              </span>
            </li>
            <li>
              <b>3</b>
              <span>
                <strong>Review detected text</strong>
                <small>Check medicine name, batch and expiry date.</small>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Recent scans</h2>
          <p>{email ? "Private scans saved to your account." : "Guest history is stored only on this device."}</p>
        </div>
        {scans.length > 0 && (
          <Link className="text-link" href="/history">
            View all
          </Link>
        )}
      </div>

      {scans.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">
            <History />
          </div>
          <h3>No scans yet</h3>
          <p>
            {email
              ? "Your private scan history is ready for your first scan."
              : "Guest history is stored only on this device. Create an account when you want to save scans to your profile."}
          </p>
          <Link className="button button-secondary" href="/scan">
            Start your first scan
          </Link>
        </div>
      ) : (
        <div className="recent-grid">
          {scans.slice(0, 3).map((scan) => (
            <Link href={`/history/${scan.id}`} className="card recent-card" key={scan.id}>
              <div>
                <span>
                  {new Date(scan.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <h3>{scan.productName}</h3>
              </div>
              <OutcomeCard compact outcome={scan.outcome} />
            </Link>
          ))}
        </div>
      )}

      <div className="section-heading">
        <div>
          <h2>Understanding your results</h2>
          <p>Each outcome refers to visible packaging details compared against registered reference records.</p>
        </div>
      </div>

      <div className="meaning-grid">
        <OutcomeCard outcome="reference_match" compact />
        <OutcomeCard outcome="needs_review" compact />
        <OutcomeCard outcome="unable_to_verify" compact />
      </div>
    </>
  );
}
