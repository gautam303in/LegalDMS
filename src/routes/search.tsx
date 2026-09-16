import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/legal/page-bits";
import { Input } from "@/components/ui/input";
import { searchAll } from "@/lib/server/api";

type Search = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : "",
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(initial ?? "");
  const [submitted, setSubmitted] = useState(initial ?? "");
  const { data, isFetching } = useQuery({
    queryKey: ["search", submitted],
    queryFn: () => searchAll({ data: { q: submitted } }),
    enabled: submitted.trim().length >= 2,
  });

  return (
    <AppShell title="Search">
      <form
        className="mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(q);
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Parties, clauses, matter codes, document text…"
          className="max-w-xl"
        />
        <p className="mt-2 text-xs text-ink-faint">
          Results are limited to matters you are authorised to see. Unauthorized files never appear
          in snippets.
        </p>
      </form>
      {isFetching && <p className="text-sm text-ink-soft">Searching the repository…</p>}
      {data && (
        <div className="space-y-8">
          <Section title="Documents">
            {data.documents.map((d) => (
              <Link
                key={d.id}
                to="/documents/$documentId"
                params={{ documentId: d.id }}
                className="block rounded-lg border border-line bg-raised p-3 hover:bg-canvas/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{d.title}</p>
                  <StatusBadge value={d.classification} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-ink-soft">
                  {(d.content ?? "").slice(0, 220)}
                </p>
              </Link>
            ))}
            {data.documents.length === 0 && <p className="text-sm text-ink-faint">None.</p>}
          </Section>
          <Section title="Matters">
            {data.matters.map((m) => (
              <Link
                key={m.id}
                to="/matters/$matterId"
                params={{ matterId: m.id }}
                className="block rounded-lg border border-line bg-raised p-3 hover:bg-canvas/50"
              >
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-ink-soft">
                  {m.matter_code} · {m.client_name}
                </p>
              </Link>
            ))}
          </Section>
          <Section title="Clients">
            {data.clients.map((c) => (
              <Link
                key={c.id}
                to="/clients/$clientId"
                params={{ clientId: c.id }}
                className="block rounded-lg border border-line bg-raised p-3 hover:bg-canvas/50"
              >
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-ink-soft">{c.client_code}</p>
              </Link>
            ))}
          </Section>
          <Section title="Contracts">
            {data.contracts.map((c) => (
              <div key={c.id} className="rounded-lg border border-line bg-raised p-3">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-ink-soft">
                  {c.first_party} / {c.second_party}
                </p>
              </div>
            ))}
          </Section>
        </div>
      )}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-medium tracking-[0.14em] text-ink-soft uppercase">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
