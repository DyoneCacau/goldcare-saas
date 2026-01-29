import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Professional {
  id: string;
  clinic_id: string;
  user_id: string | null;
  name: string;
  specialty: string;
  cro: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  hire_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfessionals() {
  const { clinicId } = useAuth();

  return useQuery({
    queryKey: ['professionals', clinicId],
    queryFn: async () => {
      if (!clinicId) throw new Error('Clinic ID not found');

      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return (data || []) as Professional[];
    },
    enabled: !!clinicId,
  });
}
