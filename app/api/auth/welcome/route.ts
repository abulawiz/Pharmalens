import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Authentication is unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user?.email || !user.email_confirmed_at) {
    return NextResponse.json({ error: "A verified account is required" }, { status: 401 });
  }

  const { origin } = new URL(request.url);
  const delivery = await sendWelcomeEmail({ userId: user.id, email: user.email, appOrigin: origin });
  if (!delivery.ok) {
    console.error("[email] PharmaLens welcome email delivery failed", { reason: delivery.reason });
    return NextResponse.json({ error: "Welcome email could not be sent" }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
