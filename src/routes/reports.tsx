import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard } from "@/lib/server/api";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

const INK = ["#3a5566", "#2f5d45", "#8a5a22", "#8a3535", "#355a7a", "#5e6673", "#2c323c"];

function ReportsPage() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });
  const practice = data?.practiceBreakdown ?? [];
  const status = data?.contractStatus ?? [];

  return (
    <AppShell title="Reports">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Matters by practice</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={practice}>
                <CartesianGrid stroke="#d9d2c4" vertical={false} />
                <XAxis
                  dataKey="practice_area"
                  tick={{ fontSize: 10, fill: "#5e6673" }}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={72}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5e6673" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3a5566" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contract status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={status} dataKey="count" nameKey="status" innerRadius={50} outerRadius={90}>
                  {status.map((_, i) => (
                    <Cell key={i} fill={INK[i % INK.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Firm snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-4 text-sm">
            <Stat label="Clients" value={data?.counts.clients} />
            <Stat label="Active matters" value={data?.counts.matters} />
            <Stat label="Documents" value={data?.counts.documents} />
            <Stat label="Open holds" value={data?.counts.openHolds} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <p className="text-[11px] tracking-wide text-ink-faint uppercase">{label}</p>
      <p className="font-display text-3xl tabular-nums">{value ?? "—"}</p>
    </div>
  );
}
