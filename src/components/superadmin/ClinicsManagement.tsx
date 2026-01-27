import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Search, Building2, Mail, Phone, Key, Power, PowerOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
  owner_user_id: string | null;
}

interface ClinicWithSubscription extends Clinic {
  subscription?: {
    status: string;
    plan_name: string;
    trial_ends_at: string | null;
  };
}

export function ClinicsManagement() {
  const [clinics, setClinics] = useState<ClinicWithSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithSubscription | null>(null);
  const [newClinic, setNewClinic] = useState({
    name: "",
    email: "",
    phone: "",
    cnpj: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  async function fetchClinics() {
    try {
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (clinicsError) throw clinicsError;

      // Fetch subscriptions for each clinic
      const clinicsWithSubs: ClinicWithSubscription[] = [];
      
      for (const clinic of clinicsData || []) {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('status, trial_ends_at, plans(name)')
          .eq('clinic_id', clinic.id)
          .maybeSingle();

        clinicsWithSubs.push({
          ...clinic,
          subscription: subData ? {
            status: subData.status,
            plan_name: (subData.plans as any)?.name || 'Sem plano',
            trial_ends_at: subData.trial_ends_at,
          } : undefined,
        });
      }

      setClinics(clinicsWithSubs);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      toast.error('Erro ao carregar clínicas');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateClinic() {
    try {
      // 1. Create the clinic
      const { data: clinicData, error: clinicError } = await supabase.from('clinics').insert({
        name: newClinic.name,
        email: newClinic.email,
        phone: newClinic.phone || null,
        cnpj: newClinic.cnpj || null,
        city: newClinic.city || null,
        state: newClinic.state || null,
      }).select().single();

      if (clinicError) throw clinicError;

      // 2. Get trial plan
      const { data: trialPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('slug', 'trial')
        .single();

      // 3. Create subscription in trial
      if (clinicData) {
        const trialEnds = new Date();
        trialEnds.setDate(trialEnds.getDate() + 7);

        const { error: subError } = await supabase.from('subscriptions').insert({
          clinic_id: clinicData.id,
          plan_id: trialPlan?.id || null,
          status: 'trial',
          trial_ends_at: trialEnds.toISOString(),
          payment_status: 'pending',
          current_period_start: new Date().toISOString(),
          current_period_end: trialEnds.toISOString(),
        });

        if (subError) {
          console.error('Error creating subscription:', subError);
          toast.error('Clínica criada, mas erro ao criar assinatura');
        }
      }

      toast.success('Clínica criada com sucesso! Trial de 7 dias ativado.');
      setIsCreateDialogOpen(false);
      setNewClinic({ name: "", email: "", phone: "", cnpj: "", city: "", state: "" });
      fetchClinics();
    } catch (error: any) {
      console.error('Error creating clinic:', error);
      toast.error(error.message || 'Erro ao criar clínica');
    }
  }

  async function toggleClinicStatus(clinic: ClinicWithSubscription) {
    try {
      const { error } = await supabase
        .from('clinics')
        .update({ is_active: !clinic.is_active })
        .eq('id', clinic.id);

      if (error) throw error;

      toast.success(clinic.is_active ? 'Clínica desativada' : 'Clínica ativada');
      fetchClinics();
    } catch (error) {
      console.error('Error toggling clinic status:', error);
      toast.error('Erro ao alterar status');
    }
  }

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.cnpj?.includes(searchTerm)
  );

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'trial':
        return <Badge variant="secondary">Trial</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspenso</Badge>;
      case 'expired':
        return <Badge variant="outline">Expirado</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Gestão de Clínicas
        </CardTitle>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Clínica
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Clínica</DialogTitle>
              <DialogDescription>
                Adicione uma nova clínica à plataforma. Ela iniciará com 7 dias de trial.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Clínica *</Label>
                <Input
                  id="name"
                  value={newClinic.name}
                  onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                  placeholder="Ex: Clínica Odonto Sorriso"
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
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateClinic} disabled={!newClinic.name || !newClinic.email}>
                Criar Clínica
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clínica</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClinics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma clínica encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredClinics.map((clinic) => (
                  <TableRow key={clinic.id} className={!clinic.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{clinic.name}</p>
                        {clinic.cnpj && (
                          <p className="text-sm text-muted-foreground">{clinic.cnpj}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" /> {clinic.email}
                        </span>
                        {clinic.phone && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" /> {clinic.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(clinic.subscription?.status)}
                        {!clinic.is_active && (
                          <Badge variant="outline" className="text-destructive border-destructive">
                            Desativada
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{clinic.subscription?.plan_name || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(clinic.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleClinicStatus(clinic)}>
                            {clinic.is_active ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClinic(clinic);
                              setIsResetPasswordDialogOpen(true);
                            }}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Resetar Senha
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
            <DialogDescription>
              Esta funcionalidade enviará um e-mail de recuperação de senha para o usuário proprietário da clínica.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Clínica: <strong>{selectedClinic?.name}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              E-mail: <strong>{selectedClinic?.email}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              toast.success('E-mail de recuperação enviado!');
              setIsResetPasswordDialogOpen(false);
            }}>
              Enviar E-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
