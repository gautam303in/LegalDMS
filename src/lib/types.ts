export type ClientRecord = {
  id: string;
  client_code: string;
  name: string;
  type: string;
  industry: string | null;
  jurisdiction: string | null;
  registration_number: string | null;
  pan_masked: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  responsible_partner: string | null;
  status: string;
  risk_level: string | null;
  notes: string | null;
  created_at: string;
  matter_count?: number;
};

export type MatterRecord = {
  id: string;
  client_id: string;
  matter_code: string;
  name: string;
  practice_area: string;
  matter_type: string;
  jurisdiction: string | null;
  responsible_partner: string | null;
  status: string;
  confidentiality: string;
  opening_date: string | null;
  closing_date: string | null;
  description: string | null;
  ethical_wall: boolean;
  created_at: string;
  client_name?: string;
  document_count?: number;
};

export type DocumentRecord = {
  id: string;
  client_id: string | null;
  matter_id: string | null;
  folder: string | null;
  title: string;
  document_type: string;
  sub_type: string | null;
  file_format: string | null;
  version: number;
  status: string;
  classification: string;
  language: string | null;
  author: string | null;
  content: string | null;
  file_hash: string | null;
  ocr_status: string | null;
  privilege_flag: boolean;
  personal_data_flag: boolean;
  legal_hold: boolean;
  created_at: string;
  updated_at: string;
  client_name?: string | null;
  matter_name?: string | null;
};

export type ContractRecord = {
  id: string;
  document_id: string | null;
  client_id: string | null;
  matter_id: string | null;
  title: string;
  contract_type: string;
  first_party: string | null;
  second_party: string | null;
  agreement_date: string | null;
  effective_date: string | null;
  expiry_date: string | null;
  renewal_date: string | null;
  notice_period_days: number | null;
  contract_value: string | null;
  currency: string | null;
  status: string;
  risk_score: number | null;
  auto_renewal: boolean;
  governing_law: string | null;
  created_at: string;
  client_name?: string | null;
  matter_name?: string | null;
};

export type ClauseRecord = {
  id: string;
  clause_code: string;
  title: string;
  category: string;
  jurisdiction: string | null;
  practice_area: string | null;
  risk_category: string | null;
  preferred_position: string | null;
  fallback_position: string | null;
  guidance: string | null;
  body: string;
  status: string;
  created_at: string;
};

export type TemplateRecord = {
  id: string;
  name: string;
  document_type: string;
  jurisdiction: string | null;
  practice_area: string | null;
  status: string;
  placeholders: string | null;
  body: string;
  version: number;
  created_at: string;
};

export type TaskRecord = {
  id: string;
  matter_id: string | null;
  document_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: string;
  priority: string | null;
  created_at: string;
  matter_name?: string | null;
};

export type ApprovalRecord = {
  id: string;
  document_id: string | null;
  matter_id: string | null;
  title: string;
  submitted_by: string | null;
  current_stage: string | null;
  status: string;
  risk_level: string | null;
  due_date: string | null;
  created_at: string;
  matter_name?: string | null;
};

export type HearingRecord = {
  id: string;
  matter_id: string | null;
  title: string;
  court: string | null;
  hearing_date: string | null;
  hearing_time: string | null;
  location: string | null;
  notes: string | null;
  status: string | null;
  created_at: string;
  matter_name?: string | null;
};

export type HoldRecord = {
  id: string;
  matter_id: string | null;
  title: string;
  reason: string | null;
  custodians: string | null;
  status: string;
  effective_date: string | null;
  created_at: string;
  matter_name?: string | null;
};

export type AuditRecord = {
  id: string;
  action: string;
  object_type: string | null;
  object_id: string | null;
  object_name: string | null;
  result: string;
  ip_address: string | null;
  created_at: string;
};

export type NotificationRecord = {
  id: string;
  title: string;
  body: string | null;
  kind: string | null;
  read: boolean;
  href: string | null;
  created_at: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  practice_area: string | null;
  status: string | null;
};

export type CommentRecord = {
  id: string;
  document_id: string;
  author: string | null;
  body: string;
  created_at: string;
};

export type DraftRecord = {
  id: string;
  document_id: string | null;
  matter_id: string | null;
  client_id: string | null;
  document_type: string;
  inputs: string | null;
  content: string | null;
  status: string;
  created_at: string;
};

export type DashboardData = {
  profile: {
    firm_name: string;
    display_name: string;
    role: string;
  };
  counts: {
    clients: number;
    matters: number;
    documents: number;
    contracts: number;
    pendingReviews: number;
    overdueTasks: number;
    expiringContracts: number;
    upcomingHearings: number;
    openHolds: number;
  };
  recentDocuments: DocumentRecord[];
  upcomingHearings: HearingRecord[];
  expiringContracts: ContractRecord[];
  overdueTasks: TaskRecord[];
  pendingApprovals: ApprovalRecord[];
  notifications: NotificationRecord[];
  activity: AuditRecord[];
  practiceBreakdown: { practice_area: string; count: number }[];
  contractStatus: { status: string; count: number }[];
};

export const DOCUMENT_TYPES = [
  "NDA",
  "Mutual NDA",
  "Service Agreement",
  "Employment Agreement",
  "Vendor Agreement",
  "Consultancy Agreement",
  "Lease Agreement",
  "Legal Notice",
  "Reply Notice",
  "Demand Letter",
  "Affidavit",
  "Board Resolution",
  "Legal Opinion",
  "Compliance Declaration",
  "Pleading",
  "Court Order",
  "Correspondence",
] as const;

export const PRACTICE_AREAS = [
  "Corporate",
  "Contracts",
  "Litigation",
  "Arbitration",
  "Employment",
  "Real Estate",
  "Intellectual Property",
  "Taxation",
  "Compliance",
  "Recovery",
  "Due Diligence",
] as const;

export const CLIENT_TYPES = [
  "Individual",
  "Company",
  "LLP",
  "Trust",
  "Government",
  "Partnership",
  "Counterparty",
] as const;
