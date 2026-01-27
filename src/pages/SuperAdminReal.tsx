import { Loader2, Building2, Users, CheckCircle, XCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAllClinics, useToggleClinicStatus } from '@/hooks/useClinics';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SuperAdminReal() {
  const { isSuperAdmin } = useAuth();
  const { data: clinics = [], isLoading, error } = useAllClinics();
  const { mutate: toggleStatus, isPending } = useToggleClinicStatus();

  if (!isSuperAdmin) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center text-destructive">
          Acesso negado. Apenas SuperAdmin pode acessar esta página.
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando clínicas...</span>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center text-destructive">
          Erro ao carregar clínicas: {error.message}
        </div>
      </MainLayout>
    );
  }

  const activeClinics = clinics.filter(c => c.is_active).length;
  const inactiveClinics = clinics.filter(c => !c.is_active).length;

  const handleToggleStatus = (clinicId: string, currentStatus: boolean) => {
    toggleStatus({
      id: clinicId,
      is_active: !currentStatus,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Super Admin</h1>
          <p className="text-muted-foreground">
            Gerenciamento de todas as clínicas da plataforma
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clínicas</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clinics.length}</div>
              <p className="text-xs text-muted-foreground">
                Cadastradas na plataforma
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clínicas Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClinics}</div>
              <p className="text-xs text-muted-foreground">
                Em operação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clínicas Inativas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inactiveClinics}</div>
              <p className="text-xs text-muted-foreground">
                Bloqueadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Clínicas */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Clínicas</CardTitle>
          </CardHeader>
          <CardContent>
            {clinics.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Nenhuma clínica cadastrada ainda
              </div>
            ) : (
              <div className="space-y-4">
                {clinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{clinic.name}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            clinic.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {clinic.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        <div>Email: {clinic.email}</div>
                        {clinic.phone && <div>Telefone: {clinic.phone}</div>}
                        {clinic.city && clinic.state && (
                          <div>Localização: {clinic.city}, {clinic.state}</div>
                        )}
                        {clinic.cnpj && <div>CNPJ: {clinic.cnpj}</div>}
                        <div>Criada em: {format(new Date(clinic.created_at), 'dd/MM/yyyy')}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={clinic.is_active ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleToggleStatus(clinic.id, clinic.is_active)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : clinic.is_active ? (
                          'Desativar'
                        ) : (
                          'Ativar'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
