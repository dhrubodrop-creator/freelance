import { redirect } from "next/navigation";
import { ExternalLink, Plus, Wrench } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { PortfolioFormDialog } from "@/components/profile/portfolio-form-dialog";
import type { PortfolioItemRow, SkillRow } from "@/types/db";

export default async function PortfolioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [{ data: items }, { data: allSkills }, { data: itemSkillLinks }] = await Promise.all([
    supabase.from("portfolio_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("skills").select("*").order("name"),
    supabase.from("portfolio_item_skills").select("portfolio_item_id, skill_id"),
  ]);

  const portfolioItems = (items ?? []) as PortfolioItemRow[];
  const skills = (allSkills ?? []) as SkillRow[];
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const skillsByItem = new Map<string, string[]>();
  for (const link of itemSkillLinks ?? []) {
    const list = skillsByItem.get(link.portfolio_item_id) ?? [];
    list.push(link.skill_id);
    skillsByItem.set(link.portfolio_item_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-h2 font-bold">Portfolio</h1>
          <p className="mt-1 text-muted-foreground">
            Real proof of what you&rsquo;ve built — not &ldquo;I took a course,&rdquo; but &ldquo;I built this.&rdquo;
          </p>
        </div>
        <PortfolioFormDialog
          title="Add a project"
          skills={skills}
          trigger={
            <Button className="gap-1.5">
              <Plus className="size-4" /> Add project
            </Button>
          }
        />
      </div>

      {portfolioItems.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No projects yet. Add your first build from a course module or a client project.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {portfolioItems.map((item) => {
          const itemSkillIds = skillsByItem.get(item.id) ?? [];
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <div className="flex shrink-0 items-center gap-1">
                    <PortfolioFormDialog
                      title="Edit project"
                      skills={skills}
                      initial={item}
                      initialSkillIds={itemSkillIds}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      }
                    />
                    <DeleteButton endpoint={`/api/portfolio/${item.id}`} confirmMessage="Delete this project?" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                {item.outcome && (
                  <p className="text-sm">
                    <span className="font-semibold">Outcome: </span>
                    {item.outcome}
                  </p>
                )}
                {item.tools_used.length > 0 && (
                  <div className="flex items-center gap-1.5 text-micro text-muted-foreground">
                    <Wrench className="size-3.5" />
                    {item.tools_used.join(", ")}
                  </div>
                )}
                {itemSkillIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {itemSkillIds.map((sid) => {
                      const skill = skillById.get(sid);
                      return skill ? (
                        <Badge key={sid} variant="accent">
                          {skill.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
                {item.links.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {item.links.map((link) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-1.5 text-sm text-accent-600 hover:underline"
                      >
                        <ExternalLink className="size-3.5" />
                        {link}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
