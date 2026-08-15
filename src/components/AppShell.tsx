import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Target,
  Timer,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications, useUpdate } from "@/lib/data";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/exams", label: "Exams", icon: CalendarDays },
  { to: "/sessions", label: "Study Sessions", icon: Timer },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
] as const;

function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useUpdate("notifications", "Notification");
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Reminders</div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            notifications.slice(0, 15).map((n) => (
              <button
                key={n.id}
                onClick={() =>
                  !n.read && markRead.mutate({ id: n.id, values: { read: true } })
                }
                className={cn(
                  "block w-full border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-muted",
                  !n.read && "bg-primary/5",
                )}
              >
                <span className="font-medium">{n.title}</span>
                {n.message ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {n.message}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children, email }: { children: ReactNode; email?: string | undefined }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="rounded-xl bg-sidebar-primary/15 p-2 text-sidebar-primary">
          <GraduationCap className="size-5" />
        </span>
        <span className="font-display text-lg font-semibold">StudyFlow AI</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <p className="truncate text-xs text-sidebar-foreground/70">{email}</p>
        <button
          onClick={signOut}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <span className="font-display text-sm font-semibold lg:hidden">StudyFlow AI</span>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
