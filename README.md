# Clinic Harmony Hub

Sistema completo de gestão para clínicas odontológicas multi-tenant com automação de comissões.

## 🏥 Sobre o Projeto

**Goldcare** é um SaaS odontológico moderno e escalável, desenvolvido para automatizar a gestão completa de clínicas dentárias. O sistema oferece controle total sobre agendamentos, pacientes, profissionais, financeiro e o diferencial: **automação completa de comissões**.

### Principais Diferenciais

- 🔐 **Multi-tenant**: Isolamento total entre clínicas
- 💰 **Comissões Automatizadas**: Cálculo automático baseado em procedimentos e pagamentos
- 📊 **Gestão Completa**: Pacientes, agenda, financeiro, estoque e relatórios
- ⏰ **Ponto Eletrônico**: Controle de jornada integrado
- 🎯 **Feature Gates**: Planos e módulos configuráveis por clínica

## 🚀 Stack Tecnológica

### Frontend
- **React 18.3** + **TypeScript 5.8**
- **Vite 5.4** (build ultrarrápido com SWC)
- **TailwindCSS 3.4** + **shadcn/ui**
- **React Router v6** (rotas protegidas)
- **TanStack Query** (cache e sincronização)
- **React Hook Form** + **Zod** (validação)

### Backend
- **Supabase** (PostgreSQL + Auth + RLS)
- **Row-Level Security (RLS)**: Isolamento por clínica
- **Edge Functions**: Automações serverless
- **Real-time**: Subscriptions (preparado)

### UI/UX
- 50+ componentes Radix UI via shadcn/ui
- Design responsivo e acessível
- Tema claro/escuro (preparado)

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ (recomendado: usar [nvm](https://github.com/nvm-sh/nvm))
- npm ou yarn
- Conta Supabase (para banco de dados)

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/DyoneCacau/clinic-harmony-hub.git

# 2. Entre no diretório
cd clinic-harmony-hub

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

O sistema estará disponível em `http://localhost:8080`

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run build:dev    # Build em modo desenvolvimento
npm run preview      # Preview da build
npm run lint         # Verifica problemas de código
npm run test         # Executa testes
npm run test:watch   # Testes em modo watch
```

## ⚡ Quick Start - Configuração do Banco de Dados

### 1. Aplicar Migrações do Supabase

```bash
# Via Supabase CLI (recomendado)
supabase db push

# OU via Dashboard do Supabase
# Acesse: SQL Editor → New Query
# Execute os arquivos na ordem:
# 1. supabase/migrations/20260126152354_*.sql
# 2. supabase/migrations/20260126155244_*.sql
# 3. supabase/migrations/20260126173459_*.sql
# 4. supabase/migrations/20260127_commission_rules.sql
# 5. supabase/migrations/20260127_payments_and_commissions.sql
# 6. supabase/migrations/20260127_complete_multitenant_structure.sql
# 7. (Opcional) supabase/migrations/20260127_seed_data_example.sql
```

### 2. Criar Primeiro Usuário SuperAdmin

```sql
-- No SQL Editor do Supabase, após criar usuário via Auth:
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU-USER-ID-AQUI', 'superadmin');

-- Vincular à clínica de teste (se criou dados de exemplo):
INSERT INTO public.clinic_users (clinic_id, user_id, is_owner)
VALUES ('11111111-1111-1111-1111-111111111111', 'SEU-USER-ID-AQUI', true);
```

### 3. Verificar Instalação

✅ Tabelas criadas: `patients`, `appointments`, `payments`, `commissions`, `commission_rules`
✅ RLS habilitado em todas as tabelas
✅ Funções: `get_user_clinic_id()`, `is_superadmin()`, etc.
✅ Triggers: `generate_commissions_on_payment`

📖 **Documentação completa:** Veja [IMPLEMENTACAO_GOLDCARE.md](./IMPLEMENTACAO_GOLDCARE.md)

## 📂 Estrutura do Projeto

```
clinic-harmony-hub/
├── src/
│   ├── components/        # Componentes React organizados por domínio
│   │   ├── agenda/       # Componentes de agendamento
│   │   ├── commissions/  # Sistema de comissões
│   │   ├── dashboard/    # Dashboard e cards
│   │   ├── financial/    # Gestão financeira
│   │   ├── patients/     # Gestão de pacientes
│   │   ├── professionals/ # Profissionais
│   │   ├── superadmin/   # Painel administrativo
│   │   └── ui/           # Componentes base (shadcn/ui)
│   ├── pages/            # Páginas da aplicação
│   ├── hooks/            # Custom hooks (useAuth, useSubscription)
│   ├── services/         # Lógica de negócio
│   ├── types/            # Definições TypeScript
│   ├── integrations/     # Supabase e APIs
│   └── lib/              # Utilitários
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Migrações do banco
└── public/               # Assets estáticos
```

## 🗄️ Arquitetura Multi-Tenant

### Isolamento de Dados

Cada clínica possui:
- **Banco de dados isolado** via Row-Level Security (RLS)
- **Usuários próprios** com permissões específicas
- **Assinatura independente** com planos configuráveis
- **Feature gates** por plano/módulo

### Segurança

- Autenticação via Supabase Auth
- RLS em todas as tabelas sensíveis
- Validação de assinatura em rotas protegidas
- Controle de acesso baseado em roles

## 💼 Módulos do Sistema

### ✅ Implementados

- **Dashboard**: Visão geral com indicadores
- **Pacientes**: CRUD completo com histórico
- **Agenda**: Calendário (dia/semana/mês)
- **Financeiro**: Transações, caixa, múltiplos meios de pagamento
- **Comissões**: Regras, cálculos e relatórios
- **Profissionais**: Gestão de dentistas e staff
- **Ponto Eletrônico**: Controle de jornada
- **Configurações**: Dados da clínica e assinatura
- **SuperAdmin**: Gestão de clínicas e planos

### 🚧 Em Desenvolvimento

- Integração completa Supabase (alguns módulos ainda usam dados mock)
- Relatórios avançados
- Estoque completo
- Notificações em tempo real

## 💰 Sistema de Comissões (CORE)

O grande diferencial do Clinic Harmony Hub é a **automação completa de comissões**.

### Recursos

- ✅ Regras por profissional, procedimento, dia da semana
- ✅ Cálculo automático no momento do pagamento
- ✅ Múltiplos beneficiários (dentista, vendedor, recepcionista)
- ✅ Percentual ou valor fixo
- ✅ Prioridade de regras (especificidade)
- ✅ Relatórios detalhados
- 🚧 Workflow de pagamento de comissões
- 🚧 Integração total com Supabase

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
VITE_SUPABASE_PROJECT_ID=seu_project_id
```

## 🚀 Deploy

### Opções Recomendadas

1. **Vercel** (Frontend)
   ```bash
   npm run build
   # Conecte seu repositório ao Vercel
   ```

2. **Netlify**
   ```bash
   npm run build
   # Deploy via CLI ou interface
   ```

3. **Supabase** (Backend)
   - Já configurado e pronto
   - Edge Functions deployadas via Supabase CLI

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Modo watch (desenvolvimento)
npm run test:watch
```

## 📝 Licença

Propriedade privada. Todos os direitos reservados.

## 👥 Equipe

Desenvolvido para revolucionar a gestão de clínicas odontológicas.

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato através do repositório.

---

**Goldcare** - Gestão Odontológica Inteligente 🦷✨

# GoldCare SaaS — Banco (Supabase/Postgres)

## Ordem de execução
1. `database/sql/0000_profiles_trigger.sql`
2. `database/sql/0001_companies_units_users.sql`
3. `database/sql/0002_rbac.sql`
4. `database/sql/0003_providers.sql`
5. `database/sql/0004_patients.sql`
6. `database/sql/0005_appointments.sql`
7. `database/sql/0006_indexes_constraints.sql`
8. `database/sql/0007_policies_owner_or_permission.sql`

### Observações
- As policies de escrita liberam **owner** da empresa **OU** usuários com permissões `*.write` via RBAC.
- O índice de “próximas consultas” com `now()` **não é permitido** em predicado de índice; por isso usamos o índice completo `(company_id, starts_at)`.
- O módulo **financeiro** não foi incluído aqui; quando criar as tabelas (`payments`, etc.), adicionaremos as policies de “somente owner” ou por permissão (`billing.write`).