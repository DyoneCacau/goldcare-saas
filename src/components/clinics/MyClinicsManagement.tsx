import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUserClinics, useCreateClinic, CreateClinicInput } from '@/hooks/useClinics';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { Plus, Building2, Mail, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

export function MyClinicsManagement() {
  const { user, isSuperAdmin } = useAuth();
  const { subscription } = useSubscription();
  const { data: clinics = [], isLoading, error } = useUserClinics();
  const { mutate: createClinic, isPending: isCreating } = useCreateClinic();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClinic, setNewClinic] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  // Buscar max_clinics do plano (pode vir de subscription ou da primeira clínica)
  let planMaxClinics: number | null = null;
  if (clinics.length > 0) {
    const firstClinicSub = (clinics[0] as any).subscriptions?.[0];
    if (firstClinicSub?.plans?.max_clinics !== undefined) {
      planMaxClinics = firstClinicSub.plans.max_clinics;
    }
  } else if (subscription?.plan && (subscription.plan as any).max_clinics !== undefined) {
    planMaxClinics = (subscription.plan as any).max_clinics;
  }

  const currentCount = clinics.length;
  const canCreateMore = isSuperAdmin || planMaxClinics === null || currentCount < planMaxClinics;
  const remainingSlots = planMaxClinics === null ? 'Ilimitado' : Math.max(0, planMaxClinics - currentCount);

  const handleCreateClinic = async () => {
    if (!newClinic.name || !newClinic.email) {
      toast.error('Preencha nome e e-mail da clínica');
      return;
    }

    try {
      await createClinic.mutateAsync(newClinic as CreateClinicInput);
      setIsCreateDialogOpen(false);
      setNewClinic({
        name: '',
        email: user?.email || '',
        phone: '',
        cnpj: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
      });
    } catch (error) {
      // Erro já é tratado pelo hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-destructive">
            Erro ao carregar clínicas: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Minhas Clínicas
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {currentCount} de {planMaxClinics === null ? '∞' : planMaxClinics} clínica(s) •{' '}
            {remainingSlots} disponível(is)
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canCreateMore || isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Clínica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Unidade</DialogTitle>
              <DialogDescription>
                Adicione uma nova unidade da sua clínica. Ela iniciará com 7 dias de trial.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!canCreateMore && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Limite de clínicas atingido
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Seu plano atual permite até {planMaxClinics} clínica(s). Entre em contato
                      com o suporte para fazer upgrade e adicionar mais unidades.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome da Unidade *</Label>
                <Input
                  id="name"
                  value={newClinic.name}
                  onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                  placeholder="Ex: Clínica Odonto Sorriso - Unidade Centro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClinic.email}
                  onChange={(e) => setNewClinic({ ...newClinic, email: e.target.value })}
                  placeholder="contato@clinica.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newClinic.phone}
                    onChange={(e) => setNewClinic({ ...newClinic, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={newClinic.cnpj}
                    onChange={(e) => setNewClinic({ ...newClinic, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={newClinic.address}
                  onChange={(e) => setNewClinic({ ...newClinic, address: e.target.value })}
                  placeholder="Rua, número"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={newClinic.city}
                    onChange={(e) => setNewClinic({ ...newClinic, city: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={newClinic.state}
                    onChange={(e) => setNewClinic({ ...newClinic, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={newClinic.zip_code}
                    onChange={(e) => setNewClinic({ ...newClinic, zip_code: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateClinic}
                disabled={!canCreateMore || !newClinic.name || !newClinic.email || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Unidade'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {clinics.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Você ainda não possui clínicas cadastradas</p>
            <p className="text-sm mt-2">Crie sua primeira unidade para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clinics.map((clinic) => {
              const sub = (clinic as any).subscriptions?.[0];
              const plan = sub?.plans;
              return (
                <div
                  key={clinic.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{clinic.name}</span>
                      {sub?.status === 'trial' && (
                        <Badge variant="secondary">Trial</Badge>
                      )}
                      {sub?.status === 'active' && (
                        <Badge className="bg-green-500">Ativo</Badge>
                      )}
                    </div>
                    <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {clinic.email}
                      </div>
                      {clinic.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {clinic.phone}
                        </div>
                      )}
                      {clinic.city && clinic.state && (
                        <div>
                          {clinic.city}, {clinic.state}
                        </div>
                      )}
                      {plan && (
                        <div className="text-xs">
                          Plano: <strong>{plan.name}</strong>
                          {plan.max_clinics !== null && (
                            <span> • Limite: {plan.max_clinics} clínica(s)</span>
                          )}
                        </div>
                      )}
                      <div className="text-xs">
                        Criada em: {format(new Date(clinic.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implementar troca de clínica ativa
                        toast.info('Funcionalidade de trocar clínica em desenvolvimento');
                      }}
                    >
                      Acessar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
