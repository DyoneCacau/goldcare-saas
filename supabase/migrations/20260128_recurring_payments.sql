-- =====================================================
-- MIGRATION: Sistema de Pagamentos Recorrentes
-- Data: 2026-01-28
-- Objetivo: Implementar pagamentos recorrentes automáticos
-- =====================================================

-- Adicionar campos de recorrência na tabela subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_billing_date TIMESTAMPTZ;

-- Adicionar campo de método de pagamento recorrente
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('credit_card', 'pix', 'boleto', 'bank_transfer', 'manual')),
ADD COLUMN IF NOT EXISTS payment_token TEXT, -- Token do gateway de pagamento (criptografado)
ADD COLUMN IF NOT EXISTS payment_gateway TEXT; -- Nome do gateway (stripe, asaas, etc)

-- Criar tabela de histórico de cobranças recorrentes
CREATE TABLE IF NOT EXISTS public.recurring_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  billing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  payment_method TEXT,
  payment_gateway TEXT,
  payment_gateway_id TEXT, -- ID da transação no gateway
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_recurring_payments_subscription ON public.recurring_payments(subscription_id);
CREATE INDEX idx_recurring_payments_clinic ON public.recurring_payments(clinic_id);
CREATE INDEX idx_recurring_payments_status ON public.recurring_payments(status);
CREATE INDEX idx_recurring_payments_billing_date ON public.recurring_payments(billing_date);
CREATE INDEX idx_subscriptions_next_billing ON public.subscriptions(next_billing_date) WHERE next_billing_date IS NOT NULL;

-- RLS para recurring_payments
ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view all recurring payments" ON public.recurring_payments
  FOR SELECT USING (is_superadmin(auth.uid()));

CREATE POLICY "Users can view their clinic recurring payments" ON public.recurring_payments
  FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Superadmins can manage recurring payments" ON public.recurring_payments
  FOR ALL USING (is_superadmin(auth.uid()));

-- Função para calcular próxima data de cobrança
CREATE OR REPLACE FUNCTION public.calculate_next_billing_date(
  _current_period_end TIMESTAMPTZ,
  _billing_cycle TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF _billing_cycle = 'yearly' THEN
    RETURN _current_period_end + INTERVAL '1 year';
  ELSE
    RETURN _current_period_end + INTERVAL '1 month';
  END IF;
END;
$$;

-- Função para processar pagamentos recorrentes (chamada por cron job ou edge function)
CREATE OR REPLACE FUNCTION public.process_recurring_payments()
RETURNS TABLE(
  processed_count INTEGER,
  failed_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _subscription RECORD;
  _next_billing TIMESTAMPTZ;
  _processed INTEGER := 0;
  _failed INTEGER := 0;
BEGIN
  -- Buscar assinaturas ativas com auto_renew = true e next_billing_date <= hoje
  FOR _subscription IN
    SELECT s.*, p.price_monthly, p.price_yearly, p.name as plan_name
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.status = 'active'
      AND s.auto_renew = true
      AND s.next_billing_date IS NOT NULL
      AND s.next_billing_date <= CURRENT_DATE
      AND s.payment_status = 'paid'
  LOOP
    BEGIN
      -- Calcular valor baseado no ciclo
      DECLARE
        _amount DECIMAL(10,2);
      BEGIN
        IF _subscription.billing_cycle = 'yearly' AND _subscription.price_yearly IS NOT NULL THEN
          _amount := _subscription.price_yearly;
        ELSE
          _amount := _subscription.price_monthly;
        END IF;

        -- Criar registro de cobrança recorrente
        INSERT INTO public.recurring_payments (
          subscription_id,
          clinic_id,
          amount,
          billing_date,
          due_date,
          status,
          payment_method,
          payment_gateway
        ) VALUES (
          _subscription.id,
          _subscription.clinic_id,
          _amount,
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '7 days', -- 7 dias para pagar
          'pending',
          _subscription.payment_method,
          _subscription.payment_gateway
        );

        -- Atualizar próxima data de cobrança
        _next_billing := public.calculate_next_billing_date(
          _subscription.current_period_end,
          _subscription.billing_cycle
        );

        UPDATE public.subscriptions
        SET
          next_billing_date = _next_billing,
          last_billing_date = CURRENT_DATE,
          current_period_start = CURRENT_DATE,
          current_period_end = _next_billing
        WHERE id = _subscription.id;

        _processed := _processed + 1;
      END;
    EXCEPTION WHEN OTHERS THEN
      _failed := _failed + 1;
      -- Log erro (pode criar tabela de logs se necessário)
      RAISE WARNING 'Erro ao processar pagamento recorrente para subscription %: %', _subscription.id, SQLERRM;
    END;
  END LOOP;

  RETURN QUERY SELECT _processed, _failed;
END;
$$;

COMMENT ON FUNCTION public.process_recurring_payments IS 
'Processa pagamentos recorrentes pendentes. Deve ser chamada diariamente via cron job ou edge function.';

-- Trigger para atualizar next_billing_date quando subscription é criada/atualizada
CREATE OR REPLACE FUNCTION public.update_subscription_billing_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se next_billing_date não está definido e temos current_period_end, calcular
  IF NEW.next_billing_date IS NULL AND NEW.current_period_end IS NOT NULL THEN
    NEW.next_billing_date := public.calculate_next_billing_date(
      NEW.current_period_end,
      COALESCE(NEW.billing_cycle, 'monthly')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_subscription_billing_dates_trigger
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_billing_dates();

-- Comentários
COMMENT ON COLUMN public.subscriptions.billing_cycle IS 'Ciclo de cobrança: monthly ou yearly';
COMMENT ON COLUMN public.subscriptions.auto_renew IS 'Se true, renova automaticamente no final do período';
COMMENT ON COLUMN public.subscriptions.next_billing_date IS 'Próxima data de cobrança automática';
COMMENT ON COLUMN public.subscriptions.last_billing_date IS 'Última data em que foi cobrado';
COMMENT ON COLUMN public.subscriptions.payment_method IS 'Método de pagamento para recorrência';
COMMENT ON COLUMN public.subscriptions.payment_token IS 'Token criptografado do gateway de pagamento';
COMMENT ON TABLE public.recurring_payments IS 'Histórico de tentativas de cobrança recorrente';
