alter table public.wave_reactions
  drop constraint if exists wave_reactions_reaction_type_check;

alter table public.wave_reactions
  add constraint wave_reactions_reaction_type_check
  check (
    reaction_type in (
      'touched_me',
      'me_too',
      'add_my_wave',
      'stay_quietly',
      'meaningful_comment',
      'save',
      'qualified_dwell'
    )
  );

create index if not exists wave_reactions_user_created_idx
  on public.wave_reactions(user_id, created_at desc);

create index if not exists wave_comments_user_created_idx
  on public.wave_comments(user_id, created_at desc);

drop policy if exists "wave_reactions_delete_own" on public.wave_reactions;
create policy "wave_reactions_delete_own"
on public.wave_reactions for delete
using (auth.uid() = user_id);
