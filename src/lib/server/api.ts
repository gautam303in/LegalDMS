import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { ensureSeeded } from "./workspace";
import type {
  ApprovalRecord,
  AuditRecord,
  ClauseRecord,
  ClientRecord,
  ContractRecord,
  DashboardData,
  DocumentRecord,
  HearingRecord,
  HoldRecord,
  MatterRecord,
  NotificationRecord,
  TaskRecord,
  TeamMember,
  TemplateRecord,
  CommentRecord,
} from "@/lib/types";

async function audit(
  userId: string,
  action: string,
  objectType: string,
  objectName: string,
  objectId?: string,
  result = "Allowed",
) {
  const sql = await getSql();
  await sql`
    insert into audit_events (id, user_id, action, object_type, object_id, object_name, result)
    values (${crypto.randomUUID()}, ${userId}, ${action}, ${objectType}, ${objectId ?? null}, ${objectName}, ${result})
  `;
}

export const bootstrapWorkspace = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    return { ok: true };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DashboardData> => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const uid = context.userId;
    const [profile] = await sql<{ firm_name: string; display_name: string; role: string }>`
      select firm_name, display_name, role from workspace_profiles where user_id = ${uid}
    `;
    const [counts] = await sql<{
      clients: number;
      matters: number;
      documents: number;
      contracts: number;
      pendingReviews: number;
      overdueTasks: number;
      expiringContracts: number;
      upcomingHearings: number;
      openHolds: number;
    }>`
      select
        (select count(*) from clients where user_id = ${uid}) as clients,
        (select count(*) from matters where user_id = ${uid} and status = 'Active') as matters,
        (select count(*) from documents where user_id = ${uid}) as documents,
        (select count(*) from contracts where user_id = ${uid}) as contracts,
        (select count(*) from approvals where user_id = ${uid} and status = 'Pending') as "pendingReviews",
        (select count(*) from tasks where user_id = ${uid} and status <> 'Done' and due_date < current_date) as "overdueTasks",
        (select count(*) from contracts where user_id = ${uid} and expiry_date is not null and expiry_date <= current_date + 90) as "expiringContracts",
        (select count(*) from hearings where user_id = ${uid} and hearing_date >= current_date) as "upcomingHearings",
        (select count(*) from legal_holds where user_id = ${uid} and status = 'Active') as "openHolds"
    `;
    const recentDocuments = await sql<DocumentRecord>`
      select d.*, c.name as client_name, m.name as matter_name
      from documents d
      left join clients c on c.id = d.client_id
      left join matters m on m.id = d.matter_id
      where d.user_id = ${uid}
      order by d.updated_at desc
      limit 6
    `;
    const upcomingHearings = await sql<HearingRecord>`
      select h.*, m.name as matter_name
      from hearings h left join matters m on m.id = h.matter_id
      where h.user_id = ${uid} and h.hearing_date >= current_date
      order by h.hearing_date asc
      limit 5
    `;
    const expiringContracts = await sql<ContractRecord>`
      select ct.*, c.name as client_name
      from contracts ct left join clients c on c.id = ct.client_id
      where ct.user_id = ${uid} and ct.expiry_date is not null
      order by ct.expiry_date asc
      limit 5
    `;
    const overdueTasks = await sql<TaskRecord>`
      select t.*, m.name as matter_name
      from tasks t left join matters m on m.id = t.matter_id
      where t.user_id = ${uid} and t.status <> 'Done'
      order by t.due_date asc nulls last
      limit 6
    `;
    const pendingApprovals = await sql<ApprovalRecord>`
      select a.*, m.name as matter_name
      from approvals a left join matters m on m.id = a.matter_id
      where a.user_id = ${uid} and a.status = 'Pending'
      order by a.due_date asc
    `;
    const notifications = await sql<NotificationRecord>`
      select * from notifications where user_id = ${uid} order by created_at desc limit 8
    `;
    const activity = await sql<AuditRecord>`
      select * from audit_events where user_id = ${uid} order by created_at desc limit 8
    `;
    const practiceBreakdown = await sql<{ practice_area: string; count: number }>`
      select practice_area, count(*) as count from matters where user_id = ${uid} group by practice_area order by count desc
    `;
    const contractStatus = await sql<{ status: string; count: number }>`
      select status, count(*) as count from contracts where user_id = ${uid} group by status
    `;
    return {
      profile: profile ?? { firm_name: "Ashoka & Meridian LLP", display_name: "Counsel", role: "Partner" },
      counts: counts ?? {
        clients: 0,
        matters: 0,
        documents: 0,
        contracts: 0,
        pendingReviews: 0,
        overdueTasks: 0,
        expiringContracts: 0,
        upcomingHearings: 0,
        openHolds: 0,
      },
      recentDocuments,
      upcomingHearings,
      expiringContracts,
      overdueTasks,
      pendingApprovals,
      notifications,
      activity,
      practiceBreakdown,
      contractStatus,
    };
  });

export const listClients = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<ClientRecord>`
      select cl.*, (select count(*) from matters m where m.client_id = cl.id) as matter_count
      from clients cl where cl.user_id = ${context.userId} order by cl.name
    `;
  });

export const getClient = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const [client] = await sql<ClientRecord>`
      select * from clients where id = ${data.id} and user_id = ${context.userId}
    `;
    if (!client) return null;
    const matters = await sql<MatterRecord>`
      select m.*, (select count(*) from documents d where d.matter_id = m.id) as document_count
      from matters m where m.client_id = ${data.id} and m.user_id = ${context.userId} order by m.opening_date desc
    `;
    const documents = await sql<DocumentRecord>`
      select * from documents where client_id = ${data.id} and user_id = ${context.userId} order by updated_at desc limit 12
    `;
    const contracts = await sql<ContractRecord>`
      select * from contracts where client_id = ${data.id} and user_id = ${context.userId}
    `;
    return { client, matters, documents, contracts };
  });

export const createClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      name: string;
      type: string;
      industry?: string;
      jurisdiction?: string;
      email?: string;
      phone?: string;
      city?: string;
      country?: string;
      responsible_partner?: string;
      notes?: string;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const [{ n }] = await sql<{ n: number }>`select count(*) as n from clients where user_id = ${context.userId}`;
    const code = `CL-${String(n + 1).padStart(3, "0")}`;
    const id = crypto.randomUUID();
    await sql`
      insert into clients (
        id, user_id, client_code, name, type, industry, jurisdiction, email, phone, city, country, responsible_partner, notes, status
      ) values (
        ${id}, ${context.userId}, ${code}, ${data.name}, ${data.type}, ${data.industry ?? null},
        ${data.jurisdiction ?? null}, ${data.email ?? null}, ${data.phone ?? null}, ${data.city ?? null},
        ${data.country ?? "India"}, ${data.responsible_partner ?? null}, ${data.notes ?? null}, ${"Active"}
      )
    `;
    await audit(context.userId, "Create", "Client", data.name, id);
    return { id, client_code: code };
  });

export const conflictCheck = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { query: string }) => input)
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const q = `%${data.query.trim()}%`;
    if (data.query.trim().length < 2) return [];
    const rows = await sql<{
      id: string;
      name: string;
      type: string;
      kind: string;
      extra: string | null;
    }>`
      select id, name, type, 'Client' as kind, notes as extra from clients
      where user_id = ${context.userId} and (name ilike ${q} or notes ilike ${q})
      union all
      select id, first_party as name, contract_type as type, 'Contract party' as kind, title as extra
      from contracts where user_id = ${context.userId} and (first_party ilike ${q} or second_party ilike ${q})
    `;
    return rows;
  });

export const listMatters = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<MatterRecord>`
      select m.*, c.name as client_name,
        (select count(*) from documents d where d.matter_id = m.id) as document_count
      from matters m join clients c on c.id = m.client_id
      where m.user_id = ${context.userId}
      order by m.opening_date desc
    `;
  });

export const getMatter = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const [matter] = await sql<MatterRecord>`
      select m.*, c.name as client_name from matters m
      join clients c on c.id = m.client_id
      where m.id = ${data.id} and m.user_id = ${context.userId}
    `;
    if (!matter) return null;
    const documents = await sql<DocumentRecord>`
      select * from documents where matter_id = ${data.id} and user_id = ${context.userId} order by updated_at desc
    `;
    const contracts = await sql<ContractRecord>`
      select * from contracts where matter_id = ${data.id} and user_id = ${context.userId}
    `;
    const tasks = await sql<TaskRecord>`
      select * from tasks where matter_id = ${data.id} and user_id = ${context.userId} order by due_date
    `;
    const hearings = await sql<HearingRecord>`
      select * from hearings where matter_id = ${data.id} and user_id = ${context.userId} order by hearing_date
    `;
    const holds = await sql<HoldRecord>`
      select * from legal_holds where matter_id = ${data.id} and user_id = ${context.userId}
    `;
    return { matter, documents, contracts, tasks, hearings, holds };
  });

export const createMatter = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      client_id: string;
      name: string;
      practice_area: string;
      matter_type: string;
      jurisdiction?: string;
      responsible_partner?: string;
      confidentiality?: string;
      description?: string;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const [{ n }] = await sql<{ n: number }>`select count(*) as n from matters where user_id = ${context.userId}`;
    const code = `MAT-${String(25000 + n + 1)}`;
    const id = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    await sql`
      insert into matters (
        id, user_id, client_id, matter_code, name, practice_area, matter_type,
        jurisdiction, responsible_partner, confidentiality, description, opening_date, status
      ) values (
        ${id}, ${context.userId}, ${data.client_id}, ${code}, ${data.name}, ${data.practice_area},
        ${data.matter_type}, ${data.jurisdiction ?? null}, ${data.responsible_partner ?? null},
        ${data.confidentiality ?? "Confidential"}, ${data.description ?? null}, ${today}, ${"Active"}
      )
    `;
    await audit(context.userId, "Create", "Matter", data.name, id);
    return { id, matter_code: code };
  });

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<DocumentRecord>`
      select d.*, c.name as client_name, m.name as matter_name
      from documents d
      left join clients c on c.id = d.client_id
      left join matters m on m.id = d.matter_id
      where d.user_id = ${context.userId}
      order by d.updated_at desc
    `;
  });

export const getDocument = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const [document] = await sql<DocumentRecord>`
      select d.*, c.name as client_name, m.name as matter_name
      from documents d
      left join clients c on c.id = d.client_id
      left join matters m on m.id = d.matter_id
      where d.id = ${data.id} and d.user_id = ${context.userId}
    `;
    if (!document) return null;
    const versions = await sql<{
      id: string;
      version: number;
      author: string | null;
      change_summary: string | null;
      status: string | null;
      created_at: string;
    }>`
      select id, version, author, change_summary, status, created_at
      from document_versions where document_id = ${data.id} and user_id = ${context.userId}
      order by version desc
    `;
    const comments = await sql<CommentRecord>`
      select * from document_comments where document_id = ${data.id} and user_id = ${context.userId}
      order by created_at desc
    `;
    await audit(context.userId, "View", "Document", document.title, document.id);
    return { document, versions, comments };
  });

export const createDocument = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      title: string;
      document_type: string;
      client_id?: string;
      matter_id?: string;
      classification?: string;
      content?: string;
      folder?: string;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into documents (
        id, user_id, client_id, matter_id, folder, title, document_type, file_format,
        version, status, classification, language, author, content, ocr_status
      ) values (
        ${id}, ${context.userId}, ${data.client_id ?? null}, ${data.matter_id ?? null},
        ${data.folder ?? "Uploads"}, ${data.title}, ${data.document_type}, ${"DOCX"},
        ${1}, ${"Draft"}, ${data.classification ?? "Confidential"}, ${"English"},
        ${"Workspace user"}, ${data.content ?? ""}, ${"Not required"}
      )
    `;
    await sql`
      insert into document_versions (id, user_id, document_id, version, author, change_summary, content, status)
      values (${crypto.randomUUID()}, ${context.userId}, ${id}, ${1}, ${"Workspace user"}, ${"Created"}, ${data.content ?? ""}, ${"Draft"})
    `;
    await audit(context.userId, "Upload", "Document", data.title, id);
    return { id };
  });

export const updateDocumentContent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; content: string; summary: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const [doc] = await sql<{ version: number; title: string }>`
      select version, title from documents where id = ${data.id} and user_id = ${context.userId}
    `;
    if (!doc) return { ok: false };
    const next = doc.version + 1;
    await sql`
      update documents set content = ${data.content}, version = ${next}, updated_at = now(), status = ${"Draft"}
      where id = ${data.id} and user_id = ${context.userId}
    `;
    await sql`
      insert into document_versions (id, user_id, document_id, version, author, change_summary, content, status)
      values (${crypto.randomUUID()}, ${context.userId}, ${data.id}, ${next}, ${"Workspace user"}, ${data.summary}, ${data.content}, ${"Draft"})
    `;
    await audit(context.userId, "Edit", "Document", doc.title, data.id);
    return { ok: true, version: next };
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { documentId: string; body: string; author?: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into document_comments (id, user_id, document_id, author, body)
      values (${crypto.randomUUID()}, ${context.userId}, ${data.documentId}, ${data.author ?? "Counsel"}, ${data.body})
    `;
    return { ok: true };
  });

export const submitForReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { documentId: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const [doc] = await sql<{ title: string; matter_id: string | null }>`
      select title, matter_id from documents where id = ${data.documentId} and user_id = ${context.userId}
    `;
    if (!doc) return { ok: false };
    await sql`
      update documents set status = ${"Under Review"}, updated_at = now()
      where id = ${data.documentId} and user_id = ${context.userId}
    `;
    await sql`
      insert into approvals (id, user_id, document_id, matter_id, title, submitted_by, current_stage, status, risk_level, due_date)
      values (
        ${crypto.randomUUID()}, ${context.userId}, ${data.documentId}, ${doc.matter_id},
        ${doc.title}, ${"Workspace user"}, ${"Partner review"}, ${"Pending"}, ${"Medium"},
        ${new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)}
      )
    `;
    await audit(context.userId, "Submit for review", "Document", doc.title, data.documentId);
    return { ok: true };
  });

export const listContracts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<ContractRecord>`
      select ct.*, c.name as client_name, m.name as matter_name
      from contracts ct
      left join clients c on c.id = ct.client_id
      left join matters m on m.id = ct.matter_id
      where ct.user_id = ${context.userId}
      order by ct.expiry_date asc nulls last
    `;
  });

export const getContract = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const [contract] = await sql<ContractRecord>`
      select ct.*, c.name as client_name, m.name as matter_name
      from contracts ct
      left join clients c on c.id = ct.client_id
      left join matters m on m.id = ct.matter_id
      where ct.id = ${data.id} and ct.user_id = ${context.userId}
    `;
    return contract ?? null;
  });

export const listClauses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<ClauseRecord>`
      select * from clauses where user_id = ${context.userId} order by category, clause_code
    `;
  });

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<TemplateRecord>`
      select * from templates where user_id = ${context.userId} order by name
    `;
  });

export const listTasks = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<TaskRecord>`
      select t.*, m.name as matter_name
      from tasks t left join matters m on m.id = t.matter_id
      where t.user_id = ${context.userId}
      order by t.due_date asc nulls last
    `;
  });

export const createTask = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      title: string;
      matter_id?: string;
      assigned_to?: string;
      due_date?: string;
      priority?: string;
      description?: string;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into tasks (id, user_id, matter_id, title, description, assigned_to, due_date, status, priority)
      values (${id}, ${context.userId}, ${data.matter_id || null}, ${data.title}, ${data.description || null},
        ${data.assigned_to || null}, ${data.due_date ? data.due_date : null}, ${"Open"}, ${data.priority ?? "Medium"})
    `;
    return { id };
  });

export const updateTaskStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; status: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update tasks set status = ${data.status} where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const listApprovals = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<ApprovalRecord>`
      select a.*, m.name as matter_name
      from approvals a left join matters m on m.id = a.matter_id
      where a.user_id = ${context.userId}
      order by a.due_date asc nulls last
    `;
  });

export const decideApproval = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; decision: "Approved" | "Rejected" | "Changes Requested" }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const [row] = await sql<{ title: string; document_id: string | null }>`
      select title, document_id from approvals where id = ${data.id} and user_id = ${context.userId}
    `;
    if (!row) return { ok: false };
    await sql`
      update approvals set status = ${data.decision} where id = ${data.id} and user_id = ${context.userId}
    `;
    if (row.document_id) {
      const docStatus =
        data.decision === "Approved"
          ? "Approved"
          : data.decision === "Rejected"
            ? "Draft"
            : "Under Review";
      await sql`
        update documents set status = ${docStatus}, updated_at = now()
        where id = ${row.document_id} and user_id = ${context.userId}
      `;
    }
    await audit(context.userId, "Approval", "Document", `${row.title} — ${data.decision}`, data.id);
    return { ok: true };
  });

export const listHearings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<HearingRecord>`
      select h.*, m.name as matter_name
      from hearings h left join matters m on m.id = h.matter_id
      where h.user_id = ${context.userId}
      order by h.hearing_date
    `;
  });

export const listHolds = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<HoldRecord>`
      select h.*, m.name as matter_name
      from legal_holds h left join matters m on m.id = h.matter_id
      where h.user_id = ${context.userId}
      order by h.created_at desc
    `;
  });

export const createHold = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { title: string; matter_id?: string; reason?: string; custodians?: string }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    await sql`
      insert into legal_holds (id, user_id, matter_id, title, reason, custodians, status, effective_date)
      values (${id}, ${context.userId}, ${data.matter_id ?? null}, ${data.title}, ${data.reason ?? null},
        ${data.custodians ?? null}, ${"Active"}, ${today})
    `;
    if (data.matter_id) {
      await sql`
        update documents set legal_hold = ${true}
        where matter_id = ${data.matter_id} and user_id = ${context.userId}
      `;
    }
    await audit(context.userId, "Legal hold applied", "Legal Hold", data.title, id);
    return { id };
  });

export const releaseHold = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update legal_holds set status = ${"Released"} where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const listAudit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<AuditRecord>`
      select * from audit_events where user_id = ${context.userId} order by created_at desc limit 200
    `;
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<NotificationRecord>`
      select * from notifications where user_id = ${context.userId} order by created_at desc limit 20
    `;
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update notifications set read = ${true} where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const listTeam = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    return sql<TeamMember>`
      select * from team_members where user_id = ${context.userId} order by role, name
    `;
  });

export const searchAll = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { q: string }) => input)
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId);
    const sql = await getSql();
    const q = `%${data.q.trim()}%`;
    if (data.q.trim().length < 2) {
      return { documents: [], matters: [], clients: [], contracts: [] };
    }
    const documents = await sql<DocumentRecord>`
      select d.*, c.name as client_name, m.name as matter_name
      from documents d
      left join clients c on c.id = d.client_id
      left join matters m on m.id = d.matter_id
      where d.user_id = ${context.userId}
        and (d.title ilike ${q} or d.content ilike ${q} or d.document_type ilike ${q})
      limit 25
    `;
    const matters = await sql<MatterRecord>`
      select m.*, c.name as client_name from matters m
      join clients c on c.id = m.client_id
      where m.user_id = ${context.userId} and (m.name ilike ${q} or m.matter_code ilike ${q} or m.description ilike ${q})
      limit 15
    `;
    const clients = await sql<ClientRecord>`
      select * from clients where user_id = ${context.userId} and (name ilike ${q} or client_code ilike ${q})
      limit 15
    `;
    const contracts = await sql<ContractRecord>`
      select * from contracts
      where user_id = ${context.userId}
        and (title ilike ${q} or first_party ilike ${q} or second_party ilike ${q})
      limit 15
    `;
    await audit(context.userId, "Search", "Workspace", data.q.slice(0, 80));
    return { documents, matters, clients, contracts };
  });
