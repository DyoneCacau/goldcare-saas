import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CommissionRule, calculateAutoPriority } from '@/types/commission';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

/**
 * Hook to fetch all commission rules for a clinic
 */
export function useCommissionRules(clinicId?: string) {
  const { profile } = useAuth();
  const effectiveClinicId = clinicId || profile?.clinic_id;

  return useQuery({
    queryKey: ['commission-rules', effectiveClinicId],
    queryFn: async () => {
      if (!effectiveClinicId) {
        throw new Error('Clinic ID not found');
      }

      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform snake_case to camelCase
      return (data || []).map(transformCommissionRuleFromDB);
    },
    enabled: !!effectiveClinicId,
  });
}

/**
 * Hook to fetch a single commission rule
 */
export function useCommissionRule(ruleId?: string) {
  return useQuery({
    queryKey: ['commission-rule', ruleId],
    queryFn: async () => {
      if (!ruleId) throw new Error('Rule ID required');

      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (error) throw error;
      return transformCommissionRuleFromDB(data);
    },
    enabled: !!ruleId,
  });
}

/**
 * Hook to create a new commission rule
 */
export function useCreateCommissionRule() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (rule: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt' | 'priority'>) => {
      if (!profile?.clinic_id) {
        throw new Error('Clinic ID not found');
      }

      // Calculate automatic priority
      const priority = calculateAutoPriority(rule);

      const ruleData = transformCommissionRuleToDB({
        ...rule,
        clinicId: profile.clinic_id,
        priority,
      });

      const { data, error } = await supabase
        .from('commission_rules')
        .insert(ruleData)
        .select()
        .single();

      if (error) throw error;
      return transformCommissionRuleFromDB(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast.success('Regra de comissão criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar regra de comissão: ' + error.message);
    },
  });
}

/**
 * Hook to update a commission rule
 */
export function useUpdateCommissionRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommissionRule> & { id: string }) => {
      // Recalculate priority if relevant fields changed
      let priority = updates.priority;
      if (
        updates.professionalId !== undefined ||
        updates.procedure !== undefined ||
        updates.dayOfWeek !== undefined ||
        updates.beneficiaryId !== undefined
      ) {
        priority = calculateAutoPriority(updates);
      }

      const ruleData = transformCommissionRuleToDB({ ...updates, priority });

      const { data, error } = await supabase
        .from('commission_rules')
        .update(ruleData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformCommissionRuleFromDB(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      queryClient.invalidateQueries({ queryKey: ['commission-rule', data.id] });
      toast.success('Regra de comissão atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar regra de comissão: ' + error.message);
    },
  });
}

/**
 * Hook to delete a commission rule
 */
export function useDeleteCommissionRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast.success('Regra de comissão excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir regra de comissão: ' + error.message);
    },
  });
}

/**
 * Hook to toggle rule active status
 */
export function useToggleCommissionRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('commission_rules')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformCommissionRuleFromDB(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      queryClient.invalidateQueries({ queryKey: ['commission-rule', data.id] });
      toast.success(data.isActive ? 'Regra ativada!' : 'Regra desativada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao alterar status da regra: ' + error.message);
    },
  });
}

/**
 * Transform database record (snake_case) to CommissionRule (camelCase)
 */
function transformCommissionRuleFromDB(data: any): CommissionRule {
  return {
    id: data.id,
    clinicId: data.clinic_id,
    professionalId: data.professional_id,
    beneficiaryType: data.beneficiary_type,
    beneficiaryId: data.beneficiary_id,
    beneficiaryName: data.beneficiary_name,
    procedure: data.procedure,
    dayOfWeek: data.day_of_week,
    calculationType: data.calculation_type,
    calculationUnit: data.calculation_unit,
    value: parseFloat(data.value),
    isActive: data.is_active,
    priority: data.priority,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform CommissionRule (camelCase) to database record (snake_case)
 */
function transformCommissionRuleToDB(rule: Partial<CommissionRule>): any {
  const dbRecord: any = {};

  if (rule.clinicId !== undefined) dbRecord.clinic_id = rule.clinicId;
  if (rule.professionalId !== undefined) dbRecord.professional_id = rule.professionalId;
  if (rule.beneficiaryType !== undefined) dbRecord.beneficiary_type = rule.beneficiaryType;
  if (rule.beneficiaryId !== undefined) dbRecord.beneficiary_id = rule.beneficiaryId;
  if (rule.beneficiaryName !== undefined) dbRecord.beneficiary_name = rule.beneficiaryName;
  if (rule.procedure !== undefined) dbRecord.procedure = rule.procedure;
  if (rule.dayOfWeek !== undefined) dbRecord.day_of_week = rule.dayOfWeek;
  if (rule.calculationType !== undefined) dbRecord.calculation_type = rule.calculationType;
  if (rule.calculationUnit !== undefined) dbRecord.calculation_unit = rule.calculationUnit;
  if (rule.value !== undefined) dbRecord.value = rule.value;
  if (rule.isActive !== undefined) dbRecord.is_active = rule.isActive;
  if (rule.priority !== undefined) dbRecord.priority = rule.priority;
  if (rule.notes !== undefined) dbRecord.notes = rule.notes;

  return dbRecord;
}
