CREATE TABLE archived_quotes (
  id text PRIMARY KEY,
  client_name text,
  data jsonb NOT NULL,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz DEFAULT now()
);

CREATE INDEX archived_quotes_archived_at_idx ON archived_quotes(archived_at DESC);
