insert into public.internal_operators (user_id, role, is_active)
select id, 'admin', true
from auth.users
where lower(email) = 'nofnotg@gmail.com'
on conflict (user_id) do update
set
  role = 'admin',
  is_active = true,
  updated_at = timezone('utc', now());

create or replace function public.ensure_fixed_operator_admin()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if lower(new.email) = 'nofnotg@gmail.com' then
    insert into public.internal_operators (user_id, role, is_active)
    values (new.id, 'admin', true)
    on conflict (user_id) do update
    set
      role = 'admin',
      is_active = true,
      updated_at = timezone('utc', now());
  end if;

  return new;
end;
$$;

drop trigger if exists fixed_operator_admin_bootstrap on auth.users;
create trigger fixed_operator_admin_bootstrap
after insert or update of email on auth.users
for each row execute function public.ensure_fixed_operator_admin();
