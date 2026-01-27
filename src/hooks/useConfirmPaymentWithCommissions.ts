import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateCommissionsForPayment } from '@/services/paymentCommissionService';
import { useAuth } from './useAuth';

interface ConfirmPaymentParams {
  paymentId: string;
  paidAmount?: number;

  // Appointment data (required for commission generation)
  appointmentId?: string;
  professionalId?: string;
  procedure?: string;
  appointmentDate?: Date;
  sellerId?: string;
  receptionistId?: string;
}

interface ConfirmPaymentResult {
  payment: any;
  commissions: Array<{
    id: string;
    beneficiaryId: string;
    beneficiaryType: 'professional' | 'seller' | 'reception';
    amount: number;
  }>;
  totalCommission: number;
}

/**
 * Hook to confirm payment and automatically generate commissions
 * THIS IS THE CORE OF THE COMMISSION SYSTEM
 */
export function useConfirmPaymentWithCommissions() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (params: ConfirmPaymentParams): Promise<ConfirmPaymentResult> => {
      const {
        paymentId,
        paidAmount,
        appointmentId,
        professionalId,
        procedure,
        appointmentDate,
        sellerId,
        receptionistId,
      } = params;

      // STEP 1: Get payment details
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      const finalPaidAmount = paidAmount !== undefined ? paidAmount : payment.total_amount;

      // STEP 2: Confirm payment
      const { data: confirmedPayment, error: confirmError } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          paid_amount: finalPaidAmount,
          confirmed_at: new Date().toISOString(),
          confirmed_by: profile?.id || null,
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (confirmError) throw confirmError;

      // STEP 3: Generate commissions (if appointment data is provided)
      let commissions: any[] = [];
      let totalCommission = 0;

      if (appointmentId && professionalId && procedure && appointmentDate) {
        try {
          commissions = await generateCommissionsForPayment({
            paymentId,
            clinicId: profile?.clinic_id || payment.clinic_id,
            appointmentId,
            professionalId,
            procedure,
            appointmentDate,
            sellerId,
            receptionistId,
          });

          totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);
        } catch (error) {
          console.error('Error generating commissions:', error);
          // Don't fail the payment confirmation if commissions fail
          toast.warning('Pagamento confirmado, mas houve erro ao gerar comissões. Verifique manualmente.');
        }
      } else {
        console.warn('Appointment data not provided, skipping commission generation');
      }

      return {
        payment: confirmedPayment,
        commissions,
        totalCommission,
      };
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-summary'] });

      // Show success message
      const commissionCount = result.commissions.length;
      const commissionInfo =
        result.totalCommission > 0
          ? ` | Comissões geradas: R$ ${result.totalCommission.toFixed(2)} (${commissionCount} beneficiário${
              commissionCount > 1 ? 's' : ''
            })`
          : '';

      toast.success(`Pagamento confirmado!${commissionInfo}`, {
        duration: 5000,
      });

      // Show breakdown if multiple commissions
      if (commissionCount > 1) {
        const breakdown = result.commissions
          .map((c) => {
            const typeLabel = {
              professional: 'Profissional',
              seller: 'Vendedor',
              reception: 'Recepção',
            }[c.beneficiaryType];
            return `${typeLabel}: R$ ${c.amount.toFixed(2)}`;
          })
          .join(' | ');

        toast.info(`Detalhamento: ${breakdown}`, {
          duration: 7000,
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error confirming payment:', error);
      toast.error('Erro ao confirmar pagamento: ' + error.message, {
        duration: 5000,
      });
    },
  });
}
