import type { EarningsIllustration } from "@/components/marketing/earnings-illustration";

function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function EarningsChart({ illustration }: { illustration: EarningsIllustration }) {
  const max = Math.max(...illustration.rows.map((r) => r.monthly));

  return (
    <div className="flex flex-col gap-5">
      <p className="text-micro font-semibold uppercase tracking-wide text-accent-600">
        {illustration.scenario}
      </p>
      <div className="flex flex-col gap-4">
        {illustration.rows.map((row) => {
          const widthPct = Math.max(8, Math.round((row.monthly / max) * 100));
          return (
            <div key={row.label} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{row.label}</span>
                <span className="font-heading text-sm font-semibold">
                  {formatINR(row.monthly)}
                  <span className="ml-1 text-micro font-normal text-muted-foreground">/ month</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-600 to-accent"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="text-micro text-muted-foreground">{row.note}</span>
            </div>
          );
        })}
      </div>
      <p className="text-micro text-muted-foreground">
        Illustrative example — your results will vary based on niche, effort, and client base.
      </p>
    </div>
  );
}
