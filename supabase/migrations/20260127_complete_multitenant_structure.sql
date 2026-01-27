-- =====================================================
-- MIGRATION: Estrutura Multi-Tenant Completa
-- Data: 2026-01-27
-- Objetivo: Criar tabelas faltantes e garantir multi-tenant real
-- =====================================================

-- =====================================================
-- ADICIONAR clinic_id EM TABELAS EXISTENTES
-- =====================================================

-- Adicionar clinic_id em professionals (se ainda não existir)
ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;

-- Adicionar clinic_id em time_clock_entries (se ainda não existir)
ALTER TABLE public.time_clock_entries
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;

-- Adicionar clinic_id em profiles (opcional, mas recomendado)
-- Um perfil pode estar vinculado a uma clínica principal
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

-- =====================================================
-- ATUALIZAR app_role ENUM PARA INCLUIR SUPERADMIN
-- =====================================================

-- Drop do tipo existente e recriação com superadmin
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin', 'receptionist', 'seller', 'professional', 'superadmin');

-- Atualizar coluna para usar novo tipo
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;

-- Remover tipo antigo
DROP TYPE app_role_old;

-- =====================================================
-- CRIAR TABELA DE PACIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,

  -- Dados pessoais
  name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  birth_date DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Dados clínicos
  allergies TEXT[] DEFAULT '{}',
  medical_conditions TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  clinical_notes TEXT,

  -- Metadados
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_active BOOLEAN DEFAULT true,

  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX idx_patients_cpf ON public.patients(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patients_status ON public.patients(status) WHERE status = 'active';

-- =====================================================
-- CRIAR TABELA DE PROCEDIMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  code TEXT, -- Código TUSS ou interno
  description TEXT,
  category TEXT,

  -- Valores
  base_price DECIMAL(10,2) DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,

  -- Configuração
  requires_anesthesia BOOLEAN DEFAULT false,
  requires_assistant BOOLEAN DEFAULT false,
  notes TEXT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_procedures_clinic_id ON public.procedures(clinic_id);
CREATE INDEX idx_procedures_active ON public.procedures(is_active) WHERE is_active = true;

-- =====================================================
-- CRIAR TABELA DE AGENDAMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,

  -- Relacionamentos
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,

  -- Data e horário
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Informações
  procedure_name TEXT NOT NULL, -- Pode ser texto livre
  procedure_value DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')
  ),

  -- Origem do lead (para comissões de vendedores)
  lead_source TEXT CHECK (lead_source IN ('instagram', 'whatsapp', 'referral', 'paid_traffic', 'website', 'other')),
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reception_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Observações
  notes TEXT,
  cancellation_reason TEXT,

  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_professional_id ON public.appointments(professional_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_seller_id ON public.appointments(seller_id) WHERE seller_id IS NOT NULL;

-- =====================================================
-- ATUALIZAR TABELA DE COMISSÕES
-- =====================================================

-- Garantir que comissões têm appointment_id
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS procedure_name TEXT,
ADD COLUMN IF NOT EXISTS procedure_value DECIMAL(10,2);

-- Atualizar tipos de beneficiário se necessário
-- Já existe no enum beneficiary_type: professional, seller, reception

-- =====================================================
-- ENABLE RLS EM TODAS AS NOVAS TABELAS
-- =====================================================

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PATIENTS
-- =====================================================

CREATE POLICY "Users can view patients from their clinic"
ON public.patients FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
  ) OR public.is_superadmin(auth.uid())
);

CREATE POLICY "Users can create patients in their clinic"
ON public.patients FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update patients in their clinic"
ON public.patients FOR UPDATE
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete patients in their clinic"
ON public.patients FOR DELETE
USING (
  clinic_id IN (
    SELECT cu.clinic_id
    FROM public.clinic_users cu
    JOIN public.user_roles ur ON ur.user_id = cu.user_id
    WHERE cu.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin')
  )
);

-- =====================================================
-- RLS POLICIES - PROCEDURES
-- =====================================================

CREATE POLICY "Users can view procedures from their clinic"
ON public.procedures FOR SELECT
USING (
  (clinic_id IN (
    SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
  ) OR public.is_superadmin(auth.uid()))
  AND is_active = true
);

CREATE POLICY "Admins can manage procedures"
ON public.procedures FOR ALL
USING (
  clinic_id IN (
    SELECT cu.clinic_id
    FROM public.clinic_users cu
    JOIN public.user_roles ur ON ur.user_id = cu.user_id
    WHERE cu.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin')
  )
);

-- =====================================================
-- RLS POLICIES - APPOINTMENTS
-- =====================================================

CREATE POLICY "Users can view appointments from their clinic"
ON public.appointments FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
  ) OR public.is_superadmin(auth.uid())
);

CREATE POLICY "Users can create appointments in their clinic"
ON public.appointments FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update appointments in their clinic"
ON public.appointments FOR UPDATE
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete appointments in their clinic"
ON public.appointments FOR DELETE
USING (
  clinic_id IN (
    SELECT cu.clinic_id
    FROM public.clinic_users cu
    JOIN public.user_roles ur ON ur.user_id = cu.user_id
    WHERE cu.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin')
  )
);

-- =====================================================
-- ATUALIZAR RLS POLICIES - PROFESSIONALS
-- =====================================================

-- Drop políticas antigas que não consideram clinic_id
DROP POLICY IF EXISTS "Everyone can view active professionals" ON public.professionals;
DROP POLICY IF EXISTS "Admins can insert professionals with feature check" ON public.professionals;
DROP POLICY IF EXISTS "Admins can update professionals with feature check" ON public.professionals;
DROP POLICY IF EXISTS "Admins can delete professionals with feature check" ON public.professionals;

-- Novas políticas com clinic_id
CREATE POLICY "Users can view professionals from their clinic"
ON public.professionals FOR SELECT
USING (
  (clinic_id IN (
    SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
  ) OR public.is_superadmin(auth.uid()))
  AND (is_active = true OR public.is_admin(auth.uid()))
);

CREATE POLICY "Admins can manage professionals in their clinic"
ON public.professionals FOR ALL
USING (
  clinic_id IN (
    SELECT cu.clinic_id
    FROM public.clinic_users cu
    JOIN public.user_roles ur ON ur.user_id = cu.user_id
    WHERE cu.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin')
  )
  AND public.user_has_feature(auth.uid(), 'profissionais')
)
WITH CHECK (
  clinic_id IN (
    SELECT cu.clinic_id
    FROM public.clinic_users cu
    JOIN public.user_roles ur ON ur.user_id = cu.user_id
    WHERE cu.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin')
  )
  AND public.user_has_feature(auth.uid(), 'profissionais')
);

-- =====================================================
-- ATUALIZAR RLS POLICIES - TIME_CLOCK_ENTRIES
-- =====================================================

DROP POLICY IF EXISTS "Users can insert their own entries with feature check" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Users can view their own entries with feature check" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Admins can view all entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Admins can update entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Users can update their pending corrections" ON public.time_clock_entries;

-- Novas políticas com clinic_id
CREATE POLICY "Users can view entries from their clinic"
ON public.time_clock_entries FOR SELECT
USING (
  (clinic_id IN (
    SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
  ) AND (auth.uid() = user_id OR public.is_admin(auth.uid())))
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "Users can insert entries in their clinic"
ON public.time_clock_entries FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
  )
  AND auth.uid() = user_id
  AND public.user_has_feature(auth.uid(), 'ponto')
);

CREATE POLICY "Users can update their pending entries"
ON public.time_clock_entries FOR UPDATE
USING (
  auth.uid() = user_id
  AND correction_status = 'pending'
  AND clinic_id IN (
    SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update entries in their clinic"
ON public.time_clock_entries FOR UPDATE
USING (
  clinic_id IN (
    SELECT cu.clinic_id
    FROM public.clinic_users cu
    JOIN public.user_roles ur ON ur.user_id = cu.user_id
    WHERE cu.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin')
  )
);

-- =====================================================
-- TRIGGERS PARA updated_at
-- =====================================================

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procedures_updated_at
  BEFORE UPDATE ON public.procedures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA OBTER clinic_id DO USUÁRIO LOGADO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_current_user_clinic_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id
  FROM public.clinic_users
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.patients IS 'Tabela de pacientes - multi-tenant com clinic_id';
COMMENT ON TABLE public.procedures IS 'Tabela de procedimentos odontológicos - multi-tenant';
COMMENT ON TABLE public.appointments IS 'Tabela de agendamentos - fonte para geração de comissões';
COMMENT ON COLUMN public.appointments.seller_id IS 'Vendedor responsável pela captação (para comissão de vendedor)';
COMMENT ON COLUMN public.appointments.reception_id IS 'Recepcionista que agendou (para comissão de recepção)';
COMMENT ON COLUMN public.appointments.lead_source IS 'Origem do lead (Instagram, WhatsApp, etc)';
