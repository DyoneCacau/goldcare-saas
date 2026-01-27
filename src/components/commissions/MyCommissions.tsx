import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DollarSign,
  Clock,
  CheckCircle,
  Calendar,
  Filter,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCommissions, useCommissionSummary } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface MyCommissionsProps {
  beneficiaryId?: string;
  beneficiaryType?: 'professional' | 'seller' | 'reception';
}

export function MyCommissions({ beneficiaryId, beneficiaryType }: MyCommissionsProps) {
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('current-month');

  // Calculate date range based on period filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentYear = new Date(now.getFullYear(), 0, 1);

    switch (periodFilter) {
      case 'current-month':
        return {
          startDate: currentMonth.toISOString(),
          endDate: now.toISOString(),
        };
      case 'last-month':
        return {
          startDate: lastMonth.toISOString(),
          endDate: currentMonth.toISOString(),
        };
      case 'current-year':
        return {
          startDate: currentYear.toISOString(),
          endDate: now.toISOString(),
        };
      default:
        return {};
    }
  }, [periodFilter]);

  // Fetch commissions
  const { data: commissions, isLoading } = useCommissions({
    beneficiaryId: beneficiaryId || profile?.id,
    beneficiaryType,
    status: statusFilter === 'all' ? undefined : statusFilter,
    ...dateRange,
  });

  // Fetch summary
  const { data: summary } = useCommissionSummary({
    beneficiaryId: beneficiaryId || profile?.id,
    beneficiaryType,
    ...dateRange,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: {
        variant: 'secondary',
        label: 'Pendente',
        icon: <Clock className="h-3 w-3" />,
      },
      paid: {
        variant: 'default',
        label: 'Pago',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      cancelled: {
        variant: 'destructive',
        label: 'Cancelado',
        icon: null,
      },
    };

    const config = variants[status] || variants.pending;

    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{formatCurrency(summary?.total || 0)}</p>
                <p className="text-xs text-muted-foreground">{summary?.count || 0} comissões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(summary?.pending || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recebido</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(summary?.paid || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            <div className="flex flex-1 gap-4">
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Mês Atual</SelectItem>
                  <SelectItem value="last-month">Mês Anterior</SelectItem>
                  <SelectItem value="current-year">Ano Atual</SelectItem>
                  <SelectItem value="all">Todo Período</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <DollarSign className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor Base</TableHead>
                  <TableHead className="text-right">Percentual</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!commissions || commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Nenhuma comissão encontrada no período selecionado
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        {format(new Date(commission.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {commission.beneficiaryType === 'professional'
                            ? 'Profissional'
                            : commission.beneficiaryType === 'seller'
                            ? 'Vendedor'
                            : 'Recepção'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {commission.baseValue
                          ? formatCurrency(commission.baseValue)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {commission.percentage ? `${commission.percentage}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(commission.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(commission.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {commission.paidAt
                          ? format(new Date(commission.paidAt), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
