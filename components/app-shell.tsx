"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Camera,
  CircleHelp,
  FileWarning,
  History,
  Home,
  LayoutDashboard,
  Settings,
  UserRound,
  Users,
  Menu,
  X,
  ShieldCheck,
} from "@/components/icons";
import { Logo } from "@/components/logo";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getLocalUser, clearLocalUser } from "@/lib/local-store";
import { LoadingScreen } from "@/components/loading-screen";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

const navigationLinks: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Scan package", icon: Camera },
  { href: "/history", label: "Scan history", icon: History },
  { href: "/catalogue", label: "Medicine catalogue", icon: BookOpen },
  { href: "/reports", label: "Reports", icon: FileWarning },
  { href: "/review", label: "Review queue", icon: FileWarning },
  { href: "/admin", label: "Administration", icon: Users, badge: "Admin Panel" },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help & FAQs", icon: CircleHelp },
];

const mobileLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/scan", label: "Scan", icon: Camera },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  mobile = false,
  onClick,
}: NavItem & { mobile?: boolean; onClick?: () => void }) {
  const path = usePathname();
  const active = path === href || path.startsWith(`${href}/`);
  return (
    <Link
      className={clsx(mobile ? "mobile-nav-link" : "side-link", active && "active")}
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <Icon size={mobile ? 22 : 19} />
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        {label}
        {badge && (
          <small
            style={{
              fontSize: "10px",
              fontWeight: 800,
              padding: "2px 6px",
              borderRadius: "6px",
              background: "var(--teal)",
              color: "white",
              marginLeft: "auto",
            }}
          >
            {badge}
          </small>
        )}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"user" | "reviewer" | "admin">("user");
  const [authReady, setAuthReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    setSidebarOpen(false);
    router.push("/");
    router.refresh();
  }

  if (!authReady) return <LoadingScreen compact />;

  return (
    <div className="app-frame">
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={clsx("sidebar", sidebarOpen && "open")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Logo />
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Main navigation">
          {navigationLinks.map((link) => (
            <NavLink key={link.href} {...link} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        <div className="sidebar-note">
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <ShieldCheck size={16} />
            <span>Safety Notice</span>
          </div>
          <p>Package scans check visible label text and do not replace laboratory chemical tests.</p>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="menu-button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation menu (three lines)"
              title="Click the three lines to open sidebar menu"
              type="button"
            >
              <Menu size={22} />
            </button>
            <div>
              <span className="eyebrow">PharmaLens Workspace</span>
              <strong>Medicine Package Verification</strong>
            </div>
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
        <button
          className="mobile-nav-link"
          onClick={() => setSidebarOpen(true)}
          type="button"
          style={{ background: "transparent", border: 0, cursor: "pointer" }}
          aria-label="Open sidebar menu with Admin Panel"
        >
          <Menu size={22} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}
