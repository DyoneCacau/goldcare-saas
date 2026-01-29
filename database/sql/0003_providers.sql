create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.company_units(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  document text,
  specialty text,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.providers enable row level security;
drop policy if exists providers_select on public.providers;
create policy providers_select on public.providers
for select using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = providers.company_id
      and cu.user_id = auth.uid()
  )
);