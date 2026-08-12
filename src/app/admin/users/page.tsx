import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ProfileRow, UserRow } from "@/types/db";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = supabaseAdmin();

  let query = supabase.from("users").select("*").order("created_at", { ascending: false }).limit(50);
  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  }
  const { data: users } = await query;
  const userRows = (users ?? []) as UserRow[];

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("*")
    .in("user_id", userRows.map((u) => u.id));
  const profileByUserId = new Map(((profileRows ?? []) as ProfileRow[]).map((p) => [p.user_id, p]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-h3 font-semibold">Users</h2>
        <p className="text-sm text-muted-foreground">{userRows.length} shown (most recent 50, or matching search)</p>
      </div>

      <form method="get" className="max-w-sm">
        <Input name="q" placeholder="Search by name or email…" defaultValue={q ?? ""} />
      </form>

      <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {userRows.map((user) => {
          const profile = profileByUserId.get(user.id);
          return (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name ?? "Unnamed"}</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                {user.role === "admin" && <Badge variant="accent">admin</Badge>}
                <Badge variant={user.profile_completed ? "success" : "outline"}>
                  {user.profile_completed ? "onboarded" : "not onboarded"}
                </Badge>
                {profile?.industry && <Badge variant="outline">{profile.industry}</Badge>}
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
        {userRows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No users found.</p>
        )}
      </div>
    </div>
  );
}
