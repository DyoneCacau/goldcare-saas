import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AgendaAppointment } from '@/types/agenda';
import { PaymentMethod } from '@/types/payment';
import { useAuth } from './useAuth';

interface CompleteAppointmentParams {
  appointment: AgendaAppointment;
  serviceValue: number;
  paymentMethod: PaymentMethod;
  quantity?: number;
  sellerId?: string;
  receptionistId?: string;
}

interface CompleteAppointmentResult {
  paymentId: string;
  serviceValue: number;
  message: string;
}

/**
 * Hook to complete an appointment and CREATE PAYMENT (NO COMMISSION YET)
 * Commissions will ONLY be generated when payment is CONFIRMED
 */
export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (params: CompleteAppointmentParams): Promise<CompleteAppointmentResult> => {
      const {
        appointment,
        serviceValue,
        paymentMethod,
      } = params;

      if (!profile?.clinic_id) {
        throw new Error('Clinic ID not found');
      }

      // Create payment record with status 'pending'
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          clinic_id: profile.clinic_id,
          appointment_id: appointment.id,
          patient_id: appointment.patientId,
          patient_name: appointment.patientName,
          total_amount: serviceValue,
          paid_amount: 0,
          payment_method: paymentMethod,
          status: 'pending',
          description: `${appointment.procedure} - ${appointment.patientName}`,
        })
        .select()
        .single();

      if (error) {
        throw new Error('Erro ao criar pagamento: ' + error.message);
      }

      return {
        paymentId: payment.id,
        serviceValue,
        message: 'Atendimento finalizado. Confirme o pagamento para gerar as comissões.',
      };
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });

      // Show success message with IMPORTANT INFO
      toast.success(
        `Atendimento finalizado! Valor: R$ ${result.serviceValue.toFixed(2)}`,
        {
          duration: 4000,
        }
      );

      toast.info(
        '⚠️ Comissões serão geradas SOMENTE após confirmar o pagamento.',
        {
          duration: 6000,
        }
      );
    },
    onError: (error: Error) => {
      console.error('Error completing appointment:', error);
      toast.error('Erro ao finalizar atendimento: ' + error.message, {
        duration: 5000,
      });
    },
  });
}
