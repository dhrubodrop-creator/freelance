import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import { listSimulations } from "@/lib/simulations";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SimulationsWorkspace } from "@/components/portal/simulations-workspace";
import type { PortfolioItemRow } from "@/types/db";

export default async function SimulationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [sessions, { data: items }] = await Promise.all([
    listSimulations(user.id),
    supabase.from("portfolio_items").select("id, title").eq("user_id", user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">Simulations</h1>
        <p className="mt-1 text-muted-foreground">
          Practice the real conversations of freelance/independent work — client discovery, scope creep, incidents,
          and demo day — against a grounded AI, not generic small talk.
        </p>
      </div>
      <SimulationsWorkspace sessions={sessions} portfolioItems={(items ?? []) as Pick<PortfolioItemRow, "id" | "title">[]} />
    </div>
  );
}
