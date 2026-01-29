-- Unicidade por empresa (parcial, ignora nulos/vazios)
do $$
begin
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='uq_patients_company_document') then
    create unique index uq_patients_company_document
      on public.patients (company_id, document)
      where document is not null and trim(document) <> '';
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='uq_providers_company_document') then
    create unique index uq_providers_company_document
      on public.providers (company_id, document)
      where document is not null and trim(document) <> '';
  end if;
end$$;

-- Índices de consulta
do $$
begin
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='idx_patients_company_created_at') then
    create index idx_patients_company_created_at
      on public.patients (company_id, created_at desc);
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='idx_providers_company_active') then
    create index idx_providers_company_active
      on public.providers (company_id, is_active);
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='idx_appt_company_starts') then
    create index idx_appt_company_starts
      on public.appointments (company_id, starts_at);
  end if;
end$$;

-- Bloqueio de overlap por provider (opcional)
create extension if not exists btree_gist;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='no_overlap_per_provider'
      and conrelid='public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint no_overlap_per_provider
      exclude using gist (
        provider_id with =,
        company_id  with =,
        tstzrange(starts_at, ends_at, '[)') with &&
      )
      where (status in ('scheduled','confirmed','in_progress'));
  end if;
end$$;