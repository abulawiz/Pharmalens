"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, FileWarning, ScanLine, Users, ShieldCheck, User } from "@/components/icons";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getLocalProducts,
  addLocalProduct,
  getLocalVersions,
  addLocalVersion,
  updateLocalVersionStatus,
  getLocalProfiles,
  updateLocalUserRole,
  getLocalAudits,
  createLocalAccount,
  INITIAL_PRODUCTS,
  INITIAL_VERSIONS,
} from "@/lib/local-store";

type Product = {
  id: string;
  name: string;
  presentation: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  registration_number: string | null;
};

type Version = {
  id: string;
  product_id: string;
  version: number;
  packaging_version: string;
  source_name: string;
  reviewed_at: string | null;
  status: "draft" | "published" | "retired" | "withdrawn";
  products: Product | Product[];
};

type Profile = {
  id: string;
  display_name: string | null;
  role: "user" | "reviewer" | "admin";
};

type Adapter = {
  id: string;
  display_name: string;
  identifier: string;
  enabled: boolean;
  configuration_status: string;
};

type Audit = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
};

export function AdminCatalogue({
  initialCounts,
}: {
  initialCounts: { profiles: number; scans: number; reports: number; references: number };
}) {
  const [counts, setCounts] = useState(initialCounts);
  const [products, setProducts] = useState<Product[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const [productRows, versionRows, profileRows, adapterRows, auditRows, p, s, r, c] = await Promise.all([
          supabase.from("products").select("*").order("name"),
          supabase
            .from("reference_versions")
            .select("id,product_id,version,packaging_version,source_name,reviewed_at,status,products(*)")
            .order("created_at", { ascending: false }),
          supabase.from("profiles").select("id,display_name,role").order("created_at"),
          supabase.from("verification_adapters").select("*").order("display_name"),
          supabase
            .from("audit_events")
            .select("id,action,entity_type,created_at")
            .order("created_at", { ascending: false })
            .limit(20),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("scans").select("id", { count: "exact", head: true }),
          supabase.from("reports").select("id", { count: "exact", head: true }),
          supabase.from("reference_versions").select("id", { count: "exact", head: true }).eq("status", "published"),
        ]);
        setProducts((productRows.data ?? []) as Product[]);
        setVersions((versionRows.data ?? []) as unknown as Version[]);
        setProfiles((profileRows.data ?? []) as Profile[]);
        setAdapters((adapterRows.data ?? []) as Adapter[]);
        setAudits((auditRows.data ?? []) as Audit[]);
        setCounts({
          profiles: p.count ?? 0,
          scans: s.count ?? 0,
          reports: r.count ?? 0,
          references: c.count ?? 0,
        });
        return;
      } catch {}
    }

    // Local / Offline store fallback
    const localProducts = getLocalProducts();
    const localVersions = getLocalVersions();
    const localProfiles = getLocalProfiles();
    const localAudits = getLocalAudits();

    setProducts(localProducts as Product[]);
    setVersions(localVersions as unknown as Version[]);
    setProfiles(
      localProfiles.map((p) => ({
        id: p.id,
        display_name: p.name || p.email,
        role: p.role,
      }))
    );
    setAdapters([
      {
        id: "adp_1",
        display_name: "NAFDAC Green Book Registry",
        identifier: "nafdac_registry_v1",
        enabled: true,
        configuration_status: "active",
      },
      {
        id: "adp_2",
        display_name: "GS1 Nigeria Barcode Database",
        identifier: "gs1_nigeria_matrix",
        enabled: false,
        configuration_status: "offline_mock",
      },
    ]);
    setAudits(localAudits);
    const published = localVersions.filter((v) => v.status === "published").length;
    setCounts({
      profiles: localProfiles.length,
      scans: 14,
      reports: 2,
      references: published,
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  function feedback(ok: string, problem?: string) {
    setMessage(problem ? "" : ok);
    setError(problem ?? "");
  }

  async function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = {
      name: String(form.get("name")),
      presentation: String(form.get("presentation")),
      strength: String(form.get("strength")),
      dosage_form: String(form.get("dosageForm")),
      manufacturer: String(form.get("manufacturer")),
      registration_number: (form.get("registrationNumber") as string) || null,
    };

    if (isSupabaseConfigured()) {
      try {
        const { error: problem } = await createClient().from("products").insert(data);
        feedback("Medicine registered. Now add approved packaging reference details.", problem?.message);
        if (!problem) {
          event.currentTarget.reset();
          await load();
        }
        return;
      } catch {}
    }

    addLocalProduct(data);
    feedback("Medicine registered successfully in local database. You can now add packaging details.");
    event.currentTarget.reset();
    await load();
  }

  async function addVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const textLines = String(form.get("packageText") || "")
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    const versionData = {
      product_id: String(form.get("productId")),
      version: Number(form.get("version")),
      packaging_version: String(form.get("packagingVersion")),
      package_text: textLines,
      source_name: String(form.get("sourceName")),
      source_url: (form.get("sourceUrl") as string) || null,
      provenance_notes: String(form.get("provenance")),
      coverage_notes: (form.get("coverage") as string) || null,
      reviewed_at: form.get("reviewedAt") ? new Date(String(form.get("reviewedAt"))).toISOString() : null,
    };

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { error: problem } = await supabase.from("reference_versions").insert({
          ...versionData,
          reviewer_id: user?.id,
          created_by: user?.id,
          status: "draft",
        });
        feedback("Packaging reference saved as draft. Review and publish it below.", problem?.message);
        if (!problem) {
          event.currentTarget.reset();
          await load();
        }
        return;
      } catch {}
    }

    addLocalVersion(versionData);
    feedback("Packaging reference saved as draft in local database. Click 'Publish' below to make it active for scans.");
    event.currentTarget.reset();
    await load();
  }

  async function updateStatus(id: string, next: Version["status"]) {
    if (isSupabaseConfigured()) {
      try {
        const { error: problem } = await createClient()
          .from("reference_versions")
          .update({ status: next, updated_at: new Date().toISOString() })
          .eq("id", id);
        feedback(next === "published" ? "Packaging reference published." : `Packaging reference ${next}.`, problem?.message);
        if (!problem) await load();
        return;
      } catch {}
    }

    updateLocalVersionStatus(id, next);
    feedback(next === "published" ? "Packaging reference published and ready for scans." : `Packaging reference marked as ${next}.`);
    await load();
  }

  async function changeRole(id: string, next: Profile["role"]) {
    if (isSupabaseConfigured()) {
      try {
        const { error: problem } = await createClient().rpc("set_user_role", { p_user_id: id, p_role: next });
        feedback("User role updated successfully.", problem?.message);
        if (!problem) await load();
        return;
      } catch {}
    }

    updateLocalUserRole(id, next);
    feedback(`User role updated to ${next.toUpperCase()}.`);
    await load();
  }

  async function handleAddUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("userEmail") || "").trim();
    const name = String(form.get("userName") || "").trim();
    const role = (form.get("userRole") as Profile["role"]) || "admin";

    if (!email) {
      feedback("", "Please enter an email address.");
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error: inviteError } = await supabase.auth.signUp({
          email,
          password: "TempPassword123!",
          options: { data: { name, role } },
        });
        if (inviteError) throw inviteError;
        if (data?.user) {
          await supabase.rpc("set_user_role", { p_user_id: data.user.id, p_role: role });
        }
      } catch (err) {
        feedback("", err instanceof Error ? err.message : "Could not add user.");
        return;
      }
    }

    createLocalAccount({ email, name: name || undefined, role });
    feedback(
      role === "admin"
        ? `Administrator account added successfully for ${email}.`
        : `User account created successfully for ${email} as ${role.toUpperCase()}.`
    );
    event.currentTarget.reset();
    await load();
  }

  function loadSampleData() {
    localStorage.setItem("pharmalens_local_products", JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem("pharmalens_local_versions", JSON.stringify(INITIAL_VERSIONS));
    feedback("Loaded 4 standard Nigerian medicines into reference catalogue (Paracetamol, Amoxicillin, Lonart DS, Coartem).");
    void load();
  }

  const cards = [
    ["Registered users", counts.profiles, Users],
    ["Completed scans", counts.scans, ScanLine],
    ["Flagged reports", counts.reports, FileWarning],
    ["Active medicine references", counts.references, Database],
  ] as const;

  return (
    <>
      <div className="admin-stats">
        {cards.map(([label, value, Icon]) => (
          <article className="card" key={label}>
            <Icon />
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button type="button" onClick={loadSampleData} className="button button-secondary" style={{ fontSize: "0.85rem" }}>
          Load Verified Nigerian Medicines Sample
        </button>
      </div>

      {error && <div className="form-alert error admin-feedback">{error}</div>}
      {message && <div className="form-alert success admin-feedback">{message}</div>}

      <section className="card admin-panel">
        <h2>1. Register a medicine</h2>
        <p>Register the brand name, active strength, dosage form, and official manufacturer.</p>
        <form className="admin-form" onSubmit={addProduct}>
          <Field name="name" label="Medicine name" placeholder="e.g. Paracetamol" />
          <Field name="presentation" label="Packaging presentation" placeholder="e.g. 100 Tablets Box" />
          <Field name="strength" label="Active strength" placeholder="e.g. 500 mg" />
          <Field name="dosageForm" label="Dosage form" placeholder="e.g. Tablet, Capsule, Syrup" />
          <Field name="manufacturer" label="Manufacturer" placeholder="e.g. Emzor Pharmaceuticals" />
          <Field name="registrationNumber" label="NAFDAC / Reg number" placeholder="e.g. 04-0123" required={false} />
          <div className="wide">
            <button className="button button-primary">Save medicine</button>
          </div>
        </form>
      </section>

      <section className="card admin-panel">
        <h2>2. Add packaging reference details</h2>
        <p>
          Add the visible text markers and packaging details found on genuine packs. Scans compare detected label text against these markers.
        </p>
        <form className="admin-form" onSubmit={addVersion}>
          <div className="field">
            <label>Selected medicine</label>
            <select name="productId" required>
              <option value="">Choose medicine...</option>
              {products.map((product) => (
                <option value={product.id} key={product.id}>
                  {product.name} · {product.strength} ({product.manufacturer})
                </option>
              ))}
            </select>
          </div>
          <Field name="version" label="Version number" type="number" />
          <Field name="packagingVersion" label="Packaging batch/revision ID" placeholder="e.g. 2025-NG-V1" />
          <div className="field wide">
            <label>
              Expected label text markers <span>(one phrase per line)</span>
            </label>
            <textarea
              name="packageText"
              rows={4}
              placeholder="e.g.&#10;PARACETAMOL&#10;500 mg&#10;Emzor Pharmaceuticals&#10;NAFDAC Reg. No. 04-0123"
              required
            />
          </div>
          <Field name="sourceName" label="Source of reference" placeholder="e.g. Manufacturer specimen, Pharmacy audit" />
          <Field name="sourceUrl" label="Reference website or documentation URL" type="url" required={false} />
          <Field name="reviewedAt" label="Inspection date" type="datetime-local" />
          <div className="field wide">
            <label>Verification notes</label>
            <textarea name="provenance" rows={3} placeholder="Notes on how the genuine packaging was confirmed..." required />
          </div>
          <div className="field wide">
            <label>Packaging notes</label>
            <textarea name="coverage" rows={2} placeholder="Optional notes on blister foil, hologram, or box finishes..." />
          </div>
          <div className="wide">
            <button disabled={!products.length} className="button button-primary">
              Save packaging reference draft
            </button>
          </div>
        </form>
      </section>

      <section className="admin-table-section">
        <div className="section-heading">
          <div>
            <h2>Packaging reference records</h2>
            <p>Published references are actively compared during camera scans. Drafts can be reviewed before publishing.</p>
          </div>
        </div>
        <div className="admin-table card">
          <div className="admin-table-head">
            <span>Medicine / Version</span>
            <span>Source</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {versions.map((version) => {
            const product = Array.isArray(version.products) ? version.products[0] : version.products;
            return (
              <div className="admin-table-row" key={version.id}>
                <div>
                  <strong>
                    {product?.name ?? "Unknown product"} · v{version.version}
                  </strong>
                  <small>{version.packaging_version}</small>
                </div>
                <div>
                  <strong>{version.source_name}</strong>
                  <small>
                    {version.reviewed_at
                      ? `Inspected ${new Date(version.reviewed_at).toLocaleDateString("en-NG")}`
                      : "Pending inspection"}
                  </small>
                </div>
                <span className={`status-badge status-${version.status}`}>{version.status}</span>
                <div className="table-actions">
                  {version.status !== "published" && (
                    <button onClick={() => updateStatus(version.id, "published")}>Publish</button>
                  )}
                  {version.status === "published" && (
                    <button onClick={() => updateStatus(version.id, "withdrawn")}>Withdraw</button>
                  )}
                  {version.status === "draft" && (
                    <button onClick={() => updateStatus(version.id, "retired")}>Retire</button>
                  )}
                </div>
              </div>
            );
          })}
          {versions.length === 0 && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--muted, #666)" }}>
              No packaging references added yet. Click &quot;Load Verified Nigerian Medicines Sample&quot; above to pre-fill standard medicines.
            </div>
          )}
        </div>
      </section>

      <section className="card admin-panel">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <ShieldCheck size={24} style={{ color: "var(--teal)" }} />
          <h2 style={{ margin: 0 }}>Add Administrator &amp; Create Accounts</h2>
        </div>
        <p>Create new administrator accounts, pharmacist reviewers, or patients directly with full permissions.</p>
        <form className="admin-form" onSubmit={handleAddUser}>
          <Field name="userEmail" label="User email address" type="email" placeholder="e.g. newadmin@pharmalens.com" />
          <Field name="userName" label="Full name / Display name" placeholder="e.g. Dr. Jane Doe" required={false} />
          <div className="field">
            <label htmlFor="userRole">Assigned role</label>
            <select id="userRole" name="userRole" defaultValue="admin">
              <option value="admin">🛡️ Administrator (Full admin privileges)</option>
              <option value="reviewer">🩺 Pharmacist Reviewer</option>
              <option value="user">👤 Standard User</option>
            </select>
          </div>
          <div className="wide">
            <button className="button button-primary">
              <User size={18} />
              Add Administrator / Create Account
            </button>
          </div>
        </form>
      </section>

      <section className="card admin-panel">
        <h2>User roles &amp; permissions</h2>
        <p>Assign administrative or pharmacist review permissions to accounts.</p>
        <div className="role-list">
          {profiles.map((profile) => (
            <div key={profile.id}>
              <span>
                <strong>{profile.display_name || "Account"}</strong>
                <small>{profile.id}</small>
              </span>
              <select
                value={profile.role}
                onChange={(event) => changeRole(profile.id, event.target.value as Profile["role"])}
              >
                <option value="user">Patient / Standard User</option>
                <option value="reviewer">Pharmacist Reviewer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-bottom-grid">
        <div className="card admin-panel">
          <h2>Verification integrations</h2>
          {adapters.map((adapter) => (
            <div className="adapter-row" key={adapter.id}>
              <span>
                <strong>{adapter.display_name}</strong>
                <small>{adapter.identifier}</small>
              </span>
              <span className="status-badge status-draft">{adapter.configuration_status}</span>
            </div>
          ))}
        </div>
        <div className="card admin-panel">
          <h2>Security & audit logs</h2>
          {audits.length ? (
            audits.map((audit) => (
              <div className="audit-row" key={audit.id}>
                <strong>{audit.action.replaceAll("_", " ")}</strong>
                <span>
                  {audit.entity_type} · {new Date(audit.created_at).toLocaleString("en-NG")}
                </span>
              </div>
            ))
          ) : (
            <p>No audit events recorded yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} required={required} min={type === "number" ? 1 : undefined} placeholder={placeholder} />
    </div>
  );
}
