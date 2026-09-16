import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMoney(
  value: string | number | null | undefined,
  currency = "INR",
): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString("en-IN")}`;
  }
}

export function initials(name: string | null | undefined): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export type BadgeTone = "neutral" | "accent" | "ok" | "warn" | "danger" | "info";

export function statusTone(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (
    ["active", "approved", "executed", "done", "completed", "cleared", "allowed"].some((k) =>
      s.includes(k),
    )
  )
    return "ok";
  if (["pending", "review", "draft", "scheduled", "open", "negotiation"].some((k) => s.includes(k)))
    return "warn";
  if (["expired", "rejected", "overdue", "denied", "terminated", "hold"].some((k) => s.includes(k)))
    return "danger";
  if (["privileged", "confidential", "high"].some((k) => s.includes(k))) return "info";
  return "neutral";
}


export function relativeDay(value: string | null | undefined): string {
  const n = daysUntil(value);
  if (n === null) return "—";
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1) return `In ${n} days`;
  return `${Math.abs(n)} days ago`;
}
