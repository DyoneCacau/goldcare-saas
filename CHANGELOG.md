# Changelog - Clinic Harmony Hub

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.0] - 2026-01-27

### 🎉 Lançamento Inicial - Identidade Própria

#### ✨ Adicionado

**Sistema de Comissões - Persistência Completa**
- Tabela `commission_rules` no banco de dados
- 5 tipos ENUM para validação de dados:
  - `calculation_type`: 'percentage' | 'fixed'
  - `calculation_unit`: 'appointment' | 'ml' | 'arch' | 'unit' | 'session'
  - `beneficiary_type`: 'professional' | 'seller' | 'reception'
  - `day_of_week_enum`: Dias da semana + 'all'
- Hooks customizados com React Query:
  - `useCommissionRules()`: Buscar regras
  - `useCreateCommissionRule()`: Criar regra
  - `useUpdateCommissionRule()`: Atualizar regra
  - `useDeleteCommissionRule()`: Excluir regra
  - `useToggleCommissionRule()`: Ativar/Desativar
- Hooks para cálculos de comissão:
  - `useCommissions()`: Buscar comissões calculadas
  - `useCommissionSummary()`: Estatísticas
  - `usePayCommission()`: Marcar como paga
  - `useBatchPayCommissions()`: Pagamento em lote
  - `useCancelCommission()`: Cancelar comissão
- Row-Level Security (RLS) completo
- Índices para performance
- Cálculo automático de prioridade

**Documentação**
- `README.md`: Documentação completa do projeto
- `INSTRUCOES_DEPLOY.md`: Guia passo a passo para deploy
- `CHANGELOG.md`: Este arquivo

**Migração**
- `20260127_commission_rules.sql`: Criação da tabela e políticas

#### 🔄 Alterado

**Identidade do Projeto**
- Nome do projeto: `vite_react_shadcn_ts` → `clinic-harmony-hub`
- Versão: `0.0.0` → `1.0.0`
- Título da aplicação atualizado
- Meta tags com descrições próprias
- Idioma padrão: `pt-BR`

**Componentes**
- `src/pages/Commissions.tsx`:
  - Removido uso de dados mock
  - Integrado com hooks do Supabase
  - Loading e error states
  - Remoção de filtro multi-clínica (cada usuário vê só sua clínica)

#### 🗑️ Removido

**Dependências do Lovable**
- `lovable-tagger` removido do `package.json`
- Import do `componentTagger` removido do `vite.config.ts`
- Plugin `componentTagger` removido da configuração
- Todas as referências no `index.html`
- URLs e metadados do lovable.dev
- README.md antigo com instruções do Lovable

#### 🐛 Corrigido

- Transformação de dados entre snake_case (DB) e camelCase (Frontend)
- Validação de valores de comissão (percentage 0-100, fixed >= 0)
- Política RLS para garantir isolamento entre clínicas

#### 🔒 Segurança

- RLS em `commission_rules` com 2 políticas:
  - SELECT: Qualquer usuário da clínica
  - ALL (INSERT/UPDATE/DELETE): Apenas admins
- Validação de percentuais e valores fixos via constraint
- Cálculo automático de prioridade para evitar manipulação

---

## [Próximas Versões - Planejado]

### [1.1.0] - Workflow de Pagamentos
- Interface para marcar comissões como pagas
- Relatório de comissões pagas/pendentes
- Exportação de comprovantes

### [1.2.0] - Relatórios Avançados
- Gráficos de comissões por período
- Exportação Excel/PDF
- Dashboard de performance

### [1.3.0] - Integração Completa
- Cálculo automático ao finalizar consulta
- Notificações de comissões disponíveis
- Histórico completo

### [1.4.0] - Módulos Complementares
- Integração completa de Pacientes com Supabase
- Integração completa de Agenda com Supabase
- Integração completa de Financeiro com Supabase

---

## Notas de Migração

### De Mock Data para Supabase

Se você estava usando a versão anterior com dados mock:

1. As regras de comissão antigas não serão migradas automaticamente
2. Você precisará recriá-las através da interface após aplicar a migração
3. Não há conflito de IDs - o banco usa UUID
4. A lógica de cálculo permanece a mesma

### Breaking Changes

Nenhum breaking change para usuários finais. Apenas mudanças internas de implementação.

---

## Contribuidores

- Sistema desenvolvido internamente
- Foco em odontologia
- Multi-tenant completo

---

**Versão Atual**: 1.0.0
**Última Atualização**: 27 de Janeiro de 2026
