import { LockKeyhole } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { AdminCatalogue } from "@/components/admin-catalogue";
import { ReferenceImageManager } from "@/components/reference-image-manager";
import { LocalAdminLoginButton } from "@/components/local-auth-buttons";
import { cookies } from "next/headers";
import { getLocalUserFromCookie } from "@/lib/local-store";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata = { title: "Administration" };

export default async function Page() {
  const supabase = await createClient();
  let authorized = false;
  let counts = { profiles: 0, scans: 0, reports: 0, references: 0 };

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      authorized = data?.role === "admin";
      if (authorized) {
        const [p, s, r, c] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("scans").select("id", { count: "exact", head: true }),
          supabase.from("reports").select("id", { count: "exact", head: true }),
          supabase.from("reference_versions").select("id", { count: "exact", head: true }).eq("status", "published"),
        ]);
        counts = { profiles: p.count ?? 0, scans: s.count ?? 0, reports: r.count ?? 0, references: c.count ?? 0 };
      }
    }
  }

  if (!authorized && !getSupabasePublicConfig()) {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.get("pharmalens_local_user")?.value;
    const localUser = cookieHeader ? getLocalUserFromCookie(`pharmalens_local_user=${cookieHeader}`) : null;
    if (localUser?.role === "admin") {
      authorized = true;
      counts = { profiles: 3, scans: 14, reports: 2, references: 4 };
    }
  }

  if (!authorized) {
    return (
      <>
        <PageHeader
          eyebrow="Restricted access"
          title="Administration"
          description="Administrative tools for managing verified medicines, checking scan reports, and supervising pharmacist reviews."
        />
        <div className="card empty-state">
          <div className="empty-icon"><LockKeyhole /></div>
          <h3>Administrator access required</h3>
          <p>
            {supabase
              ? "Your current account does not have the administrator role."
              : "Sign in with an administrator account to manage reference medicines and review queues."}
          </p>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <LocalAdminLoginButton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="System Overview & Management"
        title="Administration"
        description="Manage verified medicines, review registered package references, and configure user permissions."
      />
      <AdminCatalogue initialCounts={counts}>
        <ReferenceImageManager />
      </AdminCatalogue>
    </>
  );
}
