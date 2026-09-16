import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/legal/page-bits";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/query-client";
import { decideApproval, listApprovals } from "@/lib/server/api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/approvals")({ component: ApprovalsPage });

function ApprovalsPage() {
  const { data = [] } = useQuery({ queryKey: ["approvals"], queryFn: () => listApprovals() });
  const decide = useMutation({
    mutationFn: (input: { id: string; decision: "Approved" | "Rejected" | "Changes Requested" }) =>
      decideApproval({ data: input }),
    onSuccess: () => {
      toast.success("Decision recorded");
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
  const pending = data.filter((a) => a.status === "Pending");
  const rest = data.filter((a) => a.status !== "Pending");

  return (
    <AppShell title="Approvals">
      <h2 className="mb-3 text-xs font-medium tracking-[0.14em] text-ink-soft uppercase">
        Pending my approval
      </h2>
      <div className="space-y-3">
        {pending.length === 0 && <p className="text-sm text-ink-faint">Inbox is clear.</p>}
        {pending.map((a) => (
          <article key={a.id} className="rounded-xl border border-line bg-raised p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{a.title}</p>
                <p className="text-sm text-ink-soft">
                  {a.matter_name} · {a.submitted_by} · {a.current_stage} · due {formatDate(a.due_date)}
                </p>
              </div>
              <StatusBadge value={a.risk_level ?? a.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {a.document_id && (
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/documents/$documentId" params={{ documentId: a.document_id }}>
                    Open document
                  </Link>
                </Button>
              )}
              <Button size="sm" onClick={() => decide.mutate({ id: a.id, decision: "Approved" })}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => decide.mutate({ id: a.id, decision: "Changes Requested" })}
              >
                Request changes
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => decide.mutate({ id: a.id, decision: "Rejected" })}
              >
                Reject
              </Button>
            </div>
          </article>
        ))}
      </div>
      <h2 className="mt-8 mb-3 text-xs font-medium tracking-[0.14em] text-ink-soft uppercase">
        Closed
      </h2>
      <ul className="divide-y divide-line rounded-xl border border-line bg-raised">
        {rest.map((a) => (
          <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{a.title}</span>
            <StatusBadge value={a.status} />
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
