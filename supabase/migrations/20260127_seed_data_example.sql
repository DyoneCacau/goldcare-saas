-- =====================================================
-- MIGRATION: Dados de Exemplo para Testes
-- Data: 2026-01-27
-- Objetivo: Criar dados de exemplo para testar o sistema
-- ATENÇÃO: Execute apenas em ambiente de desenvolvimento/teste
-- =====================================================

-- =====================================================
-- 1. CRIAR CLÍNICA DE TESTE
-- =====================================================

-- Inserir clínica de teste
INSERT INTO public.clinics (id, name, email, phone, cnpj, city, state, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Clínica OdontoExcelência',
  'contato@odontoexcelencia.com.br',
  '(11) 98765-4321',
  '12.345.678/0001-90',
  'São Paulo',
  'SP',
  true
) ON CONFLICT (id) DO NOTHING;

-- Criar assinatura trial para a clínica
INSERT INTO public.subscriptions (clinic_id, plan_id, status, trial_ends_at)
SELECT
  '11111111-1111-1111-1111-111111111111',
  id,
  'trial',
  NOW() + INTERVAL '30 days'
FROM public.plans
WHERE slug = 'premium'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. CRIAR USUÁRIOS DE TESTE
-- =====================================================

-- Nota: Os usuários precisam ser criados via Supabase Auth primeiro
-- Aqui vamos apenas criar os vínculos clinic_users
-- Substitua os UUIDs pelos IDs reais dos usuários criados via Auth

-- Exemplo de como vincular um usuário existente à clínica:
-- INSERT INTO public.clinic_users (clinic_id, user_id, is_owner)
-- VALUES ('11111111-1111-1111-1111-111111111111', 'uuid-do-usuario-aqui', true);

-- =====================================================
-- 3. CRIAR PROFISSIONAIS
-- =====================================================

INSERT INTO public.professionals (id, clinic_id, name, specialty, cro, email, phone, is_active)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Dr. Carlos Silva',
    'Ortodontia',
    'CRO-SP 12345',
    'carlos.silva@odontoexcelencia.com.br',
    '(11) 91234-5678',
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Dra. Ana Paula',
    'Implantodontia',
    'CRO-SP 67890',
    'ana.paula@odontoexcelencia.com.br',
    '(11) 91234-9999',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. CRIAR PACIENTES DE TESTE
-- =====================================================

INSERT INTO public.patients (id, clinic_id, name, cpf, phone, email, birth_date, allergies, status, is_active)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'João Santos',
    '123.456.789-00',
    '(11) 99999-1111',
    'joao.santos@email.com',
    '1985-05-15',
    ARRAY['Penicilina'],
    'active',
    true
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Maria Oliveira',
    '987.654.321-00',
    '(11) 99999-2222',
    'maria.oliveira@email.com',
    '1990-08-20',
    ARRAY[]::text[],
    'active',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. CRIAR PROCEDIMENTOS PADRÃO
-- =====================================================

INSERT INTO public.procedures (id, clinic_id, name, category, base_price, duration_minutes, is_active)
VALUES
  (
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'Limpeza',
    'Preventiva',
    150.00,
    60,
    true
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    '11111111-1111-1111-1111-111111111111',
    'Clareamento',
    'Estética',
    800.00,
    90,
    true
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    '11111111-1111-1111-1111-111111111111',
    'Restauração',
    'Restauradora',
    250.00,
    45,
    true
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    '11111111-1111-1111-1111-111111111111',
    'Extração',
    'Cirurgia',
    300.00,
    30,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. CRIAR REGRAS DE COMISSÃO
-- =====================================================

-- Regra 1: Profissional recebe 40% em qualquer procedimento
INSERT INTO public.commission_rules (
  id,
  clinic_id,
  professional_id,
  beneficiary_type,
  procedure,
  calculation_type,
  value,
  priority,
  notes
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'all',  -- Aplica a todos os profissionais
  'professional',
  'all',  -- Aplica a todos os procedimentos
  'percentage',
  40.00,  -- 40%
  1,
  'Comissão padrão para profissionais'
) ON CONFLICT (id) DO NOTHING;

-- Regra 2: Vendedor recebe 10% em todos os procedimentos
INSERT INTO public.commission_rules (
  id,
  clinic_id,
  professional_id,
  beneficiary_type,
  procedure,
  calculation_type,
  value,
  priority,
  notes
)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'all',
  'seller',
  'all',
  'percentage',
  10.00,  -- 10%
  2,
  'Comissão para vendedores (captação)'
) ON CONFLICT (id) DO NOTHING;

-- Regra 3: Recepção recebe 5% em agendamentos
INSERT INTO public.commission_rules (
  id,
  clinic_id,
  professional_id,
  beneficiary_type,
  procedure,
  calculation_type,
  value,
  priority,
  notes
)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'all',
  'reception',
  'all',
  'percentage',
  5.00,   -- 5%
  3,
  'Comissão para recepção (agendamento)'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.clinics IS 'Clínica de teste criada: OdontoExcelência';
COMMENT ON TABLE public.commission_rules IS 'Regras de comissão de teste:
- Profissional: 40%
- Vendedor: 10%
- Recepção: 5%';

-- =====================================================
-- PRÓXIMOS PASSOS APÓS EXECUTAR ESTE SCRIPT:
-- =====================================================

-- 1. Criar usuários via Supabase Auth (Sign Up)
-- 2. Vincular usuários à clínica usando:
--    INSERT INTO clinic_users (clinic_id, user_id) VALUES (...);
-- 3. Atribuir roles aos usuários:
--    INSERT INTO user_roles (user_id, role) VALUES (...);
-- 4. Criar agendamentos de teste
-- 5. Criar pagamentos e testar geração automática de comissões

-- =====================================================
-- EXEMPLO DE TESTE COMPLETO:
-- =====================================================

-- Criar agendamento:
-- INSERT INTO appointments (
--   clinic_id,
--   patient_id,
--   professional_id,
--   procedure_name,
--   procedure_value,
--   appointment_date,
--   start_time,
--   end_time,
--   status
-- ) VALUES (
--   '11111111-1111-1111-1111-111111111111',
--   '44444444-4444-4444-4444-444444444444',
--   '22222222-2222-2222-2222-222222222222',
--   'Limpeza',
--   150.00,
--   '2026-02-01',
--   '09:00',
--   '10:00',
--   'completed'
-- );

-- Criar pagamento:
-- INSERT INTO payments (
--   clinic_id,
--   patient_id,
--   patient_name,
--   total_amount,
--   payment_method,
--   status
-- ) VALUES (
--   '11111111-1111-1111-1111-111111111111',
--   '44444444-4444-4444-4444-444444444444',
--   'João Santos',
--   150.00,
--   'pix',
--   'pending'
-- ) RETURNING id;

-- Confirmar pagamento e gerar comissões:
-- Use o hook useGenerateCommissions() no frontend
-- Ou execute manualmente a lógica de criação de comissões
