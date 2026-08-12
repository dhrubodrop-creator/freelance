"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SkillCategoryRow, SkillLevel, SkillRow, UserSkillRow } from "@/types/db";

const LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced", "expert"];
const LEVEL_LABEL: Record<SkillLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export function SkillsGrid({
  categories,
  skills,
  userSkills,
}: {
  categories: SkillCategoryRow[];
  skills: SkillRow[];
  userSkills: UserSkillRow[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);
  const mine = new Map(userSkills.map((us) => [us.skill_id, us]));

  async function addSkill(skillId: string, selfLevel: SkillLevel) {
    setPending(skillId);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, selfLevel }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Something went wrong.");
      }
      toast.success("Skill added");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  async function updateLevel(skillId: string, selfLevel: SkillLevel) {
    setPending(skillId);
    try {
      const res = await fetch(`/api/skills/${skillId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfLevel }),
      });
      if (!res.ok) throw new Error("Something went wrong.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  async function removeSkill(skillId: string) {
    setPending(skillId);
    try {
      const res = await fetch(`/api/skills/${skillId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Something went wrong.");
      toast.success("Skill removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {categories.map((category) => {
        const categorySkills = skills.filter((s) => s.category_id === category.id);
        if (categorySkills.length === 0) return null;
        return (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="text-base">{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {categorySkills.map((skill) => {
                const owned = mine.get(skill.id);
                const busy = pending === skill.id;
                return (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{skill.name}</span>
                      {skill.description && (
                        <span className="text-micro text-muted-foreground">{skill.description}</span>
                      )}
                    </div>
                    {owned ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Select
                          value={owned.self_level}
                          onValueChange={(v) => updateLevel(skill.id, v as SkillLevel)}
                          disabled={busy}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEVELS.map((l) => (
                              <SelectItem key={l} value={l}>
                                {LEVEL_LABEL[l]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove skill"
                          disabled={busy}
                          onClick={() => removeSkill(skill.id)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        disabled={busy}
                        onClick={() => addSkill(skill.id, "beginner")}
                      >
                        <Plus className="size-3.5" /> Add
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
