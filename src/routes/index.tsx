import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LoginView } from "@/components/auth/login-view";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard, StatusBadge } from "@/components/legal/page-bits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getDashboard } from "@/lib/server/api";
import { formatDate, relativeDay } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user } = useCurrentUserState();
  if (user) return <Dashboard />;
  return <LoginView />;
}

function Dashboard() {
  const { data, isPending } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

  return (
    <AppShell title="Dashboard">
      {isPending || !data ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-ink-soft">
            {data.profile.firm_name} · {data.profile.role} workspace
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Active matters" value={data.counts.matters} href="/matters" />
            <MetricCard
              label="Pending reviews"
              value={data.counts.pendingReviews}
              href="/approvals"
              hint="Awaiting partner action"
            />
            <MetricCard
              label="Expiring contracts"
              value={data.counts.expiringContracts}
              href="/contracts"
              hint="Next 90 days"
            />
            <MetricCard
              label="Upcoming hearings"
              value={data.counts.upcomingHearings}
              href="/calendar"
            />
            <MetricCard label="Overdue tasks" value={data.counts.overdueTasks} href="/tasks" />
            <MetricCard label="Documents" value={data.counts.documents} href="/documents" />
            <MetricCard label="Clients" value={data.counts.clients} href="/clients" />
            <MetricCard label="Legal holds" value={data.counts.openHolds} href="/holds" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming hearings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.upcomingHearings.length === 0 && (
                  <p className="text-sm text-ink-faint">No hearings scheduled.</p>
                )}
                {data.upcomingHearings.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{h.title}</p>
                      <p className="text-xs text-ink-soft">
                        {h.matter_name} · {h.court}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs tabular-nums text-ink-soft">
                      {formatDate(h.hearing_date)} {h.hearing_time}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expiring contracts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.expiringContracts.map((c) => (
                  <Link
                    key={c.id}
                    to="/contracts/$contractId"
                    params={{ contractId: c.id }}
                    className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{c.title}</p>
                      <p className="text-xs text-ink-soft">{c.client_name}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge value={c.status} />
                      <p className="mt-1 text-xs text-ink-faint">{relativeDay(c.expiry_date)}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Work queue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.overdueTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{t.title}</p>
                      <p className="text-xs text-ink-soft">
                        {t.assigned_to} · {t.matter_name}
                      </p>
                    </div>
                    <StatusBadge value={t.status} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recentDocuments.map((d) => (
                  <Link
                    key={d.id}
                    to="/documents/$documentId"
                    params={{ documentId: d.id }}
                    className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{d.title}</p>
                      <p className="text-xs text-ink-soft">
                        {d.document_type} · {d.matter_name}
                      </p>
                    </div>
                    <StatusBadge value={d.status} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}
