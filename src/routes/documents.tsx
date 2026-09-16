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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/query-client";
import { createDocument, listClients, listDocuments, listMatters } from "@/lib/server/api";
import { DOCUMENT_TYPES } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/documents")({ component: DocumentsRouteComponent });

function DocumentsRouteComponent() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <DocumentsPage />;
}

function DocumentsPage() {
  const { data = [] } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments() });
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [open, setOpen] = useState(false);
  const filtered = useMemo(
    () =>
      data.filter((d) => {
        const matchQ =
          !q ||
          d.title.toLowerCase().includes(q.toLowerCase()) ||
          (d.matter_name ?? "").toLowerCase().includes(q.toLowerCase());
        const matchT = type === "All" || d.document_type === type;
        return matchQ && matchT;
      }),
    [data, q, type],
  );

  return (
    <AppShell title="Documents" actions={<Button onClick={() => setOpen(true)}>+ Upload</Button>}>
      <FilterBar>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles" className="max-w-xs" />
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-48">
          <option>All</option>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          { key: "title", label: "Document" },
          { key: "type", label: "Type" },
          { key: "matter", label: "Matter" },
          { key: "ver", label: "Ver." },
          { key: "class", label: "Classification" },
          { key: "updated", label: "Updated" },
          { key: "status", label: "Status" },
        ]}
        rows={filtered.map((d) => ({
          id: d.id,
          href: `/documents/${d.id}`,
          title: d.title,
          type: d.document_type,
          matter: d.matter_name,
          ver: `v${d.version}`,
          class: d.classification,
          updated: formatDate(d.updated_at),
          status: <StatusBadge value={d.status} />,
        }))}
      />
      <UploadDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}

function UploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => listClients() });
  const { data: matters = [] } = useQuery({ queryKey: ["matters"], queryFn: () => listMatters() });
  const [title, setTitle] = useState("");
  const [document_type, setType] = useState("Correspondence");
  const [client_id, setClient] = useState("");
  const [matter_id, setMatter] = useState("");
  const [content, setContent] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      createDocument({
        data: { title, document_type, client_id: client_id || undefined, matter_id: matter_id || undefined, content },
      }),
    onSuccess: () => {
      toast.success("Document stored");
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      onOpenChange(false);
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a document</DialogTitle>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={document_type} onChange={(e) => setType(e.target.value)}>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={client_id} onChange={(e) => setClient(e.target.value)}>
                <option value="">—</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Matter</Label>
            <Select value={matter_id} onChange={(e) => setMatter(e.target.value)}>
              <option value="">—</option>
              {matters
                .filter((m) => !client_id || m.client_id === client_id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Text / extracted content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the document text. Binary files are stored as metadata in this workspace."
              className="min-h-32"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Store document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
