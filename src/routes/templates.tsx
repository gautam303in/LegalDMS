import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/legal/page-bits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listTemplates } from "@/lib/server/api";

export const Route = createFileRoute("/templates")({ component: TemplatesPage });

function TemplatesPage() {
  const { data = [] } = useQuery({ queryKey: ["templates"], queryFn: () => listTemplates() });
  return (
    <AppShell title="Templates">
      <p className="mb-4 text-sm text-ink-soft">
        Approved forms used by AI drafting. Retired templates are never selected for generation.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle>{t.name}</CardTitle>
                <StatusBadge value={t.status} />
              </div>
              <p className="text-xs text-ink-soft">
                {t.document_type} · {t.jurisdiction} · v{t.version}
              </p>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-5 text-sm leading-relaxed text-ink-2">{t.body}</p>
              <Link to="/drafting" className="mt-3 inline-block text-sm text-accent hover:underline">
                Draft from this form
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
