import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Clinic {
  id: string;
  name: string;
  slug: string | null;
  email: string;
  phone: string | null;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
  owner_user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClinicInput {
  name: string;
  email: string;
  phone?: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

/**
 * Hook para Super Admin ver TODAS as clínicas (sem filtro clinic_id)
 */
export function useAllClinics() {
  const { isSuperAdmin } = useAuth();

  return useQuery({
    queryKey: ['all-clinics'],
    queryFn: async () => {
      if (!isSuperAdmin) throw new Error('Apenas SuperAdmin pode ver todas as clínicas');

      const { data, error } = await supabase
        .from('clinics')
        .select(`
          *,
          subscriptions(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Clinic[];
    },
    enabled: isSuperAdmin,
  });
}

/**
 * Hook para usuário ver apenas sua clínica
 */
export function useMyClinic() {
  const { clinicId } = useAuth();

  return useQuery({
    queryKey: ['my-clinic', clinicId],
    queryFn: async () => {
      if (!clinicId) throw new Error('Clinic ID not found');

      const { data, error } = await supabase
        .from('clinics')
        .select(`
          *,
          subscriptions(*)
        `)
        .eq('id', clinicId)
        .single();

      if (error) throw error;
      return data as Clinic;
    },
    enabled: !!clinicId,
  });
}

/**
 * Criar nova clínica (apenas SuperAdmin)
 */
export function useCreateClinic() {
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateClinicInput) => {
      if (!isSuperAdmin) throw new Error('Apenas SuperAdmin pode criar clínicas');

      const { data, error } = await supabase
        .from('clinics')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Clinic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-clinics'] });
      toast.success('Clínica criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar clínica: ' + error.message);
    },
  });
}

/**
 * Atualizar clínica
 */
export function useUpdateClinic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Clinic> & { id: string }) => {
      const { data, error } = await supabase
        .from('clinics')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Clinic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['my-clinic'] });
      toast.success('Clínica atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar clínica: ' + error.message);
    },
  });
}

/**
 * Ativar/desativar clínica (apenas SuperAdmin)
 */
export function useToggleClinicStatus() {
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuth();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (!isSuperAdmin) throw new Error('Apenas SuperAdmin pode ativar/desativar clínicas');

      const { data, error } = await supabase
        .from('clinics')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Clinic;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-clinics'] });
      toast.success(`Clínica ${data.is_active ? 'ativada' : 'desativada'} com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao alterar status da clínica: ' + error.message);
    },
  });
}
