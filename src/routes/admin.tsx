import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/legal/page-bits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard, listTeam } from "@/lib/server/api";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const MATRIX: { perm: string; partner: boolean; senior: boolean; associate: boolean; para: boolean }[] = [
  { perm: "DOCUMENT_VIEW", partner: true, senior: true, associate: true, para: true },
  { perm: "DOCUMENT_DOWNLOAD", partner: true, senior: true, associate: true, para: false },
  { perm: "DOCUMENT_EDIT", partner: true, senior: true, associate: true, para: true },
  { perm: "DOCUMENT_DELETE", partner: true, senior: false, associate: false, para: false },
  { perm: "DOCUMENT_SHARE_EXTERNAL", partner: true, senior: true, associate: false, para: false },
  { perm: "AI_DRAFT_GENERATE", partner: true, senior: true, associate: true, para: false },
  { perm: "AI_DRAFT_APPROVE", partner: true, senior: false, associate: false, para: false },
  { perm: "DOCUMENT_LEGAL_HOLD_APPLY", partner: true, senior: false, associate: false, para: false },
];

function Cell({ on }: { on: boolean }) {
  return <td className="px-3 py-2 text-center text-sm">{on ? "Yes" : "—"}</td>;
}

function AdminPage() {
  const { data: team = [] } = useQuery({ queryKey: ["team"], queryFn: () => listTeam() });
  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

  return (
    <AppShell title="Administration">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-ink-2">
            <p>Firm: {dash?.profile.firm_name}</p>
            <p>Your role: {dash?.profile.role}</p>
            <p>Data residency: India (primary) · Singapore (arbitration files)</p>
            <p>Retention default: 8 years from matter close, unless a hold applies</p>
            <p>MFA: required for partners and compliance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>People</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {team.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <span>
                    <span className="font-medium">{m.name}</span>
                    <span className="text-ink-soft"> · {m.role}</span>
                  </span>
                  <StatusBadge value={m.status ?? "Active"} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4 overflow-x-auto">
        <CardHeader>
          <CardTitle>Permission matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="text-[11px] tracking-[0.12em] text-ink-soft uppercase">
              <tr>
                <th className="py-2">Permission</th>
                <th className="py-2 text-center">Partner</th>
                <th className="py-2 text-center">Senior</th>
                <th className="py-2 text-center">Associate</th>
                <th className="py-2 text-center">Paralegal</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((r) => (
                <tr key={r.perm} className="border-t border-line">
                  <td className="py-2 font-mono text-xs">{r.perm}</td>
                  <Cell on={r.partner} />
                  <Cell on={r.senior} />
                  <Cell on={r.associate} />
                  <Cell on={r.para} />
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink-faint">
            Deny by default. Matter membership, ethical walls and classification still apply after a
            role permission is granted. Administrators do not bypass walls.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
