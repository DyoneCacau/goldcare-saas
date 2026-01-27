import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Payment, PaymentMethod, PaymentStatus } from '@/types/payment';

/**
 * Hook to fetch payments for a clinic
 */
export function usePayments(filters?: {
  appointmentId?: string;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}) {
  const { profile } = useAuth();
  const clinicId = profile?.clinic_id;

  return useQuery({
    queryKey: ['payments', clinicId, filters],
    queryFn: async () => {
      if (!clinicId) throw new Error('Clinic ID not found');

      let query = supabase
        .from('payments')
        .select('*')
        .eq('clinic_id', clinicId);

      if (filters?.appointmentId) {
        query = query.eq('appointment_id', filters.appointmentId);
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
      return (data || []).map(transformPaymentFromDB);
    },
    enabled: !!clinicId,
  });
}

/**
 * Hook to create a payment
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'remainingAmount' | 'paidAmount'>) => {
      if (!profile?.clinic_id) {
        throw new Error('Clinic ID not found');
      }

      const paymentData = transformPaymentToDB({
        ...payment,
        clinicId: profile.clinic_id,
        paidAmount: 0, // Inicia como 0
      });

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return transformPaymentFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao registrar pagamento: ' + error.message);
    },
  });
}

/**
 * Hook to confirm a payment (CRITICAL - TRIGGERS COMMISSION GENERATION)
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      paymentId,
      paidAmount
    }: {
      paymentId: string;
      paidAmount?: number;
    }) => {
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      const finalPaidAmount = paidAmount !== undefined ? paidAmount : payment.total_amount;

      const { data, error } = await supabase
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

      if (error) throw error;
      return transformPaymentFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Pagamento confirmado! Comissões serão geradas.');
    },
    onError: (error: Error) => {
      toast.error('Erro ao confirmar pagamento: ' + error.message);
    },
  });
}

/**
 * Hook to cancel a payment
 */
export function useCancelPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'cancelled',
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return transformPaymentFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Pagamento cancelado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cancelar pagamento: ' + error.message);
    },
  });
}

/**
 * Transform database record (snake_case) to Payment (camelCase)
 */
function transformPaymentFromDB(data: any): Payment {
  return {
    id: data.id,
    clinicId: data.clinic_id,
    appointmentId: data.appointment_id,
    patientId: data.patient_id,
    patientName: data.patient_name,
    totalAmount: parseFloat(data.total_amount),
    paidAmount: parseFloat(data.paid_amount),
    remainingAmount: parseFloat(data.remaining_amount || 0),
    paymentMethod: data.payment_method,
    status: data.status,
    description: data.description,
    confirmedAt: data.confirmed_at,
    confirmedBy: data.confirmed_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform Payment (camelCase) to database record (snake_case)
 */
function transformPaymentToDB(payment: Partial<Payment>): any {
  const dbRecord: any = {};

  if (payment.clinicId !== undefined) dbRecord.clinic_id = payment.clinicId;
  if (payment.appointmentId !== undefined) dbRecord.appointment_id = payment.appointmentId;
  if (payment.patientId !== undefined) dbRecord.patient_id = payment.patientId;
  if (payment.patientName !== undefined) dbRecord.patient_name = payment.patientName;
  if (payment.totalAmount !== undefined) dbRecord.total_amount = payment.totalAmount;
  if (payment.paidAmount !== undefined) dbRecord.paid_amount = payment.paidAmount;
  if (payment.paymentMethod !== undefined) dbRecord.payment_method = payment.paymentMethod;
  if (payment.status !== undefined) dbRecord.status = payment.status;
  if (payment.description !== undefined) dbRecord.description = payment.description;
  if (payment.confirmedAt !== undefined) dbRecord.confirmed_at = payment.confirmedAt;
  if (payment.confirmedBy !== undefined) dbRecord.confirmed_by = payment.confirmedBy;

  return dbRecord;
}
