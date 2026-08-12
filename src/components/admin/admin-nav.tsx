"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  IndianRupee,
  LifeBuoy,
  Briefcase,
  Radio,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/enrollments", label: "Enrollments", icon: GraduationCap },
  { href: "/admin/revenue", label: "Revenue", icon: IndianRupee },
  { href: "/admin/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/admin/announcements", label: "Announcements", icon: Radio },
  { href: "/admin/case-studies", label: "Case studies", icon: FileText },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/audit-logs", label: "Audit logs", icon: ShieldCheck },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-border pb-4">
      {ADMIN_NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-primary-50 text-primary-700" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
