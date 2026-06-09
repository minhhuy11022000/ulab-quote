create table if not exists quotes (
  id text primary key,
  client_name text not null default '',
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists shared_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_data jsonb not null default '{}'
);
