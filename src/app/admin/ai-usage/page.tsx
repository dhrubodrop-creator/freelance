import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AITask } from "@/lib/ai/router";

interface AIUsageLogRow {
  id: string;
  provider: string;
  model: string;
  task: AITask;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number;
  success: boolean;
  error_message: string | null;
  retry_count: number;
  cache_hit: boolean;
  deduped: boolean;
  created_at: string;
}

/** Cerebras doesn't publish per-token pricing for this free/preview tier — this is a placeholder
 * multiplier so the admin view has a directional cost signal, not an invoiced number. Update once a
 * real rate is confirmed; keep it configurable rather than hardcoding a guess as fact. */
const ESTIMATED_USD_PER_1K_OUTPUT_TOKENS = Number(process.env.AI_ESTIMATED_USD_PER_1K_OUTPUT_TOKENS ?? "0");

export default async function AdminAIUsagePage() {
  const supabase = supabaseAdmin();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString();

  const [{ data: recentLogs }, { data: weekLogs }] = await Promise.all([
    supabase.from("ai_usage_logs").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("ai_usage_logs").select("*").gte("created_at", since),
  ]);

  const recent = (recentLogs ?? []) as AIUsageLogRow[];
  const week = (weekLogs ?? []) as AIUsageLogRow[];

  const totalCalls = week.length;
  const failedCalls = week.filter((l) => !l.success).length;
  const cacheHits = week.filter((l) => l.cache_hit).length;
  const dedupedCalls = week.filter((l) => l.deduped).length;
  const retriedCalls = week.filter((l) => l.retry_count > 0).length;
  const totalOutputTokens = week.reduce((sum, l) => sum + (l.output_tokens ?? 0), 0);
  const avgLatency =
    week.length > 0 ? Math.round(week.reduce((sum, l) => sum + l.latency_ms, 0) / week.length) : 0;
  const estimatedCost = (totalOutputTokens / 1000) * ESTIMATED_USD_PER_1K_OUTPUT_TOKENS;

  const byTask = new Map<string, { count: number; failures: number }>();
  for (const log of week) {
    const entry = byTask.get(log.task) ?? { count: 0, failures: 0 };
    entry.count += 1;
    if (!log.success) entry.failures += 1;
    byTask.set(log.task, entry);
  }

  const stats = [
    { label: "Calls (7d)", value: totalCalls },
    { label: "Failed (7d)", value: failedCalls },
    { label: "Cache hits (7d)", value: cacheHits },
    { label: "Deduped (7d)", value: dedupedCalls },
    { label: "Retried (7d)", value: retriedCalls },
    { label: "Avg latency", value: `${avgLatency}ms` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-h3 font-semibold">AI usage</h2>
        <p className="text-sm text-muted-foreground">
          Every AI call in the app routes through one place (src/lib/ai/router.ts) and logs here — this is
          how we know whether the free/low-cost AI strategy is actually sustainable.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4">
              <p className="font-heading text-xl font-bold">{s.value}</p>
              <p className="text-micro text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {ESTIMATED_USD_PER_1K_OUTPUT_TOKENS > 0 && (
        <p className="text-micro text-muted-foreground">
          Estimated cost (7d), using a configured placeholder rate, not an invoiced figure: ${estimatedCost.toFixed(4)}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volume by task (7d)</CardTitle>
          <CardDescription>Where AI spend is actually going.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Calls</TableHead>
                <TableHead>Failures</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(byTask.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .map(([task, entry]) => (
                  <TableRow key={task}>
                    <TableCell className="text-sm">{task}</TableCell>
                    <TableCell>{entry.count}</TableCell>
                    <TableCell className={entry.failures > 0 ? "text-destructive" : ""}>{entry.failures}</TableCell>
                  </TableRow>
                ))}
              {byTask.size === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No AI calls in the last 7 days.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last 100 calls</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-micro text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-sm">{log.task}</TableCell>
                  <TableCell className="text-micro text-muted-foreground">{log.model}</TableCell>
                  <TableCell className="text-micro text-muted-foreground">
                    {log.input_tokens ?? "—"} in / {log.output_tokens ?? "—"} out
                  </TableCell>
                  <TableCell className="text-micro text-muted-foreground">{log.latency_ms}ms</TableCell>
                  <TableCell className="text-micro text-muted-foreground">{log.retry_count}</TableCell>
                  <TableCell>
                    {log.success ? (
                      log.cache_hit ? (
                        <Badge variant="outline">cache hit</Badge>
                      ) : log.deduped ? (
                        <Badge variant="outline">deduped</Badge>
                      ) : (
                        <Badge variant="success">ok</Badge>
                      )
                    ) : (
                      <Badge variant="destructive" title={log.error_message ?? ""}>
                        failed
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {recent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No AI calls logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
