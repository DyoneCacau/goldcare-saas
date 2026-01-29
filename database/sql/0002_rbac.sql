create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.permissions (
  code text primary key,
  description text
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_code text not null references public.permissions(code) on delete cascade,
  primary key (role_id, permission_code)
);

create table if not exists public.user_roles (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  unit_id uuid references public.company_units(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id, role_id)
);

alter table public.roles enable row level security;
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
for select using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = roles.company_id
      and cu.user_id = auth.uid()
  )
);

alter table public.permissions enable row level security;
drop policy if exists permissions_select on public.permissions;
create policy permissions_select on public.permissions
for select using (true);

alter table public.role_permissions enable row level security;
drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
for select using (
  exists (
    select 1
    from public.roles r
    join public.company_users cu
      on cu.company_id = r.company_id and cu.user_id = auth.uid()
    where r.id = role_permissions.role_id
  )
);

alter table public.user_roles enable row level security;
drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.company_users cu
    where cu.company_id = user_roles.company_id
      and cu.user_id = auth.uid()
      and cu.is_owner = true
  )
);

-- Função helper RBAC
drop function if exists public.has_company_permission(uuid, uuid, text);
create or replace function public.has_company_permission(p_user_id uuid, p_company_id uuid, p_code text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    where ur.user_id    = p_user_id
      and ur.company_id = p_company_id
      and rp.permission_code = p_code
  );
$$;

-- Seed de permissões
insert into public.permissions (code, description) values
  ('patients.write','Criar/editar/apagar pacientes'),
  ('providers.write','Criar/editar/apagar profissionais'),
  ('appointments.write','Criar/editar/apagar atendimentos'),
  ('billing.write','Criar/editar/apagar registros financeiros')
on conflict (code) do nothing;

-- (Opcional) Índices auxiliares de RBAC
create index if not exists idx_user_roles_company_user on public.user_roles (company_id, user_id);
create index if not exists idx_role_permissions_role     on public.role_permissions (role_id);