-- LegalFlow AI core schema. All tenant-owned rows carry user_id (workspace owner).

create table if not exists workspace_profiles (
  user_id text primary key,
  firm_name text not null default 'Ashoka & Meridian LLP',
  display_name text,
  role text not null default 'Partner',
  seeded boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  id text primary key,
  user_id text not null,
  name text not null,
  email text,
  role text not null,
  practice_area text,
  status text default 'Active'
);
create index if not exists team_members_user_idx on team_members (user_id);

create table if not exists clients (
  id text primary key,
  user_id text not null,
  client_code text not null,
  name text not null,
  type text not null,
  industry text,
  jurisdiction text,
  registration_number text,
  pan_masked text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  responsible_partner text,
  status text not null default 'Active',
  risk_level text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists clients_user_idx on clients (user_id);

create table if not exists matters (
  id text primary key,
  user_id text not null,
  client_id text not null,
  matter_code text not null,
  name text not null,
  practice_area text not null,
  matter_type text not null,
  jurisdiction text,
  responsible_partner text,
  status text not null default 'Active',
  confidentiality text not null default 'Confidential',
  opening_date date,
  closing_date date,
  description text,
  ethical_wall boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists matters_user_idx on matters (user_id);
create index if not exists matters_client_idx on matters (client_id);

create table if not exists documents (
  id text primary key,
  user_id text not null,
  client_id text,
  matter_id text,
  folder text,
  title text not null,
  document_type text not null,
  sub_type text,
  file_format text,
  version integer not null default 1,
  status text not null default 'Draft',
  classification text not null default 'Confidential',
  language text default 'English',
  author text,
  content text,
  file_hash text,
  ocr_status text,
  privilege_flag boolean not null default false,
  personal_data_flag boolean not null default false,
  legal_hold boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists documents_user_idx on documents (user_id);
create index if not exists documents_matter_idx on documents (matter_id);

create table if not exists document_versions (
  id text primary key,
  user_id text not null,
  document_id text not null,
  version integer not null,
  author text,
  change_summary text,
  content text,
  status text,
  created_at timestamptz not null default now()
);
create index if not exists document_versions_doc_idx on document_versions (document_id);

create table if not exists document_comments (
  id text primary key,
  user_id text not null,
  document_id text not null,
  author text,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists contracts (
  id text primary key,
  user_id text not null,
  document_id text,
  client_id text,
  matter_id text,
  title text not null,
  contract_type text not null,
  first_party text,
  second_party text,
  agreement_date date,
  effective_date date,
  expiry_date date,
  renewal_date date,
  notice_period_days integer,
  contract_value numeric,
  currency text default 'INR',
  status text not null,
  risk_score integer,
  auto_renewal boolean not null default false,
  governing_law text,
  created_at timestamptz not null default now()
);
create index if not exists contracts_user_idx on contracts (user_id);

create table if not exists clauses (
  id text primary key,
  user_id text not null,
  clause_code text not null,
  title text not null,
  category text not null,
  jurisdiction text,
  practice_area text,
  risk_category text,
  preferred_position text,
  fallback_position text,
  guidance text,
  body text not null,
  status text not null default 'Approved',
  created_at timestamptz not null default now()
);
create index if not exists clauses_user_idx on clauses (user_id);

create table if not exists templates (
  id text primary key,
  user_id text not null,
  name text not null,
  document_type text not null,
  jurisdiction text,
  practice_area text,
  status text not null default 'Active',
  placeholders text,
  body text not null,
  version integer not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists templates_user_idx on templates (user_id);

create table if not exists tasks (
  id text primary key,
  user_id text not null,
  matter_id text,
  document_id text,
  title text not null,
  description text,
  assigned_to text,
  due_date date,
  status text not null default 'Open',
  priority text default 'Medium',
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_idx on tasks (user_id);

create table if not exists approvals (
  id text primary key,
  user_id text not null,
  document_id text,
  matter_id text,
  title text not null,
  submitted_by text,
  current_stage text,
  status text not null,
  risk_level text,
  due_date date,
  created_at timestamptz not null default now()
);
create index if not exists approvals_user_idx on approvals (user_id);

create table if not exists hearings (
  id text primary key,
  user_id text not null,
  matter_id text,
  title text not null,
  court text,
  hearing_date date,
  hearing_time text,
  location text,
  notes text,
  status text default 'Scheduled',
  created_at timestamptz not null default now()
);
create index if not exists hearings_user_idx on hearings (user_id);

create table if not exists legal_holds (
  id text primary key,
  user_id text not null,
  matter_id text,
  title text not null,
  reason text,
  custodians text,
  status text not null default 'Active',
  effective_date date,
  created_at timestamptz not null default now()
);
create index if not exists legal_holds_user_idx on legal_holds (user_id);

create table if not exists audit_events (
  id text primary key,
  user_id text not null,
  action text not null,
  object_type text,
  object_id text,
  object_name text,
  result text not null default 'Allowed',
  ip_address text,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_user_idx on audit_events (user_id);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  title text not null,
  body text,
  kind text,
  read boolean not null default false,
  href text,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id);

create table if not exists drafts (
  id text primary key,
  user_id text not null,
  document_id text,
  matter_id text,
  client_id text,
  document_type text not null,
  inputs text,
  content text,
  status text not null default 'Draft',
  created_at timestamptz not null default now()
);
create index if not exists drafts_user_idx on drafts (user_id);
