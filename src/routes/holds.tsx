import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/legal/page-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/query-client";
import { createHold, listHolds, listMatters, releaseHold } from "@/lib/server/api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/holds")({ component: HoldsPage });

function HoldsPage() {
  const { data = [] } = useQuery({ queryKey: ["holds"], queryFn: () => listHolds() });
  const [open, setOpen] = useState(false);
  const release = useMutation({
    mutationFn: (id: string) => releaseHold({ data: { id } }),
    onSuccess: () => {
      toast.success("Hold released");
      void queryClient.invalidateQueries({ queryKey: ["holds"] });
    },
  });

  return (
    <AppShell title="Legal hold" actions={<Button onClick={() => setOpen(true)}>+ Create legal hold</Button>}>
      <p className="mb-4 max-w-2xl text-sm text-ink-soft">
        A hold overrides deletion, automated purge and unauthorised modification. Custodians are
        notified and acknowledgements are recorded in the audit trail.
      </p>
      <div className="space-y-3">
        {data.map((h) => (
          <article key={h.id} className="rounded-xl border border-line bg-raised p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{h.title}</p>
                <p className="text-sm text-ink-soft">
                  {h.matter_name} · effective {formatDate(h.effective_date)}
                </p>
                <p className="mt-2 text-sm text-ink-2">{h.reason}</p>
                <p className="mt-1 text-xs text-ink-faint">Custodians: {h.custodians}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={h.status} />
                {h.status === "Active" && (
                  <Button size="sm" variant="secondary" onClick={() => release.mutate(h.id)}>
                    Release
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      <NewHold open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}

function NewHold({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: matters = [] } = useQuery({ queryKey: ["matters"], queryFn: () => listMatters() });
  const [title, setTitle] = useState("");
  const [matter_id, setMatter] = useState("");
  const [reason, setReason] = useState("");
  const [custodians, setCustodians] = useState("");
  const mutation = useMutation({
    mutationFn: () => createHold({ data: { title, matter_id: matter_id || undefined, reason, custodians } }),
    onSuccess: () => {
      toast.success("Hold applied — deletion blocked");
      void queryClient.invalidateQueries({ queryKey: ["holds"] });
      onOpenChange(false);
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply legal hold</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Matter</Label>
            <Select value={matter_id} onChange={(e) => setMatter(e.target.value)}>
              <option value="">—</option>
              {matters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Textarea required value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Custodians</Label>
            <Input value={custodians} onChange={(e) => setCustodians(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Apply hold</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
