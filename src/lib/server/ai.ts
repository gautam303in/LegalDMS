import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { ensureSeeded } from "./workspace";

async function chat(system: string, user: string, maxTokens: number): Promise<
  { ok: true; text: string } | { ok: false; error: string }
> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available in this environment" };
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  if (!res.ok) return { ok: false, error: `xAI API error ${res.status}` };
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return { ok: true, text: body.choices?.[0]?.message?.content ?? "" };
}

export type DraftInput = {
  documentType: string;
  clientId: string;
  matterId: string;
  templateId?: string;
  parties: string;
  purpose: string;
  commercialTerms: string;
  value: string;
  paymentTerms: string;
  duration: string;
  jurisdiction: string;
  governingLaw: string;
  confidentialityPeriod: string;
  liabilityCap: string;
  terminationNotice: string;
  disputeResolution: string;
  position: "Balanced" | "Client favourable" | "Counterparty favourable";
  specialInstructions: string;
};

export const generateDraft = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: DraftInput) => input)
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const [client] = await sql<{ name: string }>`
      select name from clients where id = ${data.clientId} and user_id = ${context.userId}
    `;
    const [matter] = await sql<{ name: string; practice_area: string }>`
      select name, practice_area from matters where id = ${data.matterId} and user_id = ${context.userId}
    `;
    const templates = data.templateId
      ? await sql<{ name: string; body: string }>`
          select name, body from templates where id = ${data.templateId} and user_id = ${context.userId}
        `
      : await sql<{ name: string; body: string }>`
          select name, body from templates
          where user_id = ${context.userId} and document_type = ${data.documentType}
          limit 1
        `;
    const clauses = await sql<{ title: string; body: string; category: string }>`
      select title, body, category from clauses
      where user_id = ${context.userId}
      order by category
      limit 8
    `;
    const clauseBlock = clauses
      .map((c) => `### ${c.category}: ${c.title}\n${c.body}`)
      .join("\n\n");
    const system = `You are a senior legal associate at Ashoka & Meridian LLP. You draft first-pass legal documents for lawyer review. You never present output as final legal advice or as an executed instrument. Use precise, contemporary legal English. Number clauses. Do not wrap the document in markdown fences. Mark the heading as DRAFT — FOR LEGAL REVIEW. Prefer the firm's approved clause language when it fits. Do not invent case citations.`;
    const user = `Draft a ${data.documentType} for client ${client?.name ?? "the client"} on matter ${matter?.name ?? "the matter"}.

Position: ${data.position}
Jurisdiction / governing law: ${data.jurisdiction || "India"} / ${data.governingLaw || "India"}
Parties: ${data.parties}
Purpose: ${data.purpose}
Commercial terms: ${data.commercialTerms}
Value: ${data.value}
Payment terms: ${data.paymentTerms}
Duration: ${data.duration}
Confidentiality period: ${data.confidentialityPeriod}
Liability cap: ${data.liabilityCap}
Termination notice: ${data.terminationNotice}
Dispute resolution: ${data.disputeResolution}
Special instructions: ${data.specialInstructions}

Approved template guidance:
${templates[0]?.body ?? "Use a conventional structure for this document type."}

Approved clauses to draw from:
${clauseBlock}

Output the full document only.`;

    const result = await chat(system, user, 3200);
    if (!result.ok) return result;

    const draftId = crypto.randomUUID();
    const docId = crypto.randomUUID();
    const title = `${data.documentType} — ${client?.name ?? "Draft"}`;
    await sql`
      insert into documents (
        id, user_id, client_id, matter_id, folder, title, document_type, file_format,
        version, status, classification, language, author, content, ocr_status
      ) values (
        ${docId}, ${context.userId}, ${data.clientId}, ${data.matterId}, ${"AI Drafts"},
        ${title}, ${data.documentType}, ${"DOCX"}, ${1}, ${"Draft"}, ${"Confidential"},
        ${"English"}, ${"LegalFlow AI"}, ${result.text}, ${"Not required"}
      )
    `;
    await sql`
      insert into document_versions (id, user_id, document_id, version, author, change_summary, content, status)
      values (${crypto.randomUUID()}, ${context.userId}, ${docId}, ${1}, ${"LegalFlow AI"}, ${"AI first draft"}, ${result.text}, ${"Draft"})
    `;
    await sql`
      insert into drafts (id, user_id, document_id, matter_id, client_id, document_type, inputs, content, status)
      values (${draftId}, ${context.userId}, ${docId}, ${data.matterId}, ${data.clientId}, ${data.documentType}, ${JSON.stringify(data)}, ${result.text}, ${"Draft"})
    `;
    await sql`
      insert into audit_events (id, user_id, action, object_type, object_id, object_name, result)
      values (${crypto.randomUUID()}, ${context.userId}, ${"AI draft generation"}, ${"Document"}, ${docId}, ${title}, ${"Allowed"})
    `;
    return { ok: true as const, text: result.text, documentId: docId, draftId, title };
  });

export const reviewContract = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { contractId: string }) => input)
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const [contract] = await sql<{
      title: string;
      contract_type: string;
      first_party: string | null;
      second_party: string | null;
      governing_law: string | null;
      document_id: string | null;
    }>`
      select title, contract_type, first_party, second_party, governing_law, document_id
      from contracts where id = ${data.contractId} and user_id = ${context.userId}
    `;
    if (!contract) return { ok: false as const, error: "Contract not found" };
    let body = "";
    if (contract.document_id) {
      const [doc] = await sql<{ content: string | null }>`
        select content from documents where id = ${contract.document_id} and user_id = ${context.userId}
      `;
      body = doc?.content ?? "";
    }
    const clauses = await sql<{ title: string; category: string; body: string }>`
      select title, category, body from clauses where user_id = ${context.userId}
    `;
    const result = await chat(
      `You are a contracts counsel at Ashoka & Meridian LLP performing a first-pass risk review. Return ONLY valid JSON of the form {"findings":[{"severity":"High"|"Medium"|"Low"|"Informational","clause":"string","location":"string","explanation":"string","recommendation":"string"}]}. No markdown. Be specific. Flag missing clauses against the playbook, unusual liability, auto-renewal, data protection, termination, and inconsistent parties/dates.`,
      `Contract: ${contract.title} (${contract.contract_type})
Parties: ${contract.first_party} / ${contract.second_party}
Governing law: ${contract.governing_law}
Text:
${body.slice(0, 8000)}

Playbook clauses:
${clauses.map((c) => `${c.category}: ${c.title}`).join("\n")}`,
      1400,
    );
    if (!result.ok) return result;
    try {
      const parsed = JSON.parse(result.text.replace(/```json|```/g, "").trim()) as {
        findings: Array<{
          severity: string;
          clause: string;
          location: string;
          explanation: string;
          recommendation: string;
        }>;
      };
      return { ok: true as const, findings: parsed.findings ?? [] };
    } catch {
      return {
        ok: true as const,
        findings: [
          {
            severity: "Informational",
            clause: "Review output",
            location: "Document",
            explanation: result.text.slice(0, 1200),
            recommendation: "Counsel should review the narrative output.",
          },
        ],
      };
    }
  });

export const summarizeDocument = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { documentId: string }) => input)
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const [doc] = await sql<{ title: string; content: string | null }>`
      select title, content from documents where id = ${data.documentId} and user_id = ${context.userId}
    `;
    if (!doc) return { ok: false as const, error: "Document not found" };
    const result = await chat(
      "You summarise legal documents for busy partners. Write 5–8 tight bullet points covering parties, operative obligations, dates, liability, governing law, and open issues. No preamble.",
      `${doc.title}\n\n${(doc.content ?? "").slice(0, 9000)}`,
      700,
    );
    return result;
  });
