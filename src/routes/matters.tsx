import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable, FilterBar, StatusBadge } from "@/components/legal/page-bits";
import { Badge } from "@/components/ui/badge";
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
import { createMatter, listClients, listMatters } from "@/lib/server/api";
import { PRACTICE_AREAS } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/matters")({ component: MattersRouteComponent });

function MattersRouteComponent() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <MattersPage />;
}

function MattersPage() {
  const { data = [] } = useQuery({ queryKey: ["matters"], queryFn: () => listMatters() });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = useMemo(
    () =>
      data.filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q.toLowerCase()) ||
          m.matter_code.toLowerCase().includes(q.toLowerCase()) ||
          (m.client_name ?? "").toLowerCase().includes(q.toLowerCase()),
      ),
    [data, q],
  );

  return (
    <AppShell title="Matters" actions={<Button onClick={() => setOpen(true)}>+ New matter</Button>}>
      <FilterBar>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter matters" className="max-w-xs" />
      </FilterBar>
      <DataTable
        columns={[
          { key: "code", label: "Matter ID" },
          { key: "name", label: "Matter" },
          { key: "client", label: "Client" },
          { key: "practice", label: "Practice" },
          { key: "partner", label: "Partner" },
          { key: "opened", label: "Opened" },
          { key: "status", label: "Status" },
        ]}
        rows={filtered.map((m) => ({
          id: m.id,
          href: `/matters/${m.id}`,
          code: m.matter_code,
          name: (
            <span className="inline-flex items-center gap-2">
              {m.name}
              {m.ethical_wall && <Badge tone="danger">Wall</Badge>}
            </span>
          ),
          client: m.client_name,
          practice: m.practice_area,
          partner: m.responsible_partner,
          opened: formatDate(m.opening_date),
          status: <StatusBadge value={m.status} />,
        }))}
      />
      <NewMatterDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}

function NewMatterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => listClients() });
  const [client_id, setClient] = useState("");
  const [name, setName] = useState("");
  const [practice_area, setPractice] = useState("Corporate");
  const [description, setDescription] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      createMatter({
        data: {
          client_id,
          name,
          practice_area,
          matter_type: practice_area,
          description,
        },
      }),
    onSuccess: (res) => {
      toast.success(`Matter ${res.matter_code} opened`);
      void queryClient.invalidateQueries({ queryKey: ["matters"] });
      onOpenChange(false);
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open a matter</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select required value={client_id} onChange={(e) => setClient(e.target.value)}>
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Matter name</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Practice area</Label>
            <Select value={practice_area} onChange={(e) => setPractice(e.target.value)}>
              {PRACTICE_AREAS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!client_id || !name.trim()}>
              Create matter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
