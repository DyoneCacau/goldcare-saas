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
 * Criar nova clínica (SuperAdmin ou usuário dentro do limite do plano)
 */
export function useCreateClinic() {
  const queryClient = useQueryClient();
  const { isSuperAdmin, user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateClinicInput) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se pode criar (via função SQL)
      if (!isSuperAdmin) {
        const { data: canCreate, error: checkError } = await supabase
          .rpc('can_user_create_clinic', { _user_id: user.id });

        if (checkError) throw checkError;
        if (!canCreate) {
          throw new Error('Limite de clínicas atingido para seu plano. Entre em contato com o suporte para upgrade.');
        }
      }

      // Criar clínica
      const clinicData = {
        ...input,
        owner_user_id: user.id,
        is_active: true,
      };

      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .insert(clinicData)
        .select()
        .single();

      if (clinicError) throw clinicError;

      // Se não for superadmin, criar assinatura trial para a nova clínica
      if (!isSuperAdmin && clinic) {
        // Buscar plano trial
        const { data: trialPlan } = await supabase
          .from('plans')
          .select('id')
          .eq('slug', 'trial')
          .single();

        // Criar assinatura trial
        const trialEnds = new Date();
        trialEnds.setDate(trialEnds.getDate() + 7);
        const nextBilling = new Date(trialEnds);
        nextBilling.setDate(nextBilling.getDate() + 1);

        await supabase.from('subscriptions').insert({
          clinic_id: clinic.id,
          plan_id: trialPlan?.id || null,
          status: 'trial',
          trial_ends_at: trialEnds.toISOString(),
          payment_status: 'pending',
          current_period_start: new Date().toISOString(),
          current_period_end: trialEnds.toISOString(),
          billing_cycle: 'monthly',
          auto_renew: false, // Trial não renova automaticamente
          next_billing_date: nextBilling.toISOString(),
        });

        // Vincular usuário à nova clínica
        await supabase.from('clinic_users').insert({
          clinic_id: clinic.id,
          user_id: user.id,
          is_owner: true,
        });
      }

      return clinic as Clinic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['my-clinic'] });
      queryClient.invalidateQueries({ queryKey: ['user-clinics'] });
      toast.success('Clínica criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar clínica: ' + error.message);
    },
  });
}

/**
 * Hook para usuário ver TODAS as suas clínicas (owner)
 */
export function useUserClinics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-clinics', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('clinics')
        .select(`
          *,
          subscriptions(
            id,
            status,
            trial_ends_at,
            plans(id, name, slug, max_clinics)
          )
        `)
        .eq('owner_user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Clinic[];
    },
    enabled: !!user,
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
