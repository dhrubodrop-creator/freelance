"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Users, LifeBuoy, ShieldCheck, Menu, CalendarClock, UserCircle, Sparkles, FolderGit2, LineChart, Briefcase } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: UserCircle },
  { href: "/skills", label: "My Skills", icon: Sparkles },
  { href: "/portfolio", label: "Portfolio", icon: FolderGit2 },
  { href: "/market-pulse", label: "Market Pulse", icon: LineChart },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/sessions", label: "1:1 Sessions", icon: CalendarClock },
  { href: "/community", label: "Community", icon: Users },
  { href: "/contact", label: "Support", icon: LifeBuoy },
];

function NavLinks({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary-50 text-primary-700" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      {isAdmin && (
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ShieldCheck className="size-4" />
          Admin
        </Link>
      )}
    </nav>
  );
}

export function PortalShell({
  children,
  isAdmin = false,
  title,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-border bg-background p-5 md:flex">
        <div className="flex flex-col gap-8">
          <Logo />
          <NavLinks isAdmin={isAdmin} />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border p-2.5">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm text-muted-foreground">Account</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md md:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <UserButton afterSignOutUrl="/" />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>
                    <Logo />
                  </SheetTitle>
                </SheetHeader>
                <NavLinks isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {title && (
          <div className="border-b border-border bg-background px-6 py-6 md:px-10">
            <h1 className="font-heading text-h3 font-semibold">{title}</h1>
          </div>
        )}

        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
