import { useState, useMemo } from 'react';
import {
  Plus,
  Settings,
  BarChart3,
  Filter,
  Building2,
  Percent,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { CommissionRulesList } from '@/components/commissions/CommissionRulesList';
import { CommissionRuleForm } from '@/components/commissions/CommissionRuleForm';
import { CommissionReport } from '@/components/commissions/CommissionReport';
import { CommissionRule } from '@/types/commission';
import { mockCommissionCalculations } from '@/data/mockCommissions';
import { FeatureButton } from '@/components/subscription/FeatureButton';
import {
  useCommissionRules,
  useCreateCommissionRule,
  useUpdateCommissionRule,
  useDeleteCommissionRule,
  useToggleCommissionRule
} from '@/hooks/useCommissionRules';
import { useAuth } from '@/hooks/useAuth';

export default function Commissions() {
  const { profile } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [activeTab, setActiveTab] = useState('rules');

  // Fetch commission rules from Supabase
  const { data: rules, isLoading, error } = useCommissionRules(profile?.clinic_id);
  const createRule = useCreateCommissionRule();
  const updateRule = useUpdateCommissionRule();
  const deleteRule = useDeleteCommissionRule();
  const toggleRule = useToggleCommissionRule();

  const handleSaveRule = async (ruleData: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt' | 'priority'>) => {
    if (editingRule) {
      // Update existing rule
      await updateRule.mutateAsync({
        id: editingRule.id,
        ...ruleData,
      });
    } else {
      // Create new rule
      await createRule.mutateAsync(ruleData);
    }
    setEditingRule(null);
    setFormOpen(false);
  };

  const handleEditRule = (rule: CommissionRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    await deleteRule.mutateAsync(ruleId);
  };

  const handleToggleActive = async (ruleId: string) => {
    const rule = rules?.find((r) => r.id === ruleId);
    if (rule) {
      await toggleRule.mutateAsync({
        id: ruleId,
        isActive: !rule.isActive,
      });
    }
  };

  const handleOpenNewRule = () => {
    setEditingRule(null);
    setFormOpen(true);
  };

  // Stats
  const stats = useMemo(() => {
    if (!rules) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        percentage: 0,
        fixed: 0,
      };
    }

    const activeRules = rules.filter((r) => r.isActive).length;
    const percentageRules = rules.filter((r) => r.calculationType === 'percentage').length;
    const fixedRules = rules.filter((r) => r.calculationType === 'fixed').length;

    return {
      total: rules.length,
      active: activeRules,
      inactive: rules.length - activeRules,
      percentage: percentageRules,
      fixed: fixedRules,
    };
  }, [rules]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <p className="text-destructive">Erro ao carregar regras de comissão</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comissões</h1>
            <p className="text-sm text-muted-foreground">
              Configure regras de comissionamento por profissional, procedimento e dia
            </p>
          </div>
          <FeatureButton feature="comissoes" onClick={handleOpenNewRule}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Regra
          </FeatureButton>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Regras</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <Settings className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                  <p className="text-xl font-bold text-emerald-600">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inativas</p>
                  <p className="text-xl font-bold text-muted-foreground">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Percent className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Percentuais</p>
                  <p className="text-xl font-bold text-blue-600">{stats.percentage}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Fixo</p>
                  <p className="text-xl font-bold text-amber-600">{stats.fixed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="rules" className="gap-2">
              <Settings className="h-4 w-4" />
              Regras
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatório de Comissões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Regras de Comissão</CardTitle>
              </CardHeader>
              <CardContent>
                <CommissionRulesList
                  rules={rules || []}
                  onEdit={handleEditRule}
                  onDelete={handleDeleteRule}
                  onToggleActive={handleToggleActive}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="mt-6">
            <CommissionReport calculations={mockCommissionCalculations} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Form Dialog */}
      <CommissionRuleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSaveRule}
        editingRule={editingRule}
        selectedClinicId={profile?.clinic_id}
      />
    </MainLayout>
  );
}
