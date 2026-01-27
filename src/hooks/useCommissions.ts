import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Commission {
  id: string;
  clinic_id: string;
  payment_id: string | null;
  appointment_id: string | null;
  beneficiary_id: string;
  beneficiary_type: 'professional' | 'seller' | 'reception';
  procedure_name: string | null;
  procedure_value: number | null;
  amount: number;
  percentage: number | null;
  base_value: number | null;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCommissions(filters?: {
  beneficiaryId?: string;
  status?: Commission['status'];
  startDate?: string;
  endDate?: string;
}) {
  const { clinicId } = useAuth();

  return useQuery({
    queryKey: ['commissions', clinicId, filters],
    queryFn: async () => {
      if (!clinicId) throw new Error('Clinic ID not found');

      let query = supabase
        .from('commissions')
        .select('*')
        .eq('clinic_id', clinicId);

      if (filters?.beneficiaryId) {
        query = query.eq('beneficiary_id', filters.beneficiaryId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Commission[];
    },
    enabled: !!clinicId,
  });
}

/**
 * FUNÇÃO CORE: Gerar comissões automaticamente ao confirmar pagamento
 */
export function useGenerateCommissions() {
  const queryClient = useQueryClient();
  const { clinicId, user } = useAuth();

  return useMutation({
    mutationFn: async ({
      paymentId,
      appointmentId,
      professionalId,
      procedureName,
      procedureValue,
      sellerId,
      receptionId,
    }: {
      paymentId: string;
      appointmentId?: string | null;
      professionalId: string;
      procedureName: string;
      procedureValue: number;
      sellerId?: string | null;
      receptionId?: string | null;
    }) => {
      if (!clinicId) throw new Error('Clinic ID not found');
      if (!user) throw new Error('User not authenticated');

      // 1. Buscar regras de comissão ativas
      const { data: rules, error: rulesError } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (rulesError) throw rulesError;

      const commissionsToCreate: any[] = [];

      // 2. Comissão do profissional (OBRIGATÓRIA)
      const professionalRule = rules?.find(
        (r: any) =>
          r.beneficiary_type === 'professional' &&
          (r.professional_id === professionalId || r.professional_id === 'all') &&
          (r.procedure === procedureName || r.procedure === 'all')
      );

      if (professionalRule) {
        const amount =
          professionalRule.calculation_type === 'percentage'
            ? (procedureValue * professionalRule.value) / 100
            : professionalRule.value;

        commissionsToCreate.push({
          clinic_id: clinicId,
          payment_id: paymentId,
          appointment_id: appointmentId,
          beneficiary_id: professionalId,
          beneficiary_type: 'professional',
          procedure_name: procedureName,
          procedure_value: procedureValue,
          amount,
          percentage:
            professionalRule.calculation_type === 'percentage'
              ? professionalRule.value
              : null,
          base_value: procedureValue,
          status: 'pending',
        });
      }

      // 3. Comissão do vendedor (se houver)
      if (sellerId) {
        const sellerRule = rules?.find(
          (r: any) =>
            r.beneficiary_type === 'seller' &&
            (r.beneficiary_id === sellerId || !r.beneficiary_id) &&
            (r.procedure === procedureName || r.procedure === 'all')
        );

        if (sellerRule) {
          const amount =
            sellerRule.calculation_type === 'percentage'
              ? (procedureValue * sellerRule.value) / 100
              : sellerRule.value;

          commissionsToCreate.push({
            clinic_id: clinicId,
            payment_id: paymentId,
            appointment_id: appointmentId,
            beneficiary_id: sellerId,
            beneficiary_type: 'seller',
            procedure_name: procedureName,
            procedure_value: procedureValue,
            amount,
            percentage:
              sellerRule.calculation_type === 'percentage' ? sellerRule.value : null,
            base_value: procedureValue,
            status: 'pending',
          });
        }
      }

      // 4. Comissão da recepção (se houver)
      if (receptionId) {
        const receptionRule = rules?.find(
          (r: any) =>
            r.beneficiary_type === 'reception' &&
            (r.beneficiary_id === receptionId || !r.beneficiary_id) &&
            (r.procedure === procedureName || r.procedure === 'all')
        );

        if (receptionRule) {
          const amount =
            receptionRule.calculation_type === 'percentage'
              ? (procedureValue * receptionRule.value) / 100
              : receptionRule.value;

          commissionsToCreate.push({
            clinic_id: clinicId,
            payment_id: paymentId,
            appointment_id: appointmentId,
            beneficiary_id: receptionId,
            beneficiary_type: 'reception',
            procedure_name: procedureName,
            procedure_value: procedureValue,
            amount,
            percentage:
              receptionRule.calculation_type === 'percentage'
                ? receptionRule.value
                : null,
            base_value: procedureValue,
            status: 'pending',
          });
        }
      }

      // 5. Inserir comissões (idempotência garantida pelo índice único)
      if (commissionsToCreate.length > 0) {
        const { data, error: commissionsError } = await supabase
          .from('commissions')
          .insert(commissionsToCreate)
          .select();

        if (commissionsError) {
          // Se erro for de constraint de unicidade, ignorar (comissões já existem)
          if (!commissionsError.message.includes('unique')) {
            throw commissionsError;
          }
        }

        return {
          commissionsCreated: data?.length || 0,
          commissions: data || [],
        };
      }

      return {
        commissionsCreated: 0,
        commissions: [],
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['commissions', clinicId] });
      if (result.commissionsCreated > 0) {
        toast.success(
          `${result.commissionsCreated} comissão(ões) gerada(s) automaticamente!`
        );
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao gerar comissões: ' + error.message);
    },
  });
}
