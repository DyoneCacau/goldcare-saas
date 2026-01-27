import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Minus,
  Lock,
  Unlock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Banknote,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { PaymentForm } from '@/components/financial/PaymentForm';
import { TransactionsList } from '@/components/financial/TransactionsList';
import { CashClosingDialog } from '@/components/financial/CashClosingDialog';
import { CashRegister, CashSummary, Transaction } from '@/types/financial';
import { mockCashRegister } from '@/data/mockFinancial';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FeatureButton } from '@/components/subscription/FeatureButton';

export default function Financial() {
  const [cashRegister, setCashRegister] = useState<CashRegister>(mockCashRegister);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [closingDialogOpen, setClosingDialogOpen] = useState(false);

  const summary = useMemo<CashSummary>(() => {
    const transactions = cashRegister.transactions;
    
    let totalCash = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    let totalPix = 0;
    let totalVoucher = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      const amount = t.type === 'income' ? t.amount : 0;
      
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }

      if (t.paymentMethod === 'split' && t.paymentSplit) {
        // Handle split payments
        const methods = [
          { method: t.paymentSplit.method1, amount: t.paymentSplit.amount1 },
          { method: t.paymentSplit.method2, amount: t.paymentSplit.amount2 },
        ];
        methods.forEach(({ method, amount: splitAmount }) => {
          switch (method) {
            case 'cash': totalCash += splitAmount; break;
            case 'credit': totalCredit += splitAmount; break;
            case 'debit': totalDebit += splitAmount; break;
            case 'pix': totalPix += splitAmount; break;
          }
        });
      } else {
        switch (t.paymentMethod) {
          case 'cash': totalCash += amount; break;
          case 'credit': totalCredit += amount; break;
          case 'debit': totalDebit += amount; break;
          case 'pix': totalPix += amount; break;
          case 'voucher': totalVoucher += amount; break;
        }
      }
    });

    return {
      totalCash,
      totalCredit,
      totalDebit,
      totalPix,
      totalVoucher,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount: transactions.length,
    };
  }, [cashRegister.transactions]);

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tr${Date.now()}`,
    };

    setCashRegister((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction],
    }));
  };

  const handleOpenCash = () => {
    setCashRegister({
      id: `cr${Date.now()}`,
      openedAt: new Date().toISOString(),
      openedBy: 'user1',
      openedByName: 'Recepcionista Ana',
      initialBalance: 200.00,
      transactions: [],
      status: 'open',
    });
    toast.success('Caixa aberto com sucesso!');
  };

  const handleCloseCash = () => {
    setCashRegister((prev) => ({
      ...prev,
      status: 'closed',
      closedAt: new Date().toISOString(),
      closedBy: 'user1',
      closedByName: 'Recepcionista Ana',
      finalBalance: prev.initialBalance + summary.netBalance,
    }));
    setClosingDialogOpen(false);
    toast.success('Caixa fechado com sucesso!');
  };

  const isCashOpen = cashRegister.status === 'open';

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro / Caixa</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-2">
            {isCashOpen ? (
              <>
                <FeatureButton 
                  feature="financeiro" 
                  variant="outline" 
                  onClick={() => setExpenseDialogOpen(true)}
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Saída
                </FeatureButton>
                <FeatureButton 
                  feature="financeiro" 
                  onClick={() => setIncomeDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Entrada
                </FeatureButton>
                <FeatureButton
                  feature="financeiro"
                  variant="destructive"
                  onClick={() => setClosingDialogOpen(true)}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Fechar Caixa
                </FeatureButton>
              </>
            ) : (
              <FeatureButton 
                feature="financeiro" 
                onClick={handleOpenCash} 
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Unlock className="mr-2 h-4 w-4" />
                Abrir Caixa
              </FeatureButton>
            )}
          </div>
        </div>

        {/* Cash Status */}
        <Card className={cn(
          'border-2',
          isCashOpen ? 'border-emerald-500 bg-emerald-50/50' : 'border-red-500 bg-red-50/50'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCashOpen ? (
                  <Unlock className="h-6 w-6 text-emerald-600" />
                ) : (
                  <Lock className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className={cn(
                    'font-semibold',
                    isCashOpen ? 'text-emerald-700' : 'text-red-700'
                  )}>
                    Caixa {isCashOpen ? 'Aberto' : 'Fechado'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isCashOpen
                      ? `Aberto por ${cashRegister.openedByName} às ${format(new Date(cashRegister.openedAt), 'HH:mm')}`
                      : 'Clique em "Abrir Caixa" para iniciar'}
                  </p>
                </div>
              </div>
              {isCashOpen && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {cashRegister.initialBalance.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isCashOpen && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entradas</p>
                      <p className="text-xl font-bold text-emerald-600">
                        R$ {summary.totalIncome.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Saídas</p>
                      <p className="text-xl font-bold text-red-600">
                        R$ {summary.totalExpense.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo</p>
                      <p className={cn(
                        'text-xl font-bold',
                        summary.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        R$ {summary.netBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Em Caixa</p>
                      <p className="text-xl font-bold text-blue-600">
                        R$ {(cashRegister.initialBalance + summary.netBalance).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="bg-green-50">
                <CardContent className="p-3 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dinheiro</p>
                    <p className="font-semibold text-green-700">R$ {summary.totalCash.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50">
                <CardContent className="p-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Crédito</p>
                    <p className="font-semibold text-blue-700">R$ {summary.totalCredit.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50">
                <CardContent className="p-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Débito</p>
                    <p className="font-semibold text-purple-700">R$ {summary.totalDebit.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-teal-50">
                <CardContent className="p-3 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-teal-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">PIX</p>
                    <p className="font-semibold text-teal-700">R$ {summary.totalPix.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions List */}
            <Card>
              <CardHeader>
                <CardTitle>Movimentações do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionsList transactions={cashRegister.transactions} />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Dialogs */}
      <PaymentForm
        open={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
        onSave={handleAddTransaction}
        type="income"
      />

      <PaymentForm
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        onSave={handleAddTransaction}
        type="expense"
      />

      <CashClosingDialog
        open={closingDialogOpen}
        onOpenChange={setClosingDialogOpen}
        cashRegister={cashRegister}
        summary={summary}
        onClose={handleCloseCash}
      />
    </MainLayout>
  );
}
