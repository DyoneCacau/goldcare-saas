-- Escreve se for owner OU se tiver permissão *.write

-- PATIENTS
drop policy if exists patients_insert_owner_or_perm on public.patients;
create policy patients_insert_owner_or_perm
on public.patients
for insert
with check (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = patients.company_id
      and cu.user_id = auth.uid()
      and cu.is_owner = true
  )
  or public.has_company_permission(auth.uid(), patients.company_id, 'patients.write')
);

drop policy if exists patients_update_owner_or_perm on public.patients;
create policy patients_update_owner_or_perm
on public.patients
for update
using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = patients.company_id
      and cu.user_id = auth.uid()
      and cu.is_owner = true
  )
  or public.has_company_permission(auth.uid(), patients.company_id, 'patients.write')
);

drop policy if exists patients_delete_owner_or_perm on public.patients;
create policy patients_delete_owner_or_perm
on public.patients
for delete
using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = patients.company_id
      and cu.user_id = auth.uid()
      and cu.is_owner = true
  )
  or public.has_company_permission(auth.uid(), patients.company_id, 'patients.write')
);

-- PROVIDERS
drop policy if exists providers_insert_owner_or_perm on public.providers;
create policy providers_insert_owner_or_perm
on public.providers
for insert
with check (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = providers.company_id
      and cu.user_id = auth.uid()
      and cu.is_owner = true
  )
  or public.has_company_permission(auth.uid(), providers.company_id, 'providers.write')
);

drop policy if exists providers_update_owner_or_perm on public.providers;
create policy providers_update_owner_or_perm
on public.providers
for update
using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = providers.company_id
      and cu.user_id = auth.uid()
      and cu.is_owner = true
  )
  or public.has_company_permission(auth.uid(), providers.company_id, 'providers.write')
);

drop policy if exists providers_delete_owner_or_perm on public.providers;
create policy providers_delete_owner_or_perm
on public.providers
for delete
using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = providers.company_id
      and cu.user_id = auth.uid()
      and cu.is_owner = true
  )
  or public.has_company_permission(auth.uid(), providers.company_id, 'providers.write')
);

-- APPOINTMENTS
drop policy if exists appointments_insert_owner_or_perm on public.appointments;
create policy appointments_insert_owner_or_perm
on public.appointments
for insert
with check (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = appointments.company_id
      and cu.user_id = auth.uid()
      and cu.is_owner = true
  )
  or public.has_company_permission(auth.uid(), appointments.company_id, 'appointments.write')
);

drop policy if exists appointments_update_owner_or_perm on public.appointments;
create policy appointments_update_owner_or_perm
on public.appointments
for update
using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = appointments.company_id
      and cu.user_id = auth.uid()
      and cu.is_owner = true
  )
  or public.has_company_permission(auth.uid(), appointments.company_id, 'appointments.write')
);

drop policy if exists appointments_delete_owner_or_perm on public.appointments;
create policy appointments_delete_owner_or_perm
on public.appointments
for delete
using (
  exists (
    select 1 from public.company_users cu
    where cu.company_id = appointments.company_id
      and cu.user_id = auth.uid()
      and cu.is_owner = true
  )
  or public.has_company_permission(auth.uid(), appointments.company_id, 'appointments.write')
);
``