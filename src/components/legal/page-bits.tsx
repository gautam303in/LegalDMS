import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, statusTone } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <Card className="p-4 transition-colors duration-150 hover:border-line-strong">
      <p className="text-[11px] font-medium tracking-[0.12em] text-ink-soft uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl tabular-nums tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </Card>
  );
  if (href) return <Link to={href}>{inner}</Link>;
  return inner;
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge tone={statusTone(value)}>{value}</Badge>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {body && <p className="mt-1 max-w-md text-sm text-ink-soft">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: { key: string; label: string; className?: string }[];
  rows: Array<Record<string, ReactNode> & { id: string; href?: string }>;
  empty?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={empty ?? "No records"} />;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-raised">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line bg-canvas/60 text-[11px] tracking-[0.12em] text-ink-soft uppercase">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn("px-4 py-2.5 font-medium", c.className)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const cells = columns.map((c) => (
              <td key={c.key} className={cn("px-4 py-3 text-ink-2", c.className)}>
                {row[c.key]}
              </td>
            ));
            return row.href ? (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-canvas/50">
                {cells.map((cell, i) =>
                  i === 0 ? (
                    <td key={columns[i].key} className={cn("px-4 py-3", columns[i].className)}>
                      <Link
                        to={row.href as never}
                        className="font-medium text-ink hover:underline"
                      >
                        {row[columns[i].key]}
                      </Link>
                    </td>
                  ) : (
                    cell
                  ),
                )}
              </tr>
            ) : (
              <tr key={row.id} className="border-b border-line last:border-0">
                {cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DocumentPreview({
  title,
  content,
  meta,
}: {
  title: string;
  content: string | null;
  meta?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-canvas">
      <div className="mx-auto my-6 min-h-[28rem] w-[min(100%-1.5rem,42rem)] bg-raised px-8 py-10 shadow-paper md:px-12">
        <p className="text-center text-[10px] tracking-[0.2em] text-ink-faint uppercase">
          Draft — for legal review
        </p>
        <h2 className="mt-4 text-center font-display text-xl tracking-tight text-ink">{title}</h2>
        {meta && <p className="mt-1 text-center text-xs text-ink-faint">{meta}</p>}
        <div className="mx-auto mt-4 h-px w-16 bg-line" />
        <div className="mt-6 whitespace-pre-wrap font-display text-[15px] leading-relaxed text-ink-2">
          {content || "No extracted text is available for this file."}
        </div>
      </div>
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}
