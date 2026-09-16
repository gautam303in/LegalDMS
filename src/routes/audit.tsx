import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable, FilterBar, StatusBadge } from "@/components/legal/page-bits";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listAudit } from "@/lib/server/api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/audit")({ component: AuditPage });

function AuditPage() {
  const { data = [] } = useQuery({ queryKey: ["audit"], queryFn: () => listAudit() });
  const [q, setQ] = useState("");
  const [result, setResult] = useState("All");
  const filtered = useMemo(
    () =>
      data.filter((e) => {
        const matchQ =
          !q ||
          e.action.toLowerCase().includes(q.toLowerCase()) ||
          (e.object_name ?? "").toLowerCase().includes(q.toLowerCase());
        const matchR = result === "All" || e.result === result;
        return matchQ && matchR;
      }),
    [data, q, result],
  );

  return (
    <AppShell title="Audit logs">
      <p className="mb-4 text-sm text-ink-soft">
        Immutable record of access, generation, approval and denial. System administrators do not
        automatically receive document content through this log.
      </p>
      <FilterBar>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Action or object" className="max-w-xs" />
        <Select value={result} onChange={(e) => setResult(e.target.value)} className="w-40">
          <option>All</option>
          <option>Allowed</option>
          <option>Denied</option>
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          { key: "when", label: "Timestamp" },
          { key: "action", label: "Action" },
          { key: "object", label: "Object" },
          { key: "result", label: "Result" },
          { key: "ip", label: "IP" },
        ]}
        rows={filtered.map((e) => ({
          id: e.id,
          when: formatDate(e.created_at),
          action: e.action,
          object: (
            <span>
              {e.object_type}: {e.object_name}
            </span>
          ),
          result: <StatusBadge value={e.result} />,
          ip: e.ip_address,
        }))}
      />
    </AppShell>
  );
}
