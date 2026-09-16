import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard, StatusBadge } from "@/components/legal/page-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reviewContract } from "@/lib/server/ai";
import { getContract } from "@/lib/server/api";
import { formatDate, formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/contracts/$contractId")({ component: ContractDetail });

function tone(sev: string) {
  const s = sev.toLowerCase();
  if (s.startsWith("h") || s.startsWith("c")) return "danger" as const;
  if (s.startsWith("m")) return "warn" as const;
  if (s.startsWith("l")) return "ok" as const;
  return "info" as const;
}

function ContractDetail() {
  const { contractId } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: () => getContract({ data: { id: contractId } }),
  });
  const review = useMutation({
    mutationFn: () => reviewContract({ data: { contractId } }),
    onError: () => toast.error("Review failed"),
  });

  if (!data) {
    return (
      <AppShell title="Contract">
        <p className="text-sm text-ink-soft">Loading contract…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={data.title}
      actions={
        <Button onClick={() => review.mutate()} disabled={review.isPending}>
          {review.isPending ? "Reviewing against playbook…" : "Run AI contract review"}
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge value={data.status} />
        {data.auto_renewal && <Badge tone="warn">Auto-renewal</Badge>}
        <span className="text-sm text-ink-soft">{data.contract_type}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Value" value={formatMoney(data.contract_value, data.currency ?? "INR")} />
        <MetricCard label="Risk score" value={data.risk_score ?? "—"} />
        <MetricCard label="Effective" value={formatDate(data.effective_date)} />
        <MetricCard label="Expiry" value={formatDate(data.expiry_date)} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Parties and terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-ink-2">
            <p>First party: {data.first_party}</p>
            <p>Second party: {data.second_party}</p>
            <p>Governing law: {data.governing_law}</p>
            <p>Notice period: {data.notice_period_days ?? "—"} days</p>
            <p>Renewal: {formatDate(data.renewal_date)}</p>
            {data.client_id && (
              <p>
                Client file:{" "}
                <Link
                  to="/clients/$clientId"
                  params={{ clientId: data.client_id }}
                  className="text-accent hover:underline"
                >
                  {data.client_name}
                </Link>
              </p>
            )}
            {data.document_id && (
              <p>
                Source document:{" "}
                <Link
                  to="/documents/$documentId"
                  params={{ documentId: data.document_id }}
                  className="text-accent hover:underline"
                >
                  Open
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI findings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!review.data && (
              <p className="text-sm text-ink-soft">
                Run a playbook review to flag missing clauses, liability exposure, auto-renewal and
                data-protection issues. Every finding is advisory.
              </p>
            )}
            {review.data && !review.data.ok && (
              <p className="text-sm text-danger">{review.data.error}</p>
            )}
            {review.data && review.data.ok &&
              review.data.findings.map((f, i) => (
                <div key={i} className="rounded-lg border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{f.clause}</p>
                    <Badge tone={tone(f.severity)}>{f.severity}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">{f.location}</p>
                  <p className="mt-2 text-sm text-ink-2">{f.explanation}</p>
                  <p className="mt-1 text-sm text-accent">{f.recommendation}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
