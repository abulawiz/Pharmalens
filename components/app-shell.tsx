"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Camera, CircleHelp, FileWarning, History, Home, LayoutDashboard, Settings, UserRound, Users } from "@/components/icons";
import { Logo } from "@/components/logo";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getLocalUser, clearLocalUser } from "@/lib/local-store";
import { LoadingScreen } from "@/components/loading-screen";

const desktopLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Scan package", icon: Camera },
  { href: "/history", label: "Scan history", icon: History },
  { href: "/catalogue", label: "Medicine catalogue", icon: BookOpen },
  { href: "/reports", label: "Reports", icon: FileWarning },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help & FAQs", icon: CircleHelp },
];

const mobileLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/scan", label: "Scan", icon: Camera },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function NavLink({ href, label, icon: Icon, mobile = false }: (typeof desktopLinks)[number] & { mobile?: boolean }) {
  const path = usePathname();
  const active = path === href || path.startsWith(`${href}/`);
  return <Link className={clsx(mobile ? "mobile-nav-link" : "side-link", active && "active")} href={href} aria-current={active ? "page" : undefined}><Icon size={mobile ? 22 : 19} /><span>{label}</span></Link>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"user" | "reviewer" | "admin">("user");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            setEmail(data.user.email ?? "");
            setDisplayName(data.user.user_metadata?.name || data.user.email?.split("@")[0] || "");
            const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
            setRole(profile?.role ?? "user");
            setAuthReady(true);
            return;
          }
        } catch {}
      }

      const local = getLocalUser();
      if (local) {
        setEmail(local.email);
        setDisplayName(local.name);
        setRole(local.role);
      }
      setAuthReady(true);
    }

    void initAuth();

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            setEmail(session.user.email ?? "");
          }
        });
        return () => data.subscription.unsubscribe();
      } catch {}
    }
  }, []);

  async function signOut() {
    if (isSupabaseConfigured()) {
      try {
        await createClient().auth.signOut();
      } catch {}
    }
    clearLocalUser();
    setEmail("");
    setDisplayName("");
    setRole("user");
    router.push("/");
    router.refresh();
  }

  if (!authReady) return <LoadingScreen compact />;

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Logo />
        <nav aria-label="Main navigation">
          {desktopLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
          {(role === "reviewer" || role === "admin") && (
            <NavLink href="/review" label="Review queue" icon={FileWarning} />
          )}
          {role === "admin" && (
            <NavLink href="/admin" label="Administration" icon={Users} />
          )}
        </nav>
        <div className="sidebar-note">
          <span>Safety Notice</span>
          <p>Package scans check visible label text and do not replace laboratory chemical tests.</p>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <div>
            <span className="eyebrow">PharmaLens Workspace</span>
            <strong>Medicine Package Verification</strong>
          </div>
          <div className="account-area">
            <Link className="account-chip" href="/profile">
              <span>{email ? email.slice(0, 2).toUpperCase() : "GU"}</span>
              <div>
                <strong>{displayName || email || "Guest user"}</strong>
                <small>{role !== "user" ? `${role.toUpperCase()} account` : email ? "Signed-in account" : "Guest mode"}</small>
              </div>
            </Link>
            {email && (
              <button onClick={signOut} className="signout" aria-label="Log out">
                Log out
              </button>
            )}
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileLinks.map((link) => (
          <NavLink key={link.href} {...link} mobile />
        ))}
      </nav>
    </div>
  );
}
