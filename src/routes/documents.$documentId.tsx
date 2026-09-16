import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentPreview, StatusBadge } from "@/components/legal/page-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/query-client";
import {
  addComment,
  getDocument,
  submitForReview,
  updateDocumentContent,
} from "@/lib/server/api";
import { summarizeDocument } from "@/lib/server/ai";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/documents/$documentId")({ component: DocumentDetail });

function DocumentDetail() {
  const { documentId } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument({ data: { id: documentId } }),
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [comment, setComment] = useState("");
  const [summary, setSummary] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      updateDocumentContent({ data: { id: documentId, content: draft, summary: "Counsel edit" } }),
    onSuccess: () => {
      toast.success("New version stored");
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    },
  });
  const review = useMutation({
    mutationFn: () => submitForReview({ data: { documentId } }),
    onSuccess: () => {
      toast.success("Submitted for partner review");
      void queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    },
  });
  const commentMut = useMutation({
    mutationFn: () => addComment({ data: { documentId, body: comment } }),
    onSuccess: () => {
      setComment("");
      void queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    },
  });
  const sumMut = useMutation({
    mutationFn: () => summarizeDocument({ data: { documentId } }),
    onSuccess: (res) => {
      if (res.ok) setSummary(res.text);
      else toast.error(res.error);
    },
  });

  if (!data) {
    return (
      <AppShell title="Document">
        <p className="text-sm text-ink-soft">Loading document…</p>
      </AppShell>
    );
  }
  const d = data.document;
  return (
    <AppShell
      title={d.title}
      actions={
        <>
          <Button variant="secondary" onClick={() => sumMut.mutate()} disabled={sumMut.isPending}>
            {sumMut.isPending ? "Summarising…" : "Summarise"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(d.content ?? "");
              setEditing((v) => !v);
            }}
          >
            {editing ? "Cancel edit" : "New version"}
          </Button>
          <Button onClick={() => review.mutate()} disabled={review.isPending}>
            Submit for review
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge value={d.status} />
        <StatusBadge value={d.classification} />
        {d.privilege_flag && <Badge tone="info">Privileged</Badge>}
        {d.legal_hold && <Badge tone="danger">Legal hold</Badge>}
        <span className="text-ink-soft">
          {d.document_type} · v{d.version} · {d.author}
        </span>
        {d.matter_id && (
          <Link
            to="/matters/$matterId"
            params={{ matterId: d.matter_id }}
            className="text-accent hover:underline"
          >
            {d.matter_name}
          </Link>
        )}
      </div>

      {summary && (
        <div className="mb-4 rounded-xl border border-line bg-accent-soft p-4 text-sm whitespace-pre-wrap text-ink-2">
          {summary}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div>
          {editing ? (
            <div className="space-y-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[32rem] font-display text-[15px] leading-relaxed"
              />
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                Save as new version
              </Button>
            </div>
          ) : (
            <DocumentPreview
              title={d.title}
              content={d.content}
              meta={`${d.client_name ?? ""} · ${formatDate(d.updated_at)}`}
            />
          )}
        </div>
        <aside className="space-y-4">
          <section className="rounded-xl border border-line bg-raised p-4">
            <h3 className="text-xs font-medium tracking-[0.14em] text-ink-soft uppercase">Metadata</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="Folder" v={d.folder} />
              <Row k="Format" v={d.file_format} />
              <Row k="OCR" v={d.ocr_status} />
              <Row k="Hash" v={d.file_hash} />
              <Row k="Language" v={d.language} />
            </dl>
          </section>
          <section className="rounded-xl border border-line bg-raised p-4">
            <h3 className="text-xs font-medium tracking-[0.14em] text-ink-soft uppercase">Versions</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {data.versions.map((v) => (
                <li key={v.id}>
                  <p className="font-medium">v{v.version}</p>
                  <p className="text-xs text-ink-soft">
                    {v.author} · {v.change_summary}
                  </p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-line bg-raised p-4">
            <h3 className="text-xs font-medium tracking-[0.14em] text-ink-soft uppercase">Comments</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {data.comments.map((c) => (
                <li key={c.id}>
                  <p className="text-xs text-ink-faint">
                    {c.author} · {formatDate(c.created_at)}
                  </p>
                  <p className="text-ink-2">{c.body}</p>
                </li>
              ))}
            </ul>
            <Textarea
              className="mt-3 min-h-20"
              placeholder="Add a review comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button
              size="sm"
              className="mt-2"
              disabled={!comment.trim()}
              onClick={() => commentMut.mutate()}
            >
              Comment
            </Button>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-faint">{k}</dt>
      <dd className="truncate text-right text-ink-2">{v || "—"}</dd>
    </div>
  );
}
