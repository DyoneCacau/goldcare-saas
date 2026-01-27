import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGenerateCommissions } from './useCommissions';
import { toast } from 'sonner';

export interface CompleteAppointmentInput {
  appointmentId: string;
  paymentMethod: 'cash' | 'credit' | 'debit' | 'pix' | 'voucher' | 'split';
  paidAmount?: number;
  description?: string;
}

/**
 * HOOK CRÍTICO: Finaliza atendimento → Cria pagamento → Gera comissões automaticamente
 * Este é o fluxo completo do sistema
 */
export function useCompleteAppointmentWithPayment() {
  const queryClient = useQueryClient();
  const { clinicId, user } = useAuth();
  const { mutateAsync: generateCommissions } = useGenerateCommissions();

  return useMutation({
    mutationFn: async (input: CompleteAppointmentInput) => {
      if (!clinicId) throw new Error('Clinic ID not found');
      if (!user) throw new Error('User not authenticated');

      const { appointmentId, paymentMethod, paidAmount, description } = input;

      // 1. Buscar dados do agendamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id(id, name, phone, email)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) throw appointmentError;
      if (!appointment) throw new Error('Agendamento não encontrado');

      // 2. Marcar agendamento como concluído
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      // 3. Criar pagamento
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          clinic_id: clinicId,
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          patient_name: appointment.patients?.name || 'Paciente',
          total_amount: appointment.procedure_value,
          paid_amount: paidAmount || appointment.procedure_value,
          payment_method: paymentMethod,
          status: 'confirmed',
          description: description || `Pagamento - ${appointment.procedure_name}`,
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 4. Gerar comissões automaticamente
      try {
        await generateCommissions({
          paymentId: payment.id,
          appointmentId: appointment.id,
          professionalId: appointment.professional_id,
          procedureName: appointment.procedure_name,
          procedureValue: appointment.procedure_value,
          sellerId: appointment.seller_id,
          receptionId: appointment.reception_id,
        });
      } catch (commissionError) {
        console.error('Erro ao gerar comissões:', commissionError);
        // Não bloquear o fluxo se a comissão falhar
        toast.warning('Pagamento confirmado, mas houve erro ao gerar comissões. Verifique manualmente.');
      }

      return {
        appointment,
        payment,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['payments', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['commissions', clinicId] });
      toast.success('Atendimento finalizado e comissões geradas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao finalizar atendimento: ' + error.message);
    },
  });
}
