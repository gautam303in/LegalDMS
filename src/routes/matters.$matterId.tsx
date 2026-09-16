import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/legal/page-bits";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMatter } from "@/lib/server/api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/matters/$matterId")({ component: MatterDetail });

function MatterDetail() {
  const { matterId } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: () => getMatter({ data: { id: matterId } }),
  });
  if (!data) {
    return (
      <AppShell title="Matter">
        <p className="text-sm text-ink-soft">Loading matter…</p>
      </AppShell>
    );
  }
  const { matter } = data;
  return (
    <AppShell title={matter.name}>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <span>{matter.matter_code}</span>
        <span>·</span>
        <Link to="/clients/$clientId" params={{ clientId: matter.client_id }} className="hover:underline">
          {matter.client_name}
        </Link>
        <span>·</span>
        <span>{matter.practice_area}</span>
        {matter.ethical_wall && <Badge tone="danger">Ethical wall</Badge>}
        <StatusBadge value={matter.status} />
        <StatusBadge value={matter.confidentiality} />
      </div>
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-ink-2">{matter.description}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Opened {formatDate(matter.opening_date)}</p>
                <p>Partner {matter.responsible_partner}</p>
                <p>Jurisdiction {matter.jurisdiction}</p>
                <p>{data.documents.length} documents</p>
                <p>{data.tasks.length} tasks</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="documents">
          <ul className="divide-y divide-line rounded-xl border border-line bg-raised">
            {data.documents.map((d) => (
              <li key={d.id}>
                <Link
                  to="/documents/$documentId"
                  params={{ documentId: d.id }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-canvas/60"
                >
                  <div>
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-ink-soft">
                      {d.document_type} · v{d.version}
                    </p>
                  </div>
                  <StatusBadge value={d.status} />
                </Link>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="contracts">
          <ul className="divide-y divide-line rounded-xl border border-line bg-raised">
            {data.contracts.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-ink-soft">
                    {c.first_party} / {c.second_party}
                  </p>
                </div>
                <StatusBadge value={c.status} />
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="tasks">
          <ul className="divide-y divide-line rounded-xl border border-line bg-raised">
            {data.tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-ink-soft">
                    {t.assigned_to} · due {formatDate(t.due_date)}
                  </p>
                </div>
                <StatusBadge value={t.status} />
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="calendar">
          <ul className="divide-y divide-line rounded-xl border border-line bg-raised">
            {data.hearings.map((h) => (
              <li key={h.id} className="px-4 py-3">
                <p className="text-sm font-medium">{h.title}</p>
                <p className="text-xs text-ink-soft">
                  {formatDate(h.hearing_date)} {h.hearing_time} · {h.court}
                </p>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Access controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-ink-2">
              <p>Classification: {matter.confidentiality}</p>
              <p>Ethical wall: {matter.ethical_wall ? "In force — allow-list only" : "Not applied"}</p>
              <p>Legal holds on this matter: {data.holds.length}</p>
              {data.holds.map((h) => (
                <p key={h.id} className="text-ink-soft">
                  {h.title} — {h.status}
                </p>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
