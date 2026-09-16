import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable, FilterBar, MetricCard, StatusBadge } from "@/components/legal/page-bits";
import { Input } from "@/components/ui/input";
import { listContracts } from "@/lib/server/api";
import { daysUntil, formatDate, formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/contracts")({ component: ContractsRouteComponent });

function ContractsRouteComponent() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <ContractsPage />;
}

function ContractsPage() {
  const { data = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => listContracts() });
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      data.filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q.toLowerCase()) ||
          (c.first_party ?? "").toLowerCase().includes(q.toLowerCase()) ||
          (c.second_party ?? "").toLowerCase().includes(q.toLowerCase()),
      ),
    [data, q],
  );
  const exp30 = data.filter((c) => {
    const d = daysUntil(c.expiry_date);
    return d !== null && d >= 0 && d <= 30;
  }).length;
  const exp90 = data.filter((c) => {
    const d = daysUntil(c.expiry_date);
    return d !== null && d >= 0 && d <= 90;
  }).length;
  const high = data.filter((c) => (c.risk_score ?? 0) >= 60).length;

  return (
    <AppShell title="Contracts">
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active register" value={data.length} />
        <MetricCard label="Expiring in 30 days" value={exp30} />
        <MetricCard label="Expiring in 90 days" value={exp90} />
        <MetricCard label="High risk" value={high} />
      </div>
      <FilterBar>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Party or title" className="max-w-xs" />
      </FilterBar>
      <DataTable
        columns={[
          { key: "title", label: "Contract" },
          { key: "parties", label: "Parties" },
          { key: "value", label: "Value" },
          { key: "expiry", label: "Expiry" },
          { key: "risk", label: "Risk" },
          { key: "status", label: "Status" },
        ]}
        rows={filtered.map((c) => ({
          id: c.id,
          href: `/contracts/${c.id}`,
          title: c.title,
          parties: (
            <span>
              {c.first_party}
              <span className="text-ink-faint"> / </span>
              {c.second_party}
            </span>
          ),
          value: formatMoney(c.contract_value, c.currency ?? "INR"),
          expiry: formatDate(c.expiry_date),
          risk: c.risk_score ?? "—",
          status: <StatusBadge value={c.status} />,
        }))}
      />
      <p className="mt-3 text-xs text-ink-faint">
        Open a contract to run an AI playbook review. Findings are advisory and require counsel sign-off.
      </p>
      <div className="mt-2 hidden">
        <Link to="/contracts">.</Link>
      </div>
    </AppShell>
  );
}
