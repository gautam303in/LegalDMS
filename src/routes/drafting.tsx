import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentPreview } from "@/components/legal/page-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateDraft, type DraftInput } from "@/lib/server/ai";
import { listClients, listClauses, listMatters, listTemplates, submitForReview } from "@/lib/server/api";
import { DOCUMENT_TYPES } from "@/lib/types";

export const Route = createFileRoute("/drafting")({ component: DraftingPage });

const empty: DraftInput = {
  documentType: "NDA",
  clientId: "",
  matterId: "",
  parties: "",
  purpose: "",
  commercialTerms: "",
  value: "",
  paymentTerms: "",
  duration: "",
  jurisdiction: "India",
  governingLaw: "India",
  confidentialityPeriod: "3 years",
  liabilityCap: "Fees paid in prior 12 months",
  terminationNotice: "90 days",
  disputeResolution: "Arbitration in Mumbai",
  position: "Balanced",
  specialInstructions: "",
};

function DraftingPage() {
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => listClients() });
  const { data: matters = [] } = useQuery({ queryKey: ["matters"], queryFn: () => listMatters() });
  const { data: templates = [] } = useQuery({ queryKey: ["templates"], queryFn: () => listTemplates() });
  const { data: clauses = [] } = useQuery({ queryKey: ["clauses"], queryFn: () => listClauses() });
  const [form, setForm] = useState<DraftInput>(empty);
  const [result, setResult] = useState<{ text: string; documentId: string; title: string } | null>(
    null,
  );

  const relatedTemplates = useMemo(
    () => templates.filter((t) => t.document_type === form.documentType),
    [templates, form.documentType],
  );
  const relatedClauses = useMemo(() => clauses.slice(0, 6), [clauses]);

  const gen = useMutation({
    mutationFn: () => generateDraft({ data: form }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResult({ text: res.text, documentId: res.documentId, title: res.title });
      toast.success("First draft stored as a working copy");
    },
    onError: () => toast.error("Drafting failed"),
  });

  const submit = useMutation({
    mutationFn: () => submitForReview({ data: { documentId: result!.documentId } }),
    onSuccess: () => toast.success("Sent for legal review"),
  });

  function set<K extends keyof DraftInput>(key: K, value: DraftInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <AppShell title="AI Drafting">
      <p className="mb-4 max-w-3xl text-sm text-ink-soft">
        Provide the minimum commercial facts. The engine retrieves approved templates and clauses,
        then produces a first draft. Output is never treated as final advice.
      </p>
      <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)_16rem]">
        <form
          className="space-y-3 rounded-xl border border-line bg-raised p-4"
          onSubmit={(e) => {
            e.preventDefault();
            gen.mutate();
          }}
        >
          <Field label="Document type">
            <Select value={form.documentType} onChange={(e) => set("documentType", e.target.value)}>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Client">
            <Select value={form.clientId} onChange={(e) => set("clientId", e.target.value)} required>
              <option value="">Select</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Matter">
            <Select value={form.matterId} onChange={(e) => set("matterId", e.target.value)} required>
              <option value="">Select</option>
              {matters
                .filter((m) => !form.clientId || m.client_id === form.clientId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </Select>
          </Field>
          {relatedTemplates[0] && (
            <p className="text-xs text-ink-faint">Template: {relatedTemplates[0].name}</p>
          )}
          <Field label="Parties">
            <Input value={form.parties} onChange={(e) => set("parties", e.target.value)} required />
          </Field>
          <Field label="Purpose">
            <Input value={form.purpose} onChange={(e) => set("purpose", e.target.value)} required />
          </Field>
          <Field label="Commercial terms">
            <Textarea
              value={form.commercialTerms}
              onChange={(e) => set("commercialTerms", e.target.value)}
              className="min-h-20"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Value">
              <Input value={form.value} onChange={(e) => set("value", e.target.value)} />
            </Field>
            <Field label="Duration">
              <Input value={form.duration} onChange={(e) => set("duration", e.target.value)} />
            </Field>
          </div>
          <Field label="Payment terms">
            <Input value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Jurisdiction">
              <Input value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} />
            </Field>
            <Field label="Governing law">
              <Input value={form.governingLaw} onChange={(e) => set("governingLaw", e.target.value)} />
            </Field>
          </div>
          <Field label="Preferred position">
            <Select
              value={form.position}
              onChange={(e) => set("position", e.target.value as DraftInput["position"])}
            >
              <option>Balanced</option>
              <option>Client favourable</option>
              <option>Counterparty favourable</option>
            </Select>
          </Field>
          <Field label="Special instructions">
            <Textarea
              value={form.specialInstructions}
              onChange={(e) => set("specialInstructions", e.target.value)}
              className="min-h-16"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={gen.isPending || !form.clientId || !form.matterId}>
            {gen.isPending ? "Drafting…" : "Generate first draft"}
          </Button>
        </form>

        <div className="min-w-0">
          {result ? (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <Button variant="secondary" asChild>
                  <Link to="/documents/$documentId" params={{ documentId: result.documentId }}>
                    Open in repository
                  </Link>
                </Button>
                <Button variant="secondary" onClick={() => submit.mutate()} disabled={submit.isPending}>
                  Submit for review
                </Button>
              </div>
              <DocumentPreview title={result.title} content={result.text} />
            </>
          ) : (
            <div className="flex min-h-[28rem] items-center justify-center rounded-xl border border-dashed border-line p-8 text-center">
              <p className="max-w-sm text-sm text-ink-soft">
                The generated instrument will appear here as a working draft, clearly marked for
                legal review.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-line bg-raised p-4">
            <h3 className="text-xs font-medium tracking-[0.14em] text-ink-soft uppercase">
              Clause recommendations
            </h3>
            <ul className="mt-3 space-y-3">
              {relatedClauses.map((c) => (
                <li key={c.id}>
                  <p className="text-sm font-medium text-ink">{c.title}</p>
                  <p className="text-xs text-ink-faint">
                    {c.category} · {c.risk_category}
                  </p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-line bg-raised p-4 text-sm text-ink-soft">
            <h3 className="text-xs font-medium tracking-[0.14em] uppercase">Validation</h3>
            <ul className="mt-3 list-disc space-y-1 pl-4">
              <li>Human review is mandatory before issue.</li>
              <li>AI output is stored as Draft, never Executed.</li>
              <li>Generation is logged in the audit trail.</li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
