"use client";

import { useCallback, useEffect, useState } from "react";
import { FileWarning } from "@/components/icons";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getLocalReports, updateLocalReportStatus } from "@/lib/local-store";

type Report = {
  id: string;
  public_reference: string;
  reason: string;
  notes: string | null;
  contact_information: string | null;
  status: string;
  created_at: string;
  scan_id: string;
  scans: { product_name: string; outcome: string } | Array<{ product_name: string; outcome: string }>;
};

export function ReviewQueue() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error: loadError } = await createClient()
          .from("reports")
          .select("id,public_reference,reason,notes,contact_information,status,created_at,scan_id,scans(product_name,outcome)")
          .order("created_at", { ascending: false });

        if (loadError) {
          setError(loadError.message);
        } else {
          setReports((data ?? []) as unknown as Report[]);
        }
        return;
      } catch {}
    }

    const local = getLocalReports();
    setReports(local as unknown as Report[]);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function update(id: string, status: "under_review" | "more_information_requested" | "closed") {
    const note = prompt(status === "more_information_requested" ? "What additional information is required?" : "Pharmacist review note (optional):") ?? "";

    if (isSupabaseConfigured()) {
      try {
        const { error: updateError } = await createClient().rpc("update_report_status", {
          p_report_id: id,
          p_status: status,
          p_note: note,
        });
        if (updateError) setError(updateError.message);
        else await load();
        return;
      } catch {}
    }

    updateLocalReportStatus(id, status, note);
    await load();
  }

  return (
    <>
      {error && <div className="form-alert error">{error}</div>}
      {reports.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon"><FileWarning /></div>
          <h3>No reports waiting for review</h3>
          <p>When users flag a suspicious medicine package or request a pharmacist opinion, it will appear here.</p>
        </div>
      ) : (
        <div className="review-list">
          {reports.map((report) => {
            const scan = Array.isArray(report.scans) ? report.scans[0] : report.scans;
            return (
              <article className="card review-card" key={report.id}>
                <div>
                  <span className="eyebrow">{report.public_reference}</span>
                  <h2>{scan?.product_name ?? "Flagged Medicine Pack"}</h2>
                  <p>{report.reason.replaceAll("_", " ")} · Submitted {new Date(report.created_at).toLocaleString("en-NG")}</p>
                </div>
                <span className={`status-badge status-${report.status}`}>{report.status.replaceAll("_", " ")}</span>
                <div className="review-evidence">
                  <strong>Patient Observation / Concern</strong>
                  <p>{report.notes || "No description provided."}</p>
                  {report.contact_information && <small>Contact: {report.contact_information}</small>}
                  <small>Original scan result: {scan?.outcome?.replaceAll("_", " ") ?? "Unknown"}. Review notes provide professional guidance.</small>
                </div>
                <div className="review-actions">
                  <button onClick={() => update(report.id, "under_review")} className="button button-secondary">Start Review</button>
                  <button onClick={() => update(report.id, "more_information_requested")} className="button button-secondary">Request More Details</button>
                  <button onClick={() => update(report.id, "closed")} className="button button-primary">Mark Resolved</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
