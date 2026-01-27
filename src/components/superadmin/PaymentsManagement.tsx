import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Receipt, Search, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Payment {
  id: string;
  subscription_id: string;
  amount: number;
  payment_method: string | null;
  payment_proof_url: string | null;
  status: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  subscription: {
    clinic: {
      name: string;
      email: string;
    };
    plan: {
      name: string;
    } | null;
  };
}

export function PaymentsManagement() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'reject'>('confirm');

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select(`
          *,
          subscriptions(
            clinics(name, email),
            plans(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPayments(data.map(p => ({
        ...p,
        subscription: {
          clinic: (p.subscriptions as any)?.clinics,
          plan: (p.subscriptions as any)?.plans,
        },
      })));
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setIsLoading(false);
    }
  }

  function openConfirmDialog(payment: Payment, action: 'confirm' | 'reject') {
    setSelectedPayment(payment);
    setConfirmAction(action);
    setConfirmNotes("");
    setIsConfirmDialogOpen(true);
  }

  async function handleConfirmPayment() {
    if (!selectedPayment || !user) return;

    try {
      const { error: paymentError } = await supabase
        .from('payment_history')
        .update({
          status: confirmAction === 'confirm' ? 'confirmed' : 'rejected',
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
          notes: confirmNotes || null,
        })
        .eq('id', selectedPayment.id);

      if (paymentError) throw paymentError;

      // If confirmed, update subscription
      if (confirmAction === 'confirm') {
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            payment_status: 'paid',
            last_payment_at: new Date().toISOString(),
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', selectedPayment.subscription_id);

        if (subError) throw subError;

        toast.success('Pagamento confirmado e assinatura ativada!');
      } else {
        toast.success('Pagamento rejeitado');
      }

      setIsConfirmDialogOpen(false);
      fetchPayments();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Erro ao processar pagamento');
    }
  }

  const filteredPayments = payments.filter(payment =>
    payment.subscription?.clinic?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.subscription?.clinic?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Aguardando</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Comprovantes de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por clínica..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum comprovante de pagamento encontrado</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Comprovante</TableHead>
                  <TableHead className="w-[150px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.subscription?.clinic?.name || '-'}</p>
                        <p className="text-sm text-muted-foreground">{payment.subscription?.clinic?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{payment.subscription?.plan?.name || '-'}</TableCell>
                    <TableCell>R$ {payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {format(new Date(payment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {payment.payment_proof_url ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={payment.payment_proof_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ver
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => openConfirmDialog(payment, 'confirm')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => openConfirmDialog(payment, 'reject')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {payment.status !== 'pending' && payment.confirmed_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(payment.confirmed_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Confirm Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'confirm' ? 'Confirmar Pagamento' : 'Rejeitar Pagamento'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'confirm'
                ? 'Ao confirmar, a assinatura será ativada automaticamente.'
                : 'Informe o motivo da rejeição.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm"><strong>Clínica:</strong> {selectedPayment?.subscription?.clinic?.name}</p>
              <p className="text-sm"><strong>Valor:</strong> R$ {selectedPayment?.amount.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <Label>{confirmAction === 'confirm' ? 'Observações (opcional)' : 'Motivo da rejeição'}</Label>
              <Textarea
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder={confirmAction === 'confirm' ? 'Observações...' : 'Informe o motivo...'}
                required={confirmAction === 'reject'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              variant={confirmAction === 'confirm' ? 'default' : 'destructive'}
              disabled={confirmAction === 'reject' && !confirmNotes}
            >
              {confirmAction === 'confirm' ? 'Confirmar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
