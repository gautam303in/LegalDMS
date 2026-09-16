import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/legal/page-bits";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listClauses } from "@/lib/server/api";

export const Route = createFileRoute("/clauses")({ component: ClausesPage });

function ClausesPage() {
  const { data = [] } = useQuery({ queryKey: ["clauses"], queryFn: () => listClauses() });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...Array.from(new Set(data.map((c) => c.category)))], [data]);
  const filtered = data.filter(
    (c) =>
      (cat === "All" || c.category === cat) &&
      (!q ||
        c.title.toLowerCase().includes(q.toLowerCase()) ||
        c.body.toLowerCase().includes(q.toLowerCase())),
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const active = filtered.find((c) => c.id === openId) ?? filtered[0];

  return (
    <AppShell title="Clause library">
      <div className="mb-4 flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clauses" className="max-w-xs" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-48">
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-raised">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setOpenId(c.id)}
                className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-canvas/60"
              >
                <span className="text-xs tabular-nums text-ink-faint">{c.clause_code}</span>
                <span className="text-sm font-medium">{c.title}</span>
                <span className="text-xs text-ink-soft">
                  {c.category} · {c.jurisdiction}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {active && (
          <article className="rounded-xl border border-line bg-raised p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl">{active.title}</h2>
              <StatusBadge value={active.status} />
              <StatusBadge value={active.risk_category ?? ""} />
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {active.clause_code} · {active.category} · {active.practice_area}
            </p>
            <div className="mt-5 whitespace-pre-wrap font-display text-[15px] leading-relaxed text-ink-2">
              {active.body}
            </div>
            <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-xs tracking-wide text-ink-faint uppercase">Preferred</dt>
                <dd>{active.preferred_position}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-ink-faint uppercase">Fallback</dt>
                <dd>{active.fallback_position}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs tracking-wide text-ink-faint uppercase">Guidance</dt>
                <dd>{active.guidance}</dd>
              </div>
            </dl>
          </article>
        )}
      </div>
    </AppShell>
  );
}
