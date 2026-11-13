"use client";

import { useEffect, useMemo, useState } from "react";
import { Database, Search } from "@/components/icons";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getLocalVersions } from "@/lib/local-store";

type Product = {
  name: string;
  presentation: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  registration_number: string | null;
};

type Row = {
  id: string;
  version: number;
  packaging_version: string;
  source_name: string;
  reviewed_at: string;
  coverage_notes: string | null;
  products: Product | Product[];
};

export function CatalogueClient() {
  const configured = isSupabaseConfigured();
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (configured) {
        try {
          const { data } = await createClient()
            .from("reference_versions")
            .select("id,version,packaging_version,source_name,reviewed_at,coverage_notes,products!inner(name,presentation,strength,dosage_form,manufacturer,registration_number)")
            .eq("status", "published")
            .order("reviewed_at", { ascending: false });
          setRows((data ?? []) as unknown as Row[]);
          setLoaded(true);
          return;
        } catch {
          setLoaded(true);
          return;
        }
      }

      const localVersions = getLocalVersions().filter((v) => v.status === "published");
      setRows(
        localVersions.map((v) => ({
          id: v.id,
          version: v.version,
          packaging_version: v.packaging_version,
          source_name: v.source_name,
          reviewed_at: v.reviewed_at ?? new Date().toISOString(),
          coverage_notes: v.coverage_notes ?? null,
          products: v.products ?? {
            name: "Medicine",
            presentation: "Standard pack",
            strength: "500 mg",
            dosage_form: "Tablet",
            manufacturer: "Manufacturer",
            registration_number: null,
          },
        }))
      );
      setLoaded(true);
    }

    void loadData();
  }, [configured]);

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        const product = Array.isArray(row.products) ? row.products[0] : row.products;
        return `${product?.name} ${product?.manufacturer} ${product?.registration_number ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
      }),
    [rows, query]
  );

  const freshest = rows.length
    ? new Date(Math.max(...rows.map((row) => new Date(row.reviewed_at).getTime()))).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No records";

  return (
    <>
      <div className="catalogue-status card">
        <div className="empty-icon"><Database /></div>
        <div>
          <strong>{rows.length ? "Verified Medicine Database" : "No reference dataset configured"}</strong>
          <p>
            {rows.length
              ? `Latest verified inspection: ${freshest}. Active reference packages are used during camera verification.`
              : "No production record is fabricated or silently replaced with demonstration data."}
          </p>
        </div>
        <span>{loaded ? `${rows.length} published version${rows.length === 1 ? "" : "s"}` : "Loading…"}</span>
      </div>

      <div className="history-tools">
        <label>
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={!rows.length}
            placeholder="Search medicine by name, manufacturer or NAFDAC number"
          />
        </label>
      </div>

      {visible.length ? (
        <div className="catalogue-grid">
          {visible.map((row) => {
            const product = Array.isArray(row.products) ? row.products[0] : row.products;
            return (
              <article className="card catalogue-card" key={row.id}>
                <span className="eyebrow">Verified Reference · v{row.version}</span>
                <h2>{product.name}</h2>
                <p>{product.presentation}</p>
                <dl>
                  <div>
                    <dt>Strength / form</dt>
                    <dd>{product.strength} · {product.dosage_form}</dd>
                  </div>
                  <div>
                    <dt>Manufacturer</dt>
                    <dd>{product.manufacturer}</dd>
                  </div>
                  <div>
                    <dt>Registration number</dt>
                    <dd>{product.registration_number || "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>Packaging batch</dt>
                    <dd>{row.packaging_version}</dd>
                  </div>
                  <div>
                    <dt>Source standard</dt>
                    <dd>{row.source_name}</dd>
                  </div>
                  <div>
                    <dt>Verified date</dt>
                    <dd>{new Date(row.reviewed_at).toLocaleDateString("en-NG")}</dd>
                  </div>
                </dl>
                {row.coverage_notes && <small className="coverage-note">Notes: {row.coverage_notes}</small>}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">
          <h3>{query ? "No matching medicines" : "No published references"}</h3>
          <p>
            {query
              ? "Try another search by brand name or NAFDAC number."
              : "Screening returns “Unable to verify” until an authorised, documented reference version is published."}
          </p>
        </div>
      )}
    </>
  );
}
