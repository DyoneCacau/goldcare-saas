import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePayments } from '@/hooks/usePayments';
import { ConfirmPaymentDialog } from '@/components/payments/ConfirmPaymentDialog';
import { Payment, paymentMethodLabels } from '@/types/payment';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function Pagamentos() {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { data: payments, isLoading } = usePayments();

  const handleConfirmClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setConfirmDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: {
        variant: 'secondary',
        label: 'Pendente',
        icon: <Clock className="h-3 w-3" />,
      },
      confirmed: {
        variant: 'default',
        label: 'Confirmado',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      cancelled: {
        variant: 'destructive',
        label: 'Cancelado',
        icon: <XCircle className="h-3 w-3" />,
      },
      refunded: {
        variant: 'outline',
        label: 'Reembolsado',
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
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  const pendingPayments = payments?.filter((p) => p.status === 'pending') || [];
  const confirmedPayments = payments?.filter((p) => p.status === 'confirmed') || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie pagamentos e confirme para gerar comissões
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{pendingPayments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmados</p>
                  <p className="text-2xl font-bold">{confirmedPayments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Confirmado</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      confirmedPayments.reduce((sum, p) => sum + p.paidAmount, 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Nenhum pagamento pendente
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.patientName || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {paymentMethodLabels[payment.paymentMethod]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(payment.totalAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmClick(payment)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirmar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Confirmed Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos Confirmados (Últimos 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Confirmação</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor Pago</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedPayments.slice(0, 10).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.confirmedAt
                          ? format(new Date(payment.confirmedAt), 'dd/MM/yyyy HH:mm', {
                              locale: ptBR,
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.patientName || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.description || '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {formatCurrency(payment.paidAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(payment.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <ConfirmPaymentDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        payment={selectedPayment}
        appointmentData={
          selectedPayment?.appointmentId
            ? {
                appointmentId: selectedPayment.appointmentId,
                // TODO: Fetch appointment data to get professional, procedure, etc.
                professionalId: '',
                procedure: '',
                appointmentDate: new Date(),
              }
            : undefined
        }
      />
    </MainLayout>
  );
}
