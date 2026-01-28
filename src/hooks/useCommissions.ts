import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { generateCommissionsForPayment } from '@/services/paymentCommissionService';

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
 * FUNÇÃO CORE (HOOK): Gerar comissões automaticamente ao confirmar pagamento
 * Wrapper fino em cima de generateCommissionsForPayment (single source of truth)
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
      appointmentDate,
      sellerId,
      receptionId,
    }: {
      paymentId: string;
      appointmentId?: string | null;
      professionalId: string;
      procedureName: string;
      // Usamos o valor pago / total do próprio pagamento dentro do service
      appointmentDate: Date;
      sellerId?: string | null;
      receptionId?: string | null;
    }) => {
      if (!clinicId) throw new Error('Clinic ID not found');
      if (!user) throw new Error('User not authenticated');

      const results = await generateCommissionsForPayment({
        paymentId,
        clinicId,
        appointmentId: appointmentId || undefined,
        professionalId,
        procedure: procedureName,
        appointmentDate,
        sellerId: sellerId || undefined,
        receptionistId: receptionId || undefined,
      });

      return {
        commissionsCreated: results.length,
        commissions: results,
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
