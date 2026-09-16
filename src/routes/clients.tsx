import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable, FilterBar, StatusBadge } from "@/components/legal/page-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/query-client";
import { conflictCheck, createClient, listClients } from "@/lib/server/api";
import { CLIENT_TYPES } from "@/lib/types";

export const Route = createFileRoute("/clients")({ component: ClientsRouteComponent });

function ClientsRouteComponent() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <ClientsPage />;
}

function ClientsPage() {
  const { data = [] } = useQuery({ queryKey: ["clients"], queryFn: () => listClients() });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = useMemo(
    () =>
      data.filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.client_code.toLowerCase().includes(q.toLowerCase()),
      ),
    [data, q],
  );

  return (
    <AppShell
      title="Clients"
      actions={
        <Button onClick={() => setOpen(true)}>+ New client</Button>
      }
    >
      <FilterBar>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name or ID"
          className="max-w-xs"
        />
      </FilterBar>
      <DataTable
        columns={[
          { key: "code", label: "Client ID" },
          { key: "name", label: "Client" },
          { key: "type", label: "Type" },
          { key: "matters", label: "Matters" },
          { key: "partner", label: "Partner" },
          { key: "status", label: "Status" },
        ]}
        rows={filtered.map((c) => ({
          id: c.id,
          href: `/clients/${c.id}`,
          code: c.client_code,
          name: c.name,
          type: c.type,
          matters: c.matter_count ?? 0,
          partner: c.responsible_partner,
          status: <StatusBadge value={c.status} />,
        }))}
        empty="No clients match that filter."
      />
      <NewClientDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}

function NewClientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Company");
  const [industry, setIndustry] = useState("");
  const [jurisdiction, setJurisdiction] = useState("India");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [hits, setHits] = useState<Awaited<ReturnType<typeof conflictCheck>>>([]);

  const mutation = useMutation({
    mutationFn: () =>
      createClient({
        data: { name, type, industry, jurisdiction, email, notes },
      }),
    onSuccess: (res) => {
      toast.success(`Client ${res.client_code} opened`);
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
      onOpenChange(false);
      setName("");
    },
    onError: () => toast.error("Could not create the client"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
          <DialogDescription>
            A conflict search runs against the existing book as you type the name.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="cname">Legal name</Label>
            <Input
              id="cname"
              required
              value={name}
              onChange={async (e) => {
                setName(e.target.value);
                if (e.target.value.trim().length > 2) {
                  setHits(await conflictCheck({ data: { query: e.target.value } }));
                } else setHits([]);
              }}
            />
          </div>
          {hits.length > 0 && (
            <div className="rounded-md border border-warn bg-warn-bg p-3 text-sm text-warn">
              Possible matches — review before opening a file.
              <ul className="mt-1 list-disc pl-4">
                {hits.slice(0, 5).map((h) => (
                  <li key={h.id}>
                    {h.name} ({h.kind}
                    {h.type ? ` · ${h.type}` : ""})
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {CLIENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jurisdiction</Label>
              <Input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Industry</Label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !name.trim()}>
              Create client
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
