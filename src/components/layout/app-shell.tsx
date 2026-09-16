import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  CheckSquare,
  Files,
  LayoutDashboard,
  Library,
  Menu,
  PenLine,
  Scale,
  ScrollText,
  Search,
  Settings,
  Shield,
  FileStack,
  Stamp,
  Bell,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { bootstrapWorkspace, listNotifications, markNotificationRead } from "@/lib/server/api";
import { queryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { BrandedSplash } from "@/components/auth/login-view";
import type { NotificationRecord } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const NAV = [
  {
    group: "Workspace",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/search", label: "Search", icon: Search },
    ],
  },
  {
    group: "Matters",
    items: [
      { to: "/clients", label: "Clients", icon: Building2 },
      { to: "/matters", label: "Matters", icon: Briefcase },
      { to: "/documents", label: "Documents", icon: Files },
      { to: "/contracts", label: "Contracts", icon: ScrollText },
    ],
  },
  {
    group: "Drafting",
    items: [
      { to: "/drafting", label: "AI Drafting", icon: PenLine },
      { to: "/templates", label: "Templates", icon: FileStack },
      { to: "/clauses", label: "Clause Library", icon: Library },
    ],
  },
  {
    group: "Work",
    items: [
      { to: "/tasks", label: "Tasks", icon: CheckSquare },
      { to: "/approvals", label: "Approvals", icon: Stamp },
      { to: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    group: "Governance",
    items: [
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/holds", label: "Legal Hold", icon: Shield },
      { to: "/audit", label: "Audit Logs", icon: ScrollText },
      { to: "/admin", label: "Administration", icon: Settings },
    ],
  },
] as const;

function NavBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {NAV.map((section) => (
        <div key={section.group}>
          <p className="px-2 pb-1.5 text-[10px] font-medium tracking-[0.16em] text-sidebar-muted uppercase">
            {section.group}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to as never}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150",
                      active
                        ? "bg-sidebar-active text-sidebar-fg"
                        : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg",
                    )}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-4 py-4">
      <span className="grid size-8 place-items-center rounded-md bg-raised text-ink">
        <Scale className="size-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[15px] leading-tight font-medium tracking-tight text-sidebar-fg">
          LegalFlow AI
        </span>
        <span className="block text-[10px] tracking-[0.14em] text-sidebar-muted uppercase">
          Ashoka & Meridian
        </span>
      </span>
    </Link>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
  });
  const unread = data.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-ink-2"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-danger" />
        )}
      </Button>
      {open && (
        <div className="absolute top-11 right-0 z-40 w-80 rounded-xl border border-line bg-raised p-2 shadow-paper">
          <p className="px-2 py-1.5 text-xs font-medium tracking-wide text-ink-soft uppercase">
            Notifications
          </p>
          <div className="max-h-80 overflow-y-auto">
            {data.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-ink-faint">Nothing waiting.</p>
            )}
            {data.map((n: NotificationRecord) => (
              <button
                key={n.id}
                type="button"
                className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left hover:bg-canvas"
                onClick={async () => {
                  if (!n.read) {
                    await markNotificationRead({ data: { id: n.id } });
                    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
                  }
                  setOpen(false);
                  if (n.href) window.location.assign(n.href);
                }}
              >
                <span className={cn("text-sm", n.read ? "text-ink-soft" : "text-ink")}>{n.title}</span>
                {n.body && <span className="text-xs text-ink-faint">{n.body}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell({
  children,
  title,
  actions,
}: {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}) {
  const { user, isPending } = useCurrentUserState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) return;
    void bootstrapWorkspace()
      .then(() => {
        void queryClient.invalidateQueries();
      })
      .catch(() => undefined);
  }, [user]);

  const heading = useMemo(() => title, [title]);

  if (isPending) return <BrandedSplash />;
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-line bg-sidebar md:flex">
        <BrandMark />
        <div className="mx-4 h-px bg-sidebar-line" />
        <NavBody />
        <div className="border-t border-sidebar-line p-3">
          <p className="px-1 text-[10px] tracking-wide text-sidebar-muted uppercase">Signed in</p>
          <p className="truncate px-1 text-sm text-sidebar-fg">{user.displayName ?? user.primaryEmail}</p>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0">
          <BrandMark />
          <NavBody onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-paper/90 px-3 backdrop-blur-sm md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <form
            className="relative min-w-0 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              const next = q.trim();
              window.location.assign(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
            }}
          >
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search matters, documents, parties…"
              className="h-9 border-transparent bg-canvas pl-9 md:max-w-md"
            />
          </form>
          <NotificationBell />
          <UserButton />
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-5 md:px-6 md:py-7">
          {(heading || actions) && (
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              {heading && (
                <h1 className="font-display text-2xl tracking-tight text-ink md:text-[1.75rem]">
                  {heading}
                </h1>
              )}
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
