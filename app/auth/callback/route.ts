import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import { safeRedirectPath } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));
  if (!code) return NextResponse.redirect(`${origin}/verify-email?error=missing`);

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(`${origin}/verify-email?error=configuration`);

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/verify-email?error=expired`);

  if (searchParams.get("flow") === "welcome") {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (user?.email && user.email_confirmed_at) {
      const delivery = await sendWelcomeEmail({ userId: user.id, email: user.email, appOrigin: origin });
      if (!delivery.ok) {
        console.error("[email] PharmaLens welcome email delivery failed", { reason: delivery.reason });
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
