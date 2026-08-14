"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ProposalRow } from "@/types/db";

/**
 * Post-audit P1 fix — the monetisation journey previously dead-ended at a checklist; this gives it a real next action.
 * Value-layer wiring: accepts a prefill (from an offer on /what-can-i-sell or a project's asset factory) so the
 * Project -> Offer -> Proposal journey doesn't dead-end into a blank form the user has to re-fill from scratch.
 */
export function ProposalGeneratorDialog({
  portfolioItems,
  prefill,
  autoOpen,
}: {
  portfolioItems: { id: string; title: string }[];
  prefill?: { portfolioItemId?: string; serviceType?: string; buyerType?: string };
  autoOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(Boolean(autoOpen));
  const [portfolioItemId, setPortfolioItemId] = React.useState<string>(prefill?.portfolioItemId ?? "");
  const [serviceType, setServiceType] = React.useState(prefill?.serviceType ?? "");
  const [buyerType, setBuyerType] = React.useState(prefill?.buyerType ?? "");
  const [pricingNotes, setPricingNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [proposal, setProposal] = React.useState<ProposalRow | null>(null);
  const [approving, setApproving] = React.useState(false);

  async function generate() {
    if (!serviceType.trim() || !buyerType.trim()) {
      toast.error("Fill in service type and buyer type first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioItemId: portfolioItemId || null,
          serviceType,
          buyerType,
          pricingNotes: pricingNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProposal(data.proposal);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate a proposal.");
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (!proposal) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error();
      setProposal({ ...proposal, approved: true });
      toast.success("Proposal approved.");
    } catch {
      toast.error("Couldn't approve — try again.");
    } finally {
      setApproving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setProposal(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileText className="size-3.5" /> Generate a proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate a client proposal</DialogTitle>
        </DialogHeader>

        {!proposal ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Grounded only in your verified skills and (optionally) an approved project — never invented clients,
              revenue, or experience.
            </p>
            {portfolioItems.length > 0 && (
              <div>
                <Label className="text-micro">Base this on a project (optional)</Label>
                <Select value={portfolioItemId} onValueChange={setPortfolioItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No specific project" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolioItems.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-micro">Service type</Label>
              <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="e.g. AI automation implementation" />
            </div>
            <div>
              <Label className="text-micro">Buyer type</Label>
              <Input value={buyerType} onChange={(e) => setBuyerType(e.target.value)} placeholder="e.g. small e-commerce business" />
            </div>
            <div>
              <Label className="text-micro">Pricing notes (optional)</Label>
              <Textarea value={pricingNotes} onChange={(e) => setPricingNotes(e.target.value)} rows={2} placeholder="e.g. flat fee, ₹15,000-25,000 range" />
            </div>
            <Button onClick={generate} disabled={loading} className="w-fit">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Generate"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            <Section title="Problem" body={proposal.problem_statement} />
            <Section title="Proposed solution" body={proposal.proposed_solution} />
            <Section title="Scope" body={proposal.scope} />
            <ListSection title="Deliverables" items={proposal.deliverables} />
            <Section title="Timeline" body={proposal.timeline} />
            <ListSection title="Assumptions" items={proposal.assumptions} />
            <ListSection title="Exclusions" items={proposal.exclusions} />
            {proposal.pricing_structure && <Section title="Pricing (indicative)" body={proposal.pricing_structure} />}
            <Section title="Next step" body={proposal.next_step_cta} />
            {proposal.approved ? (
              <Badge variant="success" className="w-fit gap-1">
                <CheckCircle2 className="size-3.5" /> Approved
              </Badge>
            ) : (
              <Button size="sm" onClick={approve} disabled={approving} className="w-fit gap-1.5">
                {approving ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                Approve before sharing
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-1 list-disc pl-4">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
