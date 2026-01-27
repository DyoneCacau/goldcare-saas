import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCommissions } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';

export default function CommissionsReal() {
  const { user, isAdmin } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'paid' | 'cancelled' | 'all'>('all');

  // Buscar comissões do Supabase
  const { data: commissions = [], isLoading, error } = useCommissions({
    beneficiaryId: !isAdmin ? user?.id : undefined, // Profissional vê apenas suas comissões
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  // Calcular totais
  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPaid = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalCancelled = commissions
    .filter(c => c.status === 'cancelled')
    .reduce((sum, c) => sum + c.amount, 0);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando comissões...</span>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center text-destructive">
          Erro ao carregar comissões: {error.message}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Comissões</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Todas as comissões da clínica' : 'Suas comissões'}
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalPending.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {commissions.filter(c => c.status === 'pending').length} comissão(ões)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {commissions.filter(c => c.status === 'paid').length} comissão(ões)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalCancelled.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {commissions.filter(c => c.status === 'cancelled').length} comissão(ões)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Comissões */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Nenhuma comissão encontrada
              </div>
            ) : (
              <div className="space-y-4">
                {commissions.map((commission) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">R$ {commission.amount.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {commission.procedure_name || 'Procedimento'} •{' '}
                        {commission.beneficiary_type === 'professional' ? 'Profissional' :
                         commission.beneficiary_type === 'seller' ? 'Vendedor' :
                         'Recepção'}
                      </div>
                      {commission.percentage && (
                        <div className="text-xs text-muted-foreground">
                          {commission.percentage}% sobre R$ {commission.base_value?.toFixed(2)}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(commission.created_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          commission.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : commission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {commission.status === 'paid' ? 'Paga' :
                         commission.status === 'pending' ? 'Pendente' :
                         'Cancelada'}
                      </span>
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
