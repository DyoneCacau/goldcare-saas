import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, CreditCard, Calendar, Check, Loader2, AlertTriangle, Crown, Sparkles, Zap, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { RecurringPaymentsSettings } from '@/components/subscription/RecurringPaymentsSettings';

interface ClinicData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
}

interface PlanDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  features: string[];
}

const featureLabels: Record<string, string> = {
  agenda: 'Agenda de Consultas',
  pacientes: 'Gestão de Pacientes',
  pacientes_basico: 'Pacientes (Básico)',
  financeiro: 'Módulo Financeiro Completo',
  financeiro_basico: 'Financeiro Básico',
  relatorios: 'Relatórios Avançados',
  profissionais: 'Gestão de Profissionais',
  comissoes: 'Sistema de Comissões',
  estoque: 'Controle de Estoque',
  termos: 'Termos e Documentos',
  ponto: 'Controle de Ponto',
  multi_clinica: 'Multi-Clínicas',
};

const planIcons: Record<string, React.ReactNode> = {
  trial: <Calendar className="h-5 w-5" />,
  basico: <Zap className="h-5 w-5" />,
  profissional: <Sparkles className="h-5 w-5" />,
  premium: <Crown className="h-5 w-5" />,
};

export default function Settings() {
  const { user } = useAuth();
  const { subscription, refreshSubscription } = useSubscription();
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Get clinic_id for current user
      const { data: clinicUser } = await supabase
        .from('clinic_users')
        .select('clinic_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!clinicUser) {
        setIsLoading(false);
        return;
      }

      // Fetch clinic data
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicUser.clinic_id)
        .maybeSingle();

      if (clinicData) {
        setClinic(clinicData);
        setFormData({
          name: clinicData.name || '',
          email: clinicData.email || '',
          phone: clinicData.phone || '',
          cnpj: clinicData.cnpj || '',
          address: clinicData.address || '',
          city: clinicData.city || '',
          state: clinicData.state || '',
          zip_code: clinicData.zip_code || '',
        });
      }

      // Fetch subscription with plan details
      const { data: subData } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (
            id,
            name,
            slug,
            description,
            price_monthly,
            features
          )
        `)
        .eq('clinic_id', clinicUser.clinic_id)
        .maybeSingle();

      if (subData?.plans) {
        const planData = subData.plans as unknown as PlanDetails;
        setPlan({
          ...planData,
          features: Array.isArray(planData.features) 
            ? planData.features 
            : JSON.parse(planData.features as unknown as string || '[]')
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clinic) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          cnpj: formData.cnpj || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clinic.id);

      if (error) throw error;

      toast.success('Dados atualizados com sucesso!');
      fetchData();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (!subscription) return null;
    
    const status = subscription.status;
    const isTrialExpired = status === 'trial' && subscription.trial_ends_at && isPast(new Date(subscription.trial_ends_at));

    if (isTrialExpired) {
      return <Badge variant="destructive">Trial Expirado</Badge>;
    }

    switch (status) {
      case 'trial':
        return <Badge variant="secondary">Trial</Badge>;
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspenso</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelado</Badge>;
      case 'expired':
        return <Badge variant="outline">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os dados da sua clínica e visualize informações do seu plano
          </p>
        </div>

        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Meu Plano</span>
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger value="clinic" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Dados da Clínica</span>
            </TabsTrigger>
          </TabsList>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Current Plan Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center",
                      plan?.slug === 'premium' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                    )}>
                      {plan ? planIcons[plan.slug] || <CreditCard className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{plan?.name || 'Sem Plano'}</CardTitle>
                      {plan?.description && (
                        <CardDescription>{plan.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  {getStatusBadge()}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Info */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold mt-1 capitalize">
                      {subscription?.status === 'trial' ? 'Período de Teste' : subscription?.status || '-'}
                    </p>
                  </div>
                  
                  {subscription?.status === 'trial' && subscription.trial_ends_at && (
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Trial Expira Em</p>
                      <p className="text-lg font-semibold mt-1">
                        {isPast(new Date(subscription.trial_ends_at)) ? (
                          <span className="text-destructive">Expirado</span>
                        ) : (
                          formatDistanceToNow(new Date(subscription.trial_ends_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(subscription.trial_ends_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Valor Mensal</p>
                    <p className="text-lg font-semibold mt-1">
                      {plan?.price_monthly === 0 
                        ? 'Gratuito' 
                        : `R$ ${plan?.price_monthly.toFixed(2).replace('.', ',')}`
                      }
                    </p>
                  </div>
                </div>

                {/* Trial Warning */}
                {subscription?.status === 'trial' && subscription.trial_ends_at && !isPast(new Date(subscription.trial_ends_at)) && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning-foreground">Seu período de teste está ativo</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Após o término do trial, você precisará escolher um plano pago para continuar usando o sistema.
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Features */}
                <div>
                  <h3 className="font-semibold mb-4">Funcionalidades Incluídas</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {plan?.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{featureLabels[feature] || feature}</span>
                      </div>
                    ))}
                    {(!plan?.features || plan.features.length === 0) && (
                      <p className="text-sm text-muted-foreground">Nenhuma funcionalidade disponível</p>
                    )}
                  </div>
                </div>

                {/* Upgrade Button */}
                {subscription?.status === 'trial' && (
                  <div className="pt-4">
                    <Button className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Fazer Upgrade do Plano
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recurring Payments Tab */}
          <TabsContent value="recurring" className="space-y-6">
            <RecurringPaymentsSettings />
          </TabsContent>

          {/* Clinic Data Tab */}
          <TabsContent value="clinic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados da Clínica
                </CardTitle>
                <CardDescription>
                  Atualize as informações da sua clínica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Clínica *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome da clínica"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@clinica.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <Separator />

                {/* Address */}
                <div>
                  <h3 className="font-semibold mb-4">Endereço</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Rua, número, complemento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="UF"
                          maxLength={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip_code">CEP</Label>
                        <Input
                          id="zip_code"
                          value={formData.zip_code}
                          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
