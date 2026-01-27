import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  procedure_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  procedure_name: string;
  procedure_value: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  lead_source: 'instagram' | 'whatsapp' | 'referral' | 'paid_traffic' | 'website' | 'other' | null;
  seller_id: string | null;
  reception_id: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  patient?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  professional?: {
    id: string;
    name: string;
    specialty: string;
    cro: string;
  };
}

export interface CreateAppointmentInput {
  patient_id: string;
  professional_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  procedure_name: string;
  procedure_value: number;
  procedure_id?: string;
  status?: Appointment['status'];
  lead_source?: Appointment['lead_source'];
  seller_id?: string;
  reception_id?: string;
  notes?: string;
}

export function useAppointments(filters?: {
  date?: string;
  professionalId?: string;
  status?: Appointment['status'];
  startDate?: string;
  endDate?: string;
}) {
  const { clinicId } = useAuth();

  return useQuery({
    queryKey: ['appointments', clinicId, filters],
    queryFn: async () => {
      if (!clinicId) throw new Error('Clinic ID not found');

      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id(id, name, phone, email),
          professionals:professional_id(id, name, specialty, cro)
        `)
        .eq('clinic_id', clinicId);

      if (filters?.date) {
        query = query.eq('appointment_date', filters.date);
      }
      if (filters?.professionalId) {
        query = query.eq('professional_id', filters.professionalId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('appointment_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('appointment_date', filters.endDate);
      }

      query = query.order('appointment_date', { ascending: true })
                   .order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Appointment[];
    },
    enabled: !!clinicId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { clinicId, user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      if (!clinicId) throw new Error('Clinic ID not found');
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...input,
          clinic_id: clinicId,
          created_by: user.id,
          status: input.status || 'pending',
        })
        .select(`
          *,
          patients:patient_id(id, name, phone, email),
          professionals:professional_id(id, name, specialty, cro)
        `)
        .single();

      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', clinicId] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar agendamento: ' + error.message);
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { clinicId } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(input)
        .eq('id', id)
        .select(`
          *,
          patients:patient_id(id, name, phone, email),
          professionals:professional_id(id, name, specialty, cro)
        `)
        .single();

      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', clinicId] });
      toast.success('Agendamento atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar agendamento: ' + error.message);
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  const { clinicId } = useAuth();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId)
        .select(`
          *,
          patients:patient_id(id, name, phone, email),
          professionals:professional_id(id, name, specialty, cro)
        `)
        .single();

      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', clinicId] });
      toast.success('Atendimento finalizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao finalizar atendimento: ' + error.message);
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  const { clinicId } = useAuth();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', clinicId] });
      toast.success('Agendamento cancelado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cancelar agendamento: ' + error.message);
    },
  });
}
