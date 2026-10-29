-- stores the popular markers for each report, gets deleted along with the report
create table report_popular_markers(
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references reports(upload_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rsid text not null,
  gene text not null,
  domain text not null check (domain in ('memory_retention', 'focus_cognition', 'stress_resiliency', 'processing_speed')),
  genotype text,
  common_claim text not null,
  evidence_note text not null,
  citations jsonb not null default '[]'::jsonb,
  unique (upload_id, rsid)
);

alter table report_popular_markers enable row level security;

create policy "read own popular markers"
  on report_popular_markers for select
  using (auth.uid() = user_id);
