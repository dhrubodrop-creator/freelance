"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationRow } from "@/types/db";

export function NotificationBell() {
  const [notifications, setNotifications] = React.useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent — the bell just stays at its last known state
    } finally {
      setLoaded(true);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch {
      // best-effort
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && !loaded && load()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 size-4 justify-center rounded-full p-0 text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {notifications.map((n) => {
          const content = (
            <div className="flex flex-col gap-0.5">
              <p className={`text-sm ${n.read ? "text-muted-foreground" : "font-medium"}`}>{n.title}</p>
              {n.body && <p className="text-micro text-muted-foreground line-clamp-2">{n.body}</p>}
            </div>
          );
          return (
            <DropdownMenuItem
              key={n.id}
              className="flex-col items-start gap-0 whitespace-normal"
              onSelect={() => !n.read && markRead(n.id)}
            >
              {n.link ? (
                <Link href={n.link} className="w-full">
                  {content}
                </Link>
              ) : (
                content
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
