create table if not exists public.private_resonance_traces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.wave_posts(id) on delete cascade,
  resonance_choice text not null
    check (
      resonance_choice in (
        'passed_by',
        'touched_lightly',
        'lingered',
        'felt_like_mine',
        'not_sure_yet'
      )
    ),
  private_note text null check (private_note is null or char_length(private_note) <= 180),
  source_path text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists private_resonance_traces_user_post_idx
  on public.private_resonance_traces(user_id, post_id);

create index if not exists private_resonance_traces_user_created_idx
  on public.private_resonance_traces(user_id, created_at desc);

drop trigger if exists private_resonance_traces_set_updated_at on public.private_resonance_traces;
create trigger private_resonance_traces_set_updated_at
before update on public.private_resonance_traces
for each row execute function public.set_updated_at();

alter table public.private_resonance_traces enable row level security;

drop policy if exists "private_resonance_traces_select_own" on public.private_resonance_traces;
create policy "private_resonance_traces_select_own"
on public.private_resonance_traces for select
using (auth.uid() = user_id);

drop policy if exists "private_resonance_traces_insert_own" on public.private_resonance_traces;
create policy "private_resonance_traces_insert_own"
on public.private_resonance_traces for insert
with check (auth.uid() = user_id);

drop policy if exists "private_resonance_traces_update_own" on public.private_resonance_traces;
create policy "private_resonance_traces_update_own"
on public.private_resonance_traces for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "private_resonance_traces_delete_own" on public.private_resonance_traces;
create policy "private_resonance_traces_delete_own"
on public.private_resonance_traces for delete
using (auth.uid() = user_id);
