import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { isPast } from 'date-fns';

interface Plan {
  id: string;
  name: string;
  slug: string;
  features: string[];
}

interface Subscription {
  id: string;
  status: string;
  trial_ends_at: string | null;
  billing_cycle: 'monthly' | 'yearly' | null;
  auto_renew: boolean;
  next_billing_date: string | null;
  last_billing_date: string | null;
  payment_method: string | null;
  plan: Plan | null;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  isTrialExpired: boolean;
  isBlocked: boolean;
  allowedFeatures: string[];
  hasFeature: (feature: string) => boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Mapeamento de rotas para features (slugs padronizados)
const ROUTE_FEATURE_MAP: Record<string, string> = {
  '/': 'dashboard',
  '/agenda': 'agenda',
  '/pacientes': 'pacientes',
  '/profissionais': 'profissionais',
  '/financeiro': 'financeiro',
  '/comissoes': 'comissoes',
  '/estoque': 'estoque',
  '/relatorios': 'relatorios',
  '/ponto': 'ponto',
  '/administracao': 'administracao',
  '/termos': 'termos',
  '/configuracoes': 'configuracoes',
};

// Features que sempre estão disponíveis (não dependem do plano)
const ALWAYS_AVAILABLE = ['dashboard', 'configuracoes'];

// Lista completa de features do sistema para referência
export const ALL_FEATURES = [
  'dashboard',
  'agenda',
  'pacientes',
  'profissionais',
  'financeiro',
  'comissoes',
  'estoque',
  'relatorios',
  'ponto',
  'administracao',
  'termos',
  'configuracoes',
] as const;

export type Feature = typeof ALL_FEATURES[number];

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user || isSuperAdmin) {
      setIsLoading(false);
      return;
    }

    try {
      // Buscar a clínica do usuário
      const { data: clinicUser } = await supabase
        .from('clinic_users')
        .select('clinic_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!clinicUser) {
        setIsLoading(false);
        return;
      }

      // Buscar assinatura da clínica
      const { data: subData } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          trial_ends_at,
          billing_cycle,
          auto_renew,
          next_billing_date,
          last_billing_date,
          payment_method,
          plans (
            id,
            name,
            slug,
            features,
            max_clinics,
            price_monthly,
            price_yearly
          )
        `)
        .eq('clinic_id', clinicUser.clinic_id)
        .maybeSingle();

      if (subData) {
        const plan = subData.plans as unknown as Plan | null;
        setSubscription({
          id: subData.id,
          status: subData.status,
          trial_ends_at: subData.trial_ends_at,
          billing_cycle: subData.billing_cycle as 'monthly' | 'yearly' | null,
          auto_renew: subData.auto_renew ?? true,
          next_billing_date: subData.next_billing_date,
          last_billing_date: subData.last_billing_date,
          payment_method: subData.payment_method,
          plan: plan ? {
            ...plan,
            features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as unknown as string || '[]')
          } : null,
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  useEffect(() => {
    fetchSubscription();
  }, [user, isSuperAdmin]);

  // Verificar se trial expirou
  const isTrialExpired = 
    subscription?.status === 'trial' && 
    subscription?.trial_ends_at && 
    isPast(new Date(subscription.trial_ends_at));

  // Verificar se acesso está bloqueado
  const isBlocked = 
    !isSuperAdmin && 
    subscription !== null && 
    (isTrialExpired || 
     subscription.status === 'suspended' || 
     subscription.status === 'expired' ||
     subscription.status === 'cancelled');

  // Features permitidas baseadas no plano
  const allowedFeatures = isSuperAdmin 
    ? Object.values(ROUTE_FEATURE_MAP) 
    : [
        ...ALWAYS_AVAILABLE,
        ...(subscription?.plan?.features || []),
      ];

  const hasFeature = (feature: string): boolean => {
    if (isSuperAdmin) return true;
    if (ALWAYS_AVAILABLE.includes(feature)) return true;
    return allowedFeatures.includes(feature);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        isTrialExpired,
        isBlocked,
        allowedFeatures,
        hasFeature,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export { ROUTE_FEATURE_MAP };
