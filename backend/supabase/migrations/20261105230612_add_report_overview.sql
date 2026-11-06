alter table reports
  add column if not exists overview text,
  add column if not exists overview_by_ai boolean not null default false;