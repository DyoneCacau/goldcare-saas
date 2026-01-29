-- =====================================================
-- MIGRATION: Adicionar max_clinics aos planos
-- Data: 2026-01-28
-- Objetivo: Permitir limite de clínicas por plano
-- =====================================================

-- Adicionar coluna max_clinics na tabela plans
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS max_clinics INTEGER DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.plans.max_clinics IS 'Limite de clínicas permitidas por plano. NULL = ilimitado. Superadmin ignora este limite.';

-- Atualizar planos existentes com valores padrão
UPDATE public.plans SET max_clinics = NULL WHERE slug = 'trial';
UPDATE public.plans SET max_clinics = 1 WHERE slug = 'basico';
UPDATE public.plans SET max_clinics = 2 WHERE slug = 'profissional';
UPDATE public.plans SET max_clinics = NULL WHERE slug = 'premium'; -- Premium = ilimitado

-- =====================================================
-- FUNÇÃO: Contar clínicas de um usuário (owner)
-- =====================================================

CREATE OR REPLACE FUNCTION public.count_user_clinics(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM public.clinics
  WHERE owner_user_id = _user_id
    AND is_active = true
$$;

-- =====================================================
-- FUNÇÃO: Verificar se usuário pode criar nova clínica
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_user_create_clinic(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_superadmin BOOLEAN;
  _current_count INTEGER;
  _plan_max_clinics INTEGER;
  _subscription_plan_id UUID;
BEGIN
  -- Superadmin sempre pode criar
  SELECT public.is_superadmin(_user_id) INTO _is_superadmin;
  IF _is_superadmin THEN
    RETURN true;
  END IF;

  -- Contar clínicas ativas do usuário
  SELECT public.count_user_clinics(_user_id) INTO _current_count;

  -- Buscar plano da assinatura do usuário
  SELECT s.plan_id INTO _subscription_plan_id
  FROM public.clinic_users cu
  JOIN public.subscriptions s ON s.clinic_id = cu.clinic_id
  WHERE cu.user_id = _user_id
    AND s.status IN ('trial', 'active')
  LIMIT 1;

  -- Se não tem assinatura ativa, não pode criar
  IF _subscription_plan_id IS NULL THEN
    RETURN false;
  END IF;

  -- Buscar limite do plano
  SELECT max_clinics INTO _plan_max_clinics
  FROM public.plans
  WHERE id = _subscription_plan_id;

  -- Se max_clinics é NULL, ilimitado
  IF _plan_max_clinics IS NULL THEN
    RETURN true;
  END IF;

  -- Verificar se está dentro do limite
  RETURN _current_count < _plan_max_clinics;
END;
$$;

COMMENT ON FUNCTION public.can_user_create_clinic IS 'Verifica se usuário pode criar nova clínica baseado no limite do plano. Superadmin sempre retorna true.';
