import { LockKeyhole } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { ReviewQueue } from "@/components/review-queue";
import { createClient } from "@/lib/supabase/server";
import { LocalReviewerLoginButton } from "@/components/local-auth-buttons";
import { cookies } from "next/headers";
import { getLocalUserFromCookie } from "@/lib/local-store";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata = { title: "Review queue" };

export default async function Page() {
  const supabase = await createClient();
  let allowed = false;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      allowed = data?.role === "reviewer" || data?.role === "admin";
    }
  }

  if (!allowed && !getSupabasePublicConfig()) {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.get("pharmalens_local_user")?.value;
    const localUser = cookieHeader ? getLocalUserFromCookie(`pharmalens_local_user=${cookieHeader}`) : null;
    if (localUser?.role === "reviewer" || localUser?.role === "admin") {
      allowed = true;
    }
  }

  if (!allowed) {
    return (
      <>
        <PageHeader
          eyebrow="Restricted access"
          title="Review queue"
          description="Only authorised reviewers and administrators can access submitted evidence."
        />
        <div className="card empty-state">
          <div className="empty-icon"><LockKeyhole /></div>
          <h3>Reviewer access required</h3>
          <p>Sign in with a reviewer or administrator account to examine flagged medicine packages.</p>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <LocalReviewerLoginButton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Reviewer Workspace"
        title="Review queue"
        description="Review user-submitted packaging concerns, examine discrepancies, and log findings."
      />
      <ReviewQueue />
    </>
  );
}
