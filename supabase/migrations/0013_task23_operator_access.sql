create table if not exists public.internal_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null
    check (role in ('operator', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists internal_operators_active_idx
  on public.internal_operators(is_active);

drop trigger if exists internal_operators_set_updated_at on public.internal_operators;
create trigger internal_operators_set_updated_at
before update on public.internal_operators
for each row execute function public.set_updated_at();
