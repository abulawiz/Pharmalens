"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileWarning, LockKeyhole } from "@/components/icons";
import { reportSchema } from "@/lib/validation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getLocalUser, addLocalReport } from "@/lib/local-store";

export function ReportForm({ scanId }: { scanId: string }) {
  const idempotency = useRef(crypto.randomUUID());
  const [result, setResult] = useState<{ reference: string; status: string } | null>(null);
  const [error, setError] = useState("");
  const [scan, setScan] = useState<{ product: string; outcome: string; images: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (scanId === "unlinked") return;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        Promise.all([
          supabase.from("scans").select("product_name,outcome").eq("id", scanId).maybeSingle(),
          supabase.from("scan_images").select("id", { count: "exact", head: true }).eq("scan_id", scanId),
        ]).then(([record, images]) => {
          if (record.data) {
            setScan({
              product: record.data.product_name,
              outcome: record.data.outcome,
              images: images.count ?? 0,
            });
          }
        });
        return;
      } catch {}
    }

    // Try reading from local storage scans
    try {
      const guestScans = JSON.parse(localStorage.getItem("pharmalens-guest-scans") || "[]");
      const found = guestScans.find((s: { id: string }) => s.id === scanId);
      if (found) {
        queueMicrotask(() => {
          setScan({
            product: found.productName,
            outcome: found.outcome,
            images: 1,
          });
        });
      }
    } catch {}
  }, [scanId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = reportSchema.safeParse({
      scanId,
      reason: form.get("reason"),
      notes: form.get("notes") || undefined,
      consentToShare: form.get("consent") === "on",
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    const localUser = getLocalUser();
    if (!isSupabaseConfigured() && !localUser) {
      setError("Please sign in or select a local account to submit a pharmacist review request.");
      return;
    }

    setSubmitting(true);

    if (isSupabaseConfigured()) {
      try {
        const { data, error: submitError } = await createClient().rpc("submit_review_report", {
          p_scan_id: scanId,
          p_reason: parsed.data.reason,
          p_notes: parsed.data.notes ?? "",
          p_contact: String(form.get("contact") ?? ""),
          p_idempotency_key: idempotency.current,
          p_policy_version: "privacy-v1",
        });
        const report = Array.isArray(data) ? data[0] : data;
        if (submitError || !report) {
          setError(submitError?.message ?? "The report could not be submitted.");
        } else {
          setResult({ reference: report.public_reference, status: report.status });
          setError("");
        }
        setSubmitting(false);
        return;
      } catch {}
    }

    // Local report creation
    const created = addLocalReport({
      scan_id: scanId,
      reason: parsed.data.reason,
      notes: parsed.data.notes ?? null,
      contact_information: String(form.get("contact") ?? "") || null,
      scans: {
        product_name: scan?.product ?? "Scanned Medicine",
        outcome: scan?.outcome ?? "needs_review",
      },
    });

    setResult({ reference: created.public_reference, status: created.status });
    setError("");
    setSubmitting(false);
  }

  if (result) {
    return (
      <div className="card report-success">
        <div className="empty-icon"><Check /></div>
        <h2>Review request submitted</h2>
        <p>Reference: <strong>{result.reference}</strong></p>
        <p>Status: {result.status.replaceAll("_", " ")}. A licensed pharmacist will review this package and provide feedback.</p>
      </div>
    );
  }

  return (
    <form className="card report-form" onSubmit={submit}>
      <div className="form-banner">
        <FileWarning />
        <div>
          <strong>Request Pharmacist Review</strong>
          <p>Submit your scan and photos for professional review by a licensed pharmacist.</p>
        </div>
      </div>

      {scan ? (
        <div className="report-scan-summary">
          <strong>{scan.product}</strong>
          <span>{scan.outcome.replaceAll("_", " ")} · {scan.images} package photo{scan.images === 1 ? "" : "s"}</span>
        </div>
      ) : (
        <div className="form-alert">
          Tip: You can start from a scan in your History, or submit observations directly.
        </div>
      )}

      <div className="field">
        <label htmlFor="reason">Main concern</label>
        <select id="reason" name="reason" defaultValue="packaging_discrepancy">
          <option value="packaging_discrepancy">Packaging looks different or suspicious</option>
          <option value="registration_concern">NAFDAC or registration number issue</option>
          <option value="expiry_concern">Expiry or batch date looks altered</option>
          <option value="other">Other question or concern</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="notes">Describe what you noticed</label>
        <textarea
          id="notes"
          name="notes"
          rows={6}
          maxLength={1000}
          required
          placeholder="Describe what looks unusual on the medicine pack (e.g. spelling errors, blurry logo, missing foil seal)..."
        />
      </div>

      <div className="field">
        <label htmlFor="contact">Contact details <span>(optional)</span></label>
        <input id="contact" name="contact" maxLength={200} placeholder="Email or phone number for follow-up" />
        <small className="field-hint">Visible only to the pharmacist reviewing this report.</small>
      </div>

      <label className="consent">
        <input type="checkbox" name="consent" />
        <span>
          <strong>I consent to sharing this scan and description with the pharmacist reviewer.</strong>
          <small>Your information is stored securely and used solely for this review.</small>
        </span>
      </label>

      {error && <div className="form-alert error" role="alert">{error}</div>}

      <button disabled={submitting} className="button button-primary" type="submit">
        <LockKeyhole size={18} />
        {submitting ? "Submitting..." : "Submit for Pharmacist Review"}
      </button>
    </form>
  );
}
