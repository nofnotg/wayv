create table if not exists public.beta_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  applicant_name text,
  application_note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'revoked')),
  applied_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  review_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists beta_access_requests_email_idx
  on public.beta_access_requests ((lower(email)));

create index if not exists beta_access_requests_status_applied_idx
  on public.beta_access_requests (status, applied_at desc);

create table if not exists public.beta_access_audit_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.beta_access_requests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_label text not null,
  previous_status text
    check (previous_status in ('pending', 'approved', 'rejected', 'revoked')),
  next_status text not null
    check (next_status in ('pending', 'approved', 'rejected', 'revoked')),
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists beta_access_audit_logs_request_created_idx
  on public.beta_access_audit_logs (request_id, created_at desc);

drop trigger if exists beta_access_requests_set_updated_at on public.beta_access_requests;
create trigger beta_access_requests_set_updated_at
before update on public.beta_access_requests
for each row execute function public.set_updated_at();
