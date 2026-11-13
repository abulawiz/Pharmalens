"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "@/components/icons";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getLocalReports, deleteLocalReport } from "@/lib/local-store";

type Report = {
  id: string;
  public_reference: string;
  reason: string;
  status: string;
  created_at: string;
  scans: { product_name: string } | Array<{ product_name: string }>;
};

export function UserReports() {
  const [reports, setReports] = useState<Report[]>([]);

  const load = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await createClient()
          .from("reports")
          .select("id,public_reference,reason,status,created_at,scans(product_name)")
          .order("created_at", { ascending: false });

        if (data) {
          setReports(data as unknown as Report[]);
          return;
        }
      } catch {}
    }

    const local = getLocalReports();
    setReports(local as unknown as Report[]);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this review request?")) return;

    if (isSupabaseConfigured()) {
      try {
        await createClient().rpc("delete_own_report", { p_report_id: id });
        await load();
        return;
      } catch {}
    }

    deleteLocalReport(id);
    await load();
  }

  if (!reports.length) return null;

  return (
    <section className="user-reports">
      <div className="section-heading">
        <div>
          <h2>Your submitted review requests</h2>
          <p>Track the progress of your medicine review requests.</p>
        </div>
      </div>
      <div className="history-list">
        {reports.map((report) => {
          const scan = Array.isArray(report.scans) ? report.scans[0] : report.scans;
          return (
            <article className="card report-row" key={report.id}>
              <div>
                <span className="eyebrow">{report.public_reference}</span>
                <h3>{scan?.product_name ?? "Flagged Medicine"}</h3>
                <p>
                  {report.reason.replaceAll("_", " ")} · {new Date(report.created_at).toLocaleString("en-NG")}
                </p>
              </div>
              <span className={`status-badge status-${report.status}`}>{report.status.replaceAll("_", " ")}</span>
              <button onClick={() => remove(report.id)} className="button button-ghost">
                <Trash2 size={16} />
                Delete
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
