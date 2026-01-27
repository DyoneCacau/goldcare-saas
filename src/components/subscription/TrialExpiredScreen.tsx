import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, Clock, AlertTriangle, Crown, Sparkles, Zap, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  max_users: number | null;
  max_patients: number | null;
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
  administracao: 'Administração',
};

const planIcons: Record<string, React.ReactNode> = {
  trial: <Clock className="h-6 w-6" />,
  basico: <Zap className="h-6 w-6" />,
  profissional: <Sparkles className="h-6 w-6" />,
  premium: <Crown className="h-6 w-6" />,
};

export function TrialExpiredScreen() {
  const { user, signOut } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [upgradeNotes, setUpgradeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .neq('slug', 'trial')
        .order('price_monthly', { ascending: true });

      if (data) {
        setPlans(data.map(p => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as unknown as string || '[]')
        })));
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsUpgradeDialogOpen(true);
  };

  const handleSubmitUpgradeRequest = async () => {
    if (!selectedPlan || !user) return;

    setIsSubmitting(true);

    try {
      // Get user's clinic
      const { data: clinicUser } = await supabase
        .from('clinic_users')
        .select('clinic_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!clinicUser) {
        toast.error('Clínica não encontrada');
        return;
      }

      // Get subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, plan_id')
        .eq('clinic_id', clinicUser.clinic_id)
        .maybeSingle();

      // Create upgrade request
      const { error } = await supabase.from('upgrade_requests').insert({
        clinic_id: clinicUser.clinic_id,
        subscription_id: subscription?.id,
        requested_by: user.id,
        requested_plan_id: selectedPlan.id,
        current_plan_id: subscription?.plan_id,
        notes: upgradeNotes || `Solicitação de upgrade para ${selectedPlan.name}`,
        status: 'pending',
      });

      if (error) throw error;

      // Create admin notification
      await supabase.from('admin_notifications').insert({
        type: 'upgrade_request',
        title: 'Nova solicitação de upgrade',
        message: `Solicitação de upgrade para ${selectedPlan.name}`,
        reference_type: 'upgrade_request',
        reference_id: clinicUser.clinic_id,
      });

      toast.success('Solicitação enviada! Entraremos em contato em breve.');
      setIsUpgradeDialogOpen(false);
      setUpgradeNotes('');
      setSelectedPlan(null);
    } catch (error) {
      console.error('Error submitting upgrade request:', error);
      toast.error('Erro ao enviar solicitação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">ClinSoft</span>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Alert */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-destructive">Período de Teste Encerrado</h2>
              <p className="text-muted-foreground mt-1">
                Seu período de teste gratuito de 7 dias chegou ao fim. Para continuar utilizando o ClinSoft e 
                acessar todas as funcionalidades, escolha um dos planos abaixo.
              </p>
            </div>
          </div>
        </div>

        {/* Plans Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Escolha seu Plano</h1>
          <p className="text-muted-foreground">
            Selecione o plano ideal para sua clínica e desbloqueie todo o potencial do ClinSoft
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isProfessional = plan.slug === 'profissional';
            const isPremium = plan.slug === 'premium';
            
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
                  isProfessional && "border-primary shadow-md ring-1 ring-primary/20",
                  selectedPlan?.id === plan.id && "ring-2 ring-primary"
                )}
              >
                {isProfessional && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                    Mais Popular
                  </div>
                )}
                {isPremium && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                    Completo
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className={cn(
                    "mx-auto mb-3 h-12 w-12 rounded-full flex items-center justify-center",
                    isPremium ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                  )}>
                    {planIcons[plan.slug] || <Zap className="h-6 w-6" />}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.description && (
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {plan.price_yearly && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ou R$ {plan.price_yearly.toFixed(2).replace('.', ',')} /ano
                      </p>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="flex justify-center gap-4 text-sm">
                    {plan.max_users && (
                      <Badge variant="secondary">
                        {plan.max_users} usuários
                      </Badge>
                    )}
                    {plan.max_patients && (
                      <Badge variant="secondary">
                        {plan.max_patients} pacientes
                      </Badge>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{featureLabels[feature] || feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button 
                    className={cn(
                      "w-full",
                      isPremium && "bg-amber-500 hover:bg-amber-600"
                    )}
                    variant={isProfessional ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    Solicitar {plan.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Dúvidas sobre qual plano escolher?{' '}
            <a href="mailto:contato@clinsoft.com" className="text-primary hover:underline">
              Entre em contato conosco
            </a>
          </p>
        </div>
      </main>

      {/* Upgrade Request Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Solicitar {selectedPlan?.name}
            </DialogTitle>
            <DialogDescription>
              Envie uma solicitação de upgrade. Nossa equipe entrará em contato para finalizar a ativação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{selectedPlan?.name}</span>
                <span className="font-bold text-primary">
                  R$ {selectedPlan?.price_monthly.toFixed(2).replace('.', ',')}/mês
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedPlan?.features.length} funcionalidades incluídas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Alguma observação ou dúvida sobre o plano?"
                value={upgradeNotes}
                onChange={(e) => setUpgradeNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitUpgradeRequest} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ClinSoft. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
