-- =====================================================
-- MIGRATION: Sistema de Pagamentos e Comissões
-- Data: 2026-01-27
-- Objetivo: Criar tabela de pagamentos e vincular comissões
-- =====================================================

-- Criar enum para status de pagamento
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded');

-- Criar enum para método de pagamento
CREATE TYPE payment_method AS ENUM ('cash', 'credit', 'debit', 'pix', 'voucher', 'split');

-- =====================================================
-- TABELA DE PAGAMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    appointment_id UUID, -- Opcional: pode ser pagamento avulso
    patient_id UUID, -- ID do paciente (para rastreabilidade)
    patient_name VARCHAR,

    -- Valores
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,

    -- Método e status
    payment_method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',

    -- Metadados
    description TEXT,
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID, -- ID do usuário que confirmou

    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_paid_amount CHECK (paid_amount <= total_amount)
);

-- Índices para performance
CREATE INDEX idx_payments_clinic_id ON public.payments(clinic_id);
CREATE INDEX idx_payments_appointment_id ON public.payments(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_confirmed_at ON public.payments(confirmed_at) WHERE confirmed_at IS NOT NULL;

-- =====================================================
-- ATUALIZAR TABELA DE COMISSÕES
-- =====================================================

-- Adicionar payment_id (OBRIGATÓRIO)
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE;

-- Criar índice composto para garantir unicidade
CREATE UNIQUE INDEX idx_commissions_unique_payment_beneficiary
ON public.commissions(payment_id, beneficiary_id, beneficiary_type)
WHERE payment_id IS NOT NULL;

-- Adicionar índice para busca por pagamento
CREATE INDEX idx_commissions_payment_id ON public.commissions(payment_id) WHERE payment_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - PAYMENTS
-- =====================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver pagamentos da sua clínica
CREATE POLICY "Users can view payments from their clinic"
    ON public.payments
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
        )
    );

-- Admins e recepcionistas podem criar pagamentos
CREATE POLICY "Admins and receptionists can create payments"
    ON public.payments
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT cu.clinic_id
            FROM public.clinic_users cu
            JOIN public.user_roles ur ON ur.user_id = cu.user_id
            WHERE cu.user_id = auth.uid()
            AND ur.role IN ('admin', 'receptionist', 'superadmin')
        )
    );

-- Admins podem atualizar pagamentos
CREATE POLICY "Admins can update payments"
    ON public.payments
    FOR UPDATE
    USING (
        clinic_id IN (
            SELECT cu.clinic_id
            FROM public.clinic_users cu
            JOIN public.user_roles ur ON ur.user_id = cu.user_id
            WHERE cu.user_id = auth.uid()
            AND ur.role IN ('admin', 'superadmin')
        )
    )
    WITH CHECK (
        clinic_id IN (
            SELECT cu.clinic_id
            FROM public.clinic_users cu
            JOIN public.user_roles ur ON ur.user_id = cu.user_id
            WHERE cu.user_id = auth.uid()
            AND ur.role IN ('admin', 'superadmin')
        )
    );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at em payments
CREATE OR REPLACE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA GERAR COMISSÕES AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION generate_commissions_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Só gera comissões quando o pagamento é confirmado
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        -- A geração de comissões será feita pelo backend (Node.js/TypeScript)
        -- Esta trigger apenas registra o evento
        -- Comissões serão criadas via hook useConfirmPayment

        RAISE NOTICE 'Payment confirmed: %. Commissions should be generated by backend.', NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER on_payment_confirmed
    AFTER INSERT OR UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION generate_commissions_on_payment();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.payments IS 'Tabela de pagamentos - FONTE ÚNICA DE VERDADE para geração de comissões';
COMMENT ON COLUMN public.payments.appointment_id IS 'Opcional - vincula ao agendamento se houver';
COMMENT ON COLUMN public.payments.status IS 'Status do pagamento - CONFIRMED é o gatilho para comissão';
COMMENT ON COLUMN public.payments.confirmed_at IS 'Timestamp da confirmação - usado para rastreabilidade';

COMMENT ON COLUMN public.commissions.payment_id IS 'OBRIGATÓRIO - vincula comissão ao pagamento (idempotência)';
COMMENT ON INDEX idx_commissions_unique_payment_beneficiary IS 'Garante que o mesmo pagamento não gere comissão duplicada para o mesmo beneficiário';
