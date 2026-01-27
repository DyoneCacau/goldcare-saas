import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  cpf: string | null;
  phone: string;
  email: string | null;
  birth_date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  allergies: string[];
  medical_conditions: string[];
  medications: string[];
  clinical_notes: string | null;
  status: 'active' | 'inactive';
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientInput {
  name: string;
  phone: string;
  cpf?: string;
  email?: string;
  birth_date?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  allergies?: string[];
  medical_conditions?: string[];
  medications?: string[];
  clinical_notes?: string;
}

export function usePatients() {
  const { clinicId, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: patients, isLoading, error } = useQuery({
    queryKey: ['patients', clinicId],
    queryFn: async () => {
      if (!clinicId) throw new Error('Clinic ID not found');

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!clinicId,
  });

  const createPatient = useMutation({
    mutationFn: async (input: CreatePatientInput) => {
      if (!clinicId) throw new Error('Clinic ID not found');
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('patients')
        .insert({
          ...input,
          clinic_id: clinicId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', clinicId] });
      toast.success('Paciente criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar paciente: ' + error.message);
    },
  });

  const updatePatient = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Patient> & { id: string }) => {
      const { data, error } = await supabase
        .from('patients')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', clinicId] });
      toast.success('Paciente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar paciente: ' + error.message);
    },
  });

  const deletePatient = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from('patients')
        .update({ is_active: false, status: 'inactive' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', clinicId] });
      toast.success('Paciente removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover paciente: ' + error.message);
    },
  });

  return {
    patients: patients || [],
    isLoading,
    error,
    createPatient,
    updatePatient,
    deletePatient,
  };
}
