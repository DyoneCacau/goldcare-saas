create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  birth_date date,
  document text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.patients enable row level security;
drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients
for select using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = patients.company_id
      and cu.user_id = auth.uid()
  )
);