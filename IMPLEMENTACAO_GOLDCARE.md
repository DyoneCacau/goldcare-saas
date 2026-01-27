# 🚀 GOLDCARE - Implementação Multi-Tenant e Comissões Automáticas

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Multi-Tenant REAL** ✅
- ✅ Adicionado `clinic_id` em **TODAS** as tabelas principais
- ✅ Row Level Security (RLS) configurado em todas as tabelas
- ✅ AuthProvider atualizado com `clinicId` no contexto global
- ✅ Isolamento total de dados entre clínicas
- ✅ SuperAdmin pode ignorar RLS e visualizar todas as clínicas

### 2. **Estrutura do Banco de Dados** ✅
Criadas as seguintes tabelas com RLS:

#### Tabelas de Core:
- ✅ `patients` - Pacientes multi-tenant
- ✅ `procedures` - Procedimentos odontológicos
- ✅ `appointments` - Agendamentos com origem (Instagram, WhatsApp, etc)
- ✅ `payments` - Pagamentos (fonte única de verdade)
- ✅ `commissions` - Comissões automáticas vinculadas a pagamentos
- ✅ `commission_rules` - Regras de comissão configuráveis

#### Tabelas Existentes Atualizadas:
- ✅ `professionals` - Adicionado clinic_id + RLS
- ✅ `time_clock_entries` - Adicionado clinic_id + RLS
- ✅ `profiles` - Adicionado primary_clinic_id (opcional)

### 3. **Autenticação e Contexto** ✅
**Arquivo: `src/hooks/useAuth.tsx`**

- ✅ `clinicId` disponível globalmente via `useAuth()`
- ✅ Busca automática do clinic_id ao fazer login
- ✅ Limpeza do clinic_id ao fazer logout
- ✅ Suporte a multi-role (admin, receptionist, seller, professional, superadmin)

```typescript
const { clinicId, user, isSuperAdmin, isAdmin } = useAuth();
```

### 4. **Sistema de Comissões Automáticas** ✅ ⭐
**Arquivo: `src/hooks/useCommissions.ts`**

#### Como Funciona:
1. **Pagamento é confirmado** → dispara `useGenerateCommissions()`
2. **Sistema busca regras ativas** para a clínica
3. **Calcula comissões** baseadas em:
   - Profissional (obrigatório)
   - Vendedor (se houver)
   - Recepção (se houver)
4. **Insere comissões automaticamente** com idempotência
5. **Status inicial: `pending`**

#### Exemplo de Uso:
```typescript
const { mutate: generateCommissions } = useGenerateCommissions();

// Ao confirmar um pagamento:
generateCommissions({
  paymentId: 'uuid-do-pagamento',
  appointmentId: 'uuid-do-agendamento',
  professionalId: 'uuid-do-dentista',
  procedureName: 'Limpeza',
  procedureValue: 150.00,
  sellerId: 'uuid-do-vendedor', // opcional
  receptionId: 'uuid-da-recepcao', // opcional
});

// Resultado: Comissões criadas automaticamente!
```

### 5. **Hooks Criados** ✅

#### `usePatients.ts`
- ✅ `usePatients()` - Listar pacientes da clínica
- ✅ `createPatient()` - Criar paciente (vincula clinic_id automaticamente)
- ✅ `updatePatient()` - Atualizar paciente
- ✅ `deletePatient()` - Soft delete (marca como inativo)

#### `useCommissions.ts`
- ✅ `useCommissions()` - Listar comissões (com filtros)
- ✅ `useGenerateCommissions()` - **CORE: Gerar comissões automaticamente**
- ✅ Estados da comissão: pending → paid / cancelled
- ✅ Comissões pagas são imutáveis

---

## 📋 MIGRAÇÃO SQL

**Arquivo: `supabase/migrations/20260127_complete_multitenant_structure.sql`**

### O que esta migração faz:
1. ✅ Adiciona `clinic_id` em todas as tabelas que faltavam
2. ✅ Cria tabelas de `patients`, `procedures`, `appointments`
3. ✅ Atualiza enum `app_role` para incluir `superadmin`
4. ✅ Configura RLS em TODAS as tabelas
5. ✅ Garante isolamento multi-tenant completo
6. ✅ Cria índices para performance

### Como Aplicar a Migração:

```bash
# Opção 1: Via Supabase CLI (recomendado)
cd clinic-harmony-hub
supabase db push

# Opção 2: Via Dashboard do Supabase
# Copie e cole o conteúdo do arquivo SQL no SQL Editor do Supabase
```

---

## 🎯 FLUXO DE INTEGRAÇÃO: Agendamento → Pagamento → Comissão

### Passo a Passo:

1. **Criar Agendamento**
```typescript
INSERT INTO appointments (
  clinic_id,
  patient_id,
  professional_id,
  procedure_name,
  procedure_value: 150.00,
  seller_id,       // IMPORTANTE: para comissão de vendedor
  reception_id,    // IMPORTANTE: para comissão de recepção
  lead_source: 'instagram',
  status: 'confirmed'
)
```

2. **Criar Pagamento**
```typescript
INSERT INTO payments (
  clinic_id,
  appointment_id,
  total_amount: 150.00,
  payment_method: 'pix',
  status: 'pending'
)
```

3. **Confirmar Pagamento (GERA COMISSÕES)**
```typescript
const { mutate: generateCommissions } = useGenerateCommissions();

generateCommissions({
  paymentId,
  professionalId,
  procedureName,
  procedureValue,
  sellerId,       // da tabela appointments
  receptionId,    // da tabela appointments
  appointmentId
});

// → Sistema busca regras de comissão
// → Calcula valores automaticamente
// → Cria registros em 'commissions'
// → Status: 'pending'
```

4. **Visualizar Comissões**
```typescript
const { data: commissions } = useCommissions({
  beneficiaryId: userId,  // filtrar por beneficiário
  status: 'pending'       // apenas pendentes
});
```

---

## 🔐 Row Level Security (RLS)

### Políticas Implementadas:

#### Todas as tabelas seguem o padrão:
```sql
-- SELECT: Usuários veem apenas dados da sua clínica
-- SuperAdmin vê todos os dados

-- INSERT/UPDATE/DELETE: Usuários gerenciam apenas sua clínica
-- Admins têm controle completo na sua clínica
-- SuperAdmin tem controle global
```

#### Exemplo (tabela `patients`):
- ✅ Usuário comum: vê apenas pacientes da sua clínica
- ✅ Admin: gerencia pacientes da sua clínica
- ✅ SuperAdmin: vê e gerencia pacientes de todas as clínicas

---

## 🧪 TESTES DE INTEGRAÇÃO

### Cenário 1: Criar Clínica → Aparecer no Super Admin
```sql
-- 1. Criar clínica
INSERT INTO clinics (name, email) VALUES ('Clínica Teste', 'teste@email.com');

-- 2. Verificar no Super Admin
SELECT * FROM clinics WHERE name = 'Clínica Teste';
-- Deve aparecer para usuários com role 'superadmin'
```

### Cenário 2: Criar Agendamento → Finalizar → Verificar Comissão
```typescript
// 1. Criar agendamento
const appointment = await createAppointment({
  patient_id: '...',
  professional_id: '...',
  procedure_name: 'Limpeza',
  procedure_value: 150,
  seller_id: 'uuid-do-vendedor',
  status: 'confirmed'
});

// 2. Criar pagamento
const payment = await createPayment({
  appointment_id: appointment.id,
  total_amount: 150,
  payment_method: 'pix'
});

// 3. Gerar comissões
await generateCommissions({
  paymentId: payment.id,
  professionalId: appointment.professional_id,
  procedureName: 'Limpeza',
  procedureValue: 150,
  sellerId: appointment.seller_id
});

// 4. Verificar comissões criadas
const commissions = await supabase
  .from('commissions')
  .select('*')
  .eq('payment_id', payment.id);

// Esperado: 2 comissões (profissional + vendedor)
```

### Cenário 3: Multi-Tenant - Dados Não Cruzam
```typescript
// Usuário da Clínica A não vê pacientes da Clínica B
const { clinicId } = useAuth(); // Clínica A

const { data: patients } = await supabase
  .from('patients')
  .select('*');

// RLS garante que apenas pacientes da Clínica A são retornados
```

---

## ⚠️ PENDÊNCIAS E PRÓXIMOS PASSOS

### 1. Atualizar Componentes Frontend
Os componentes ainda usam dados mockados. Precisam ser atualizados para usar os hooks do Supabase:

- [ ] `src/components/agenda/*` → usar dados reais
- [ ] `src/components/patients/*` → usar `usePatients()`
- [ ] `src/components/commissions/*` → usar `useCommissions()`
- [ ] `src/components/superadmin/*` → corrigir visualização de clínicas

### 2. Módulo Super Admin
- [ ] Tela de listagem de clínicas
- [ ] Criar/editar/bloquear clínicas
- [ ] Visualizar usuários por clínica
- [ ] Dashboard geral da plataforma

### 3. Módulo de Administração
- [ ] CRUD de usuários da clínica
- [ ] Definir roles (admin, receptionist, seller, professional)
- [ ] Ativar/desativar usuários
- [ ] Configurar regras de comissão

### 4. Testes End-to-End
- [ ] Testar fluxo completo: agendamento → pagamento → comissão
- [ ] Validar multi-tenant (dados não cruzam)
- [ ] Testar permissões por role

---

## 🚀 SETUP LOCAL

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Editar .env com suas credenciais do Supabase
```

### 3. Aplicar migrações do banco
```bash
# Via Supabase CLI
supabase db push

# OU via Dashboard
# Copiar e colar o SQL no SQL Editor
```

### 4. Criar um usuário SuperAdmin
```sql
-- No SQL Editor do Supabase:
INSERT INTO user_roles (user_id, role)
VALUES ('seu-user-id-aqui', 'superadmin');
```

### 5. Rodar o projeto
```bash
npm run dev
```

---

## 📝 GIT - Preparação para Versionamento

### Arquivos importantes:
- ✅ `.env.example` - Template de variáveis de ambiente
- ✅ `.gitignore` - Já configurado (ignora .env)
- ✅ Migrações SQL - Versionadas em `supabase/migrations/`

### Comandos Git:
```bash
# Verificar status
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: Implementa multi-tenant e comissões automáticas

- Adiciona clinic_id em todas as tabelas
- Configura RLS completo
- Cria hook de geração automática de comissões
- Atualiza AuthProvider com clinicId
- Cria tabelas de patients, appointments, payments"

# Push
git push origin main
```

---

## 🎉 RESULTADO

### Sistema GOLDCARE agora possui:
✅ **Multi-tenant real** - Isolamento total entre clínicas
✅ **Comissões 100% automáticas** - Geradas ao confirmar pagamento
✅ **Segurança RLS** - Dados protegidos no nível do banco
✅ **AuthProvider com clinic_id** - Contexto global funcional
✅ **Estrutura pronta para produção** - Banco de dados completo

### Próximo passo:
Atualizar os componentes React para usar os hooks do Supabase e remover dados mockados.

---

**Desenvolvido para: GOLDCARE SaaS Odontológico**
**Data:** 27/01/2026
**Status:** ✅ Core do produto finalizado e pronto para integração frontend
