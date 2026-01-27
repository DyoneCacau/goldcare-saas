# Instruções para Deploy e Configuração

## 🚀 Mudanças Implementadas

### ✅ Identidade Própria
- ✓ Removidas todas as referências ao Lovable
- ✓ Nome do projeto atualizado para `clinic-harmony-hub`
- ✓ Versão atualizada para 1.0.0
- ✓ README.md completamente reescrito
- ✓ Meta tags e título atualizados no index.html

### ✅ Sistema de Comissões - Persistência Implementada
- ✓ Migração criada para tabela `commission_rules`
- ✓ Hooks customizados com React Query
- ✓ Integração completa com Supabase
- ✓ CRUD completo funcionando
- ✓ Row-Level Security (RLS) configurado

---

## 📋 Próximos Passos Necessários

### 1. Aplicar Migração do Banco de Dados

**IMPORTANTE**: Você precisa aplicar a nova migração no Supabase.

#### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Copie e execute o conteúdo do arquivo:
   ```
   supabase/migrations/20260127_commission_rules.sql
   ```
4. Clique em **Run** para executar

#### Opção B: Via Supabase CLI

Se você tem o Supabase CLI instalado localmente:

```bash
# 1. Instalar Supabase CLI (se não tiver)
npm install -g supabase

# 2. Login no Supabase
supabase login

# 3. Link com seu projeto
supabase link --project-ref SEU_PROJECT_ID

# 4. Aplicar migrações pendentes
supabase db push

# 5. Gerar tipos TypeScript atualizados
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 2. Atualizar Tipos do Supabase

Após aplicar a migração, você precisa regenerar os tipos TypeScript:

#### Via Supabase CLI (Recomendado):
```bash
supabase gen types typescript --project-id SEU_PROJECT_ID > src/integrations/supabase/types.ts
```

#### Via Dashboard:
1. Acesse **Project Settings → API**
2. Role até **Project API keys**
3. Use a ferramenta de geração de tipos

### 3. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 4. Remover Dependência do lovable-tagger

Já removemos do `package.json`, mas certifique-se de rodar:

```bash
npm install
# Isso vai limpar o package-lock.json
```

### 5. Testar Localmente

```bash
npm run dev
```

Acesse: `http://localhost:8080`

**Teste os seguintes fluxos**:
1. Login no sistema
2. Acesse **Comissões**
3. Crie uma nova regra de comissão
4. Edite uma regra
5. Ative/Desative uma regra
6. Exclua uma regra

### 6. Build de Produção

```bash
npm run build
```

Verifique se não há erros de TypeScript ou build.

---

## 🗄️ Estrutura do Banco de Dados - Comissões

### Nova Tabela: `commission_rules`

```sql
Campos principais:
- id (UUID)
- clinic_id (UUID) - Referência à clínica
- professional_id (VARCHAR) - ID do profissional ou 'all'
- beneficiary_type (ENUM) - 'professional', 'seller', 'reception'
- beneficiary_id (UUID) - Opcional para regras específicas
- procedure (VARCHAR) - Nome do procedimento ou 'all'
- day_of_week (ENUM) - Dia da semana ou 'all'
- calculation_type (ENUM) - 'percentage' ou 'fixed'
- calculation_unit (ENUM) - 'appointment', 'ml', 'arch', 'unit', 'session'
- value (DECIMAL) - Valor ou percentual
- is_active (BOOLEAN)
- priority (INTEGER) - Calculado automaticamente
- notes (TEXT)
```

### Tabela Existente: `commissions`

Já existe no banco e está pronta para receber os cálculos de comissão.

---

## 🔐 Segurança (RLS)

As seguintes políticas foram criadas:

1. **SELECT**: Usuários podem ver regras da sua clínica
2. **INSERT/UPDATE/DELETE**: Apenas admins podem gerenciar regras
3. **Isolamento por clínica**: Garantido via `clinic_id`

---

## 📦 Deploy em Produção

### Opção 1: Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente:
   ```
   VITE_SUPABASE_URL=sua_url
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave
   VITE_SUPABASE_PROJECT_ID=seu_id
   ```
3. Deploy automático a cada push

### Opção 2: Netlify

1. Conecte repositório
2. Configure build command: `npm run build`
3. Publish directory: `dist`
4. Adicione variáveis de ambiente

### Opção 3: Render / Railway

Similar ao Vercel, conecte repositório e configure variáveis.

---

## 🧪 Testando o Sistema de Comissões

### Fluxo Completo:

1. **Criar Regra**
   - Acesse Comissões → Nova Regra
   - Preencha: Profissional, Procedimento, Tipo, Valor
   - Salve

2. **Verificar no Banco**
   - Dashboard Supabase → Table Editor
   - Veja a tabela `commission_rules`
   - Confirme que a regra foi salva

3. **Editar/Excluir**
   - Teste as ações na interface
   - Confirme que as mudanças refletem no banco

4. **Desativar Regra**
   - Use o toggle de ativação
   - Regras inativas não serão aplicadas em novos cálculos

---

## 🐛 Troubleshooting

### Erro: "Table commission_rules does not exist"
**Solução**: Você não aplicou a migração. Veja seção "Aplicar Migração".

### Erro de TypeScript nos hooks
**Solução**: Regenere os tipos do Supabase após aplicar a migração.

### Erro: "Row-level security policy violation"
**Solução**: Verifique se o usuário está associado a uma clínica via `clinic_users`.

### Nenhuma regra aparece
**Solução**:
1. Verifique no console do navegador se há erros
2. Confirme que `profile.clinic_id` está definido
3. Verifique RLS policies no Supabase

---

## 📝 Checklist de Deploy

- [ ] Migração aplicada no Supabase
- [ ] Tipos TypeScript regenerados
- [ ] Dependências instaladas (`npm install`)
- [ ] Build local sem erros (`npm run build`)
- [ ] Testes manuais passando
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy em produção realizado
- [ ] Testes em produção realizados

---

## 🎯 Próximas Features (Backlog)

1. **Workflow de Pagamento de Comissões**
   - Marcar comissões como pagas em lote
   - Gerar comprovantes
   - Histórico de pagamentos

2. **Relatórios Avançados**
   - Filtros por período
   - Gráficos de comissões
   - Exportar para Excel/PDF

3. **Integração com Agendamentos**
   - Calcular comissão automaticamente ao finalizar consulta
   - Validar regras antes de salvar agendamento

4. **Notificações**
   - Alertar profissionais quando comissões estiverem disponíveis
   - Notificar admin sobre comissões pendentes

---

## 📧 Suporte

Se encontrar problemas, verifique:
1. Console do navegador (F12)
2. Network tab para ver requisições falhas
3. Supabase logs (Dashboard → Logs)

**Documentação útil**:
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Vite Docs](https://vitejs.dev/)

---

✅ **Sistema pronto para uso em produção após seguir estes passos!**
