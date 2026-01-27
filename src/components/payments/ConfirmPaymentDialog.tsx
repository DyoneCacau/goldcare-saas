import { useState } from 'react';
import { CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Payment, paymentMethodLabels } from '@/types/payment';
import { useConfirmPaymentWithCommissions } from '@/hooks/useConfirmPaymentWithCommissions';

interface ConfirmPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;

  // Appointment data (required for commission generation)
  appointmentData?: {
    appointmentId: string;
    professionalId: string;
    procedure: string;
    appointmentDate: Date;
    sellerId?: string;
    receptionistId?: string;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function ConfirmPaymentDialog({
  open,
  onOpenChange,
  payment,
  appointmentData,
}: ConfirmPaymentDialogProps) {
  const [paidAmount, setPaidAmount] = useState<number | undefined>(undefined);
  const confirmPayment = useConfirmPaymentWithCommissions();

  const handleConfirm = async () => {
    if (!payment) return;

    await confirmPayment.mutateAsync({
      paymentId: payment.id,
      paidAmount: paidAmount || payment.totalAmount,
      ...appointmentData,
    });

    onOpenChange(false);
  };

  if (!payment) return null;

  const effectivePaidAmount = paidAmount !== undefined ? paidAmount : payment.totalAmount;
  const hasAppointmentData = !!appointmentData?.appointmentId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Confirmar Pagamento
          </DialogTitle>
          <DialogDescription>
            Ao confirmar, as comissões serão geradas automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paciente:</span>
                <span className="font-medium">{payment.patientName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Método:</span>
                <Badge variant="outline">{paymentMethodLabels[payment.paymentMethod]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor Total:</span>
                <span className="text-lg font-bold">{formatCurrency(payment.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Paid Amount Input */}
          <div className="grid gap-2">
            <Label htmlFor="paidAmount">Valor Pago (Confirmar)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                min="0"
                max={payment.totalAmount}
                placeholder={payment.totalAmount.toFixed(2)}
                value={paidAmount !== undefined ? paidAmount : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setPaidAmount(value ? parseFloat(value) : undefined);
                }}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para confirmar o valor total
            </p>
          </div>

          {/* Commission Warning */}
          {hasAppointmentData ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4 flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Comissões serão geradas automaticamente
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Após confirmar o pagamento, o sistema calculará as comissões com base nas
                    regras configuradas para este profissional e procedimento.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Dados do agendamento não fornecidos
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    O pagamento será confirmado, mas comissões NÃO serão geradas automaticamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirmPayment.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirmPayment.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {confirmPayment.isPending ? (
              'Confirmando...'
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmar Pagamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
