-- =====================================================
-- MIGRATION: Permitir usuários criarem clínicas (com limite)
-- Data: 2026-01-28
-- Objetivo: Usuários podem criar clínicas até o limite do plano
-- =====================================================

-- Remover policy antiga que só permitia superadmin criar
DROP POLICY IF EXISTS "Superadmins can insert clinics" ON public.clinics;

-- Nova policy: Superadmin sempre pode criar
CREATE POLICY "Superadmins can insert clinics" ON public.clinics
  FOR INSERT WITH CHECK (is_superadmin(auth.uid()));

-- Nova policy: Usuários podem criar se estiverem dentro do limite
CREATE POLICY "Users can create clinics within plan limit" ON public.clinics
  FOR INSERT WITH CHECK (
    owner_user_id = auth.uid() AND
    public.can_user_create_clinic(auth.uid())
  );

-- Permitir usuários verem suas próprias clínicas (owner)
CREATE POLICY "Users can view their owned clinics" ON public.clinics
  FOR SELECT USING (
    owner_user_id = auth.uid() OR
    id IN (SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid())
  );

COMMENT ON POLICY "Users can create clinics within plan limit" ON public.clinics IS 
'Permite usuários criarem clínicas se estiverem dentro do limite do plano. Superadmin ignora limite.';
