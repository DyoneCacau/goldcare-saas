import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RecurringPaymentsSettings() {
  const { user } = useAuth();
  const { subscription, refreshSubscription } = useSubscription();
  const [isUpdating, setIsUpdating] = useState(false);
  const [autoRenew, setAutoRenew] = useState(subscription?.auto_renew ?? true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    (subscription?.billing_cycle as 'monthly' | 'yearly') || 'monthly'
  );

  useEffect(() => {
    if (subscription) {
      setAutoRenew(subscription.auto_renew ?? true);
      setBillingCycle((subscription.billing_cycle as 'monthly' | 'yearly') || 'monthly');
    }
  }, [subscription]);

  const handleUpdateAutoRenew = async (enabled: boolean) => {
    if (!subscription || !user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ auto_renew: enabled })
        .eq('id', subscription.id);

      if (error) throw error;

      setAutoRenew(enabled);
      await refreshSubscription();
      toast.success(enabled ? 'Renovação automática ativada' : 'Renovação automática desativada');
    } catch (error: any) {
      toast.error('Erro ao atualizar configuração: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateBillingCycle = async (cycle: 'monthly' | 'yearly') => {
    if (!subscription || !user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ billing_cycle: cycle })
        .eq('id', subscription.id);

      if (error) throw error;

      setBillingCycle(cycle);
      await refreshSubscription();
      toast.success(`Ciclo de cobrança alterado para ${cycle === 'monthly' ? 'mensal' : 'anual'}`);
    } catch (error: any) {
      toast.error('Erro ao atualizar ciclo: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!subscription) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Nenhuma assinatura encontrada
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pagamentos Recorrentes
        </CardTitle>
        <CardDescription>
          Configure como deseja pagar sua assinatura
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status da Assinatura */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div>
            <p className="text-sm font-medium">Status da Assinatura</p>
            <p className="text-xs text-muted-foreground mt-1">
              {subscription.status === 'trial' ? 'Período de teste' : 'Assinatura ativa'}
            </p>
          </div>
          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
            {subscription.status === 'trial' ? 'Trial' : 'Ativo'}
          </Badge>
        </div>

        {/* Renovação Automática */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="space-y-0.5">
            <Label htmlFor="auto-renew" className="text-base">
              Renovação Automática
            </Label>
            <p className="text-sm text-muted-foreground">
              {autoRenew
                ? 'Sua assinatura será renovada automaticamente'
                : 'Você precisará renovar manualmente'}
            </p>
          </div>
          <Switch
            id="auto-renew"
            checked={autoRenew}
            onCheckedChange={handleUpdateAutoRenew}
            disabled={isUpdating || subscription.status === 'trial'}
          />
        </div>

        {/* Ciclo de Cobrança */}
        <div className="space-y-2">
          <Label>Ciclo de Cobrança</Label>
          <Select
            value={billingCycle}
            onValueChange={(v) => handleUpdateBillingCycle(v as 'monthly' | 'yearly')}
            disabled={isUpdating || subscription.status === 'trial'}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="yearly">Anual (com desconto)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {billingCycle === 'monthly'
              ? 'Você será cobrado mensalmente'
              : 'Você será cobrado anualmente (economia de até 20%)'}
          </p>
        </div>

        {/* Próxima Cobrança */}
        {subscription.next_billing_date && (
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Próxima Cobrança</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(subscription.next_billing_date), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Última Cobrança */}
        {subscription.last_billing_date && (
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Última Cobrança</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(subscription.last_billing_date), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aviso Trial */}
        {subscription.status === 'trial' && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Período de teste ativo
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Durante o trial, a renovação automática está desabilitada. Após escolher um plano pago,
                você poderá configurar pagamentos recorrentes.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
