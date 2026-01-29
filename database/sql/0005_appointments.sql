do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum ('scheduled','confirmed','in_progress','completed','canceled');
  end if;
end$$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.company_units(id) on delete set null,
  provider_id uuid not null references public.providers(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint chk_time check (ends_at > starts_at)
);

alter table public.appointments enable row level security;
drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
for select using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = appointments.company_id
      and cu.user_id = auth.uid()
  )
);