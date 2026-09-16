import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/legal/page-bits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClient } from "@/lib/server/api";

export const Route = createFileRoute("/clients/$clientId")({ component: ClientDetail });

function ClientDetail() {
  const { clientId } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClient({ data: { id: clientId } }),
  });
  if (!data) {
    return (
      <AppShell title="Client">
        <p className="text-sm text-ink-soft">Loading client file…</p>
      </AppShell>
    );
  }
  const { client } = data;
  return (
    <AppShell title={client.name}>
      <p className="mb-4 text-sm text-ink-soft">
        {client.client_code} · {client.type} · {client.jurisdiction}
      </p>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matters">Matters</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Industry" value={client.industry} />
                <Field label="Partner" value={client.responsible_partner} />
                <Field label="City" value={client.city} />
                <Field label="Country" value={client.country} />
                <Field label="Email" value={client.email} />
                <Field label="Phone" value={client.phone} />
                <Field label="Registration" value={client.registration_number} />
                <Field label="PAN" value={client.pan_masked} />
                <Field label="Risk" value={client.risk_level} />
                <Field label="Status" value={client.status} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-ink-2">{client.notes}</p>
                <p className="mt-4 text-sm text-ink-soft">{client.address}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="matters">
          <ul className="divide-y divide-line rounded-xl border border-line bg-raised">
            {data.matters.map((m) => (
              <li key={m.id}>
                <Link
                  to="/matters/$matterId"
                  params={{ matterId: m.id }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-canvas/60"
                >
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-ink-soft">
                      {m.matter_code} · {m.practice_area}
                    </p>
                  </div>
                  <StatusBadge value={m.status} />
                </Link>
              </li>
            ))}
          </ul>
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
                  <p className="text-sm font-medium">{d.title}</p>
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
                <p className="text-sm font-medium">{c.title}</p>
                <StatusBadge value={c.status} />
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[11px] tracking-wide text-ink-faint uppercase">{label}</p>
      <p className="text-ink-2">{value || "—"}</p>
    </div>
  );
}
