import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/legal/page-bits";
import { listHearings, listTasks } from "@/lib/server/api";
import { formatDate, relativeDay } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({ component: CalendarPage });

function CalendarPage() {
  const { data: hearings = [] } = useQuery({ queryKey: ["hearings"], queryFn: () => listHearings() });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => listTasks() });
  const events = [
    ...hearings.map((h) => ({
      id: h.id,
      date: h.hearing_date,
      title: h.title,
      meta: `${h.court ?? ""} · ${h.hearing_time ?? ""}`,
      kind: "Hearing",
      extra: h.matter_name,
    })),
    ...tasks
      .filter((t) => t.due_date && t.status !== "Done")
      .map((t) => ({
        id: t.id,
        date: t.due_date,
        title: t.title,
        meta: t.assigned_to ?? "",
        kind: "Task",
        extra: t.matter_name,
      })),
  ].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  return (
    <AppShell title="Calendar">
      <ol className="space-y-3">
        {events.map((e) => (
          <li key={e.id} className="flex flex-wrap items-start gap-4 rounded-xl border border-line bg-raised p-4">
            <div className="w-28 shrink-0">
              <p className="text-sm font-medium tabular-nums">{formatDate(e.date)}</p>
              <p className="text-xs text-ink-faint">{relativeDay(e.date)}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{e.title}</p>
              <p className="text-sm text-ink-soft">
                {e.extra} · {e.meta}
              </p>
            </div>
            <StatusBadge value={e.kind} />
          </li>
        ))}
      </ol>
    </AppShell>
  );
}
