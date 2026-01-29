create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.company_units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  phone text,
  timezone text default 'America/Sao_Paulo',
  created_at timestamptz not null default now()
);

create table if not exists public.company_users (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_owner boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

alter table public.companies enable row level security;
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
for select using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = companies.id
      and cu.user_id = auth.uid()
  )
);

alter table public.company_units enable row level security;
drop policy if exists units_select on public.company_units;
create policy units_select on public.company_units
for select using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = company_units.company_id
      and cu.user_id = auth.uid()
  )
);

alter table public.company_users enable row level security;
drop policy if exists company_users_select on public.company_users;
create policy company_users_select on public.company_users
for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.company_users cu2
    where cu2.company_id = company_users.company_id
      and cu2.user_id = auth.uid()
      and cu2.is_owner = true
  )
);