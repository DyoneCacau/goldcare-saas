import { useState } from 'react';
import { Banknote, CreditCard, Smartphone, Ticket, Split } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Transaction, PaymentMethod, PaymentSplit } from '@/types/financial';
import { mockPatients } from '@/data/mockPatients';
import { incomeCategories, expenseCategories } from '@/data/mockFinancial';
import { toast } from 'sonner';

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  type: 'income' | 'expense';
}

const paymentMethods = [
  { value: 'cash', label: 'Dinheiro', icon: Banknote },
  { value: 'credit', label: 'Crédito', icon: CreditCard },
  { value: 'debit', label: 'Débito', icon: CreditCard },
  { value: 'pix', label: 'PIX', icon: Smartphone },
  { value: 'voucher', label: 'Voucher/Parceria', icon: Ticket },
  { value: 'split', label: 'Dividir Pagamento', icon: Split },
];

export function PaymentForm({ open, onOpenChange, onSave, type }: PaymentFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [patientId, setPatientId] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState('');
  
  // Split payment state
  const [splitMethod1, setSplitMethod1] = useState<Exclude<PaymentMethod, 'split'>>('pix');
  const [splitAmount1, setSplitAmount1] = useState('');
  const [splitMethod2, setSplitMethod2] = useState<Exclude<PaymentMethod, 'split'>>('credit');
  const [splitAmount2, setSplitAmount2] = useState('');

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setPaymentMethod('cash');
    setPatientId('');
    setCategory('');
    setNotes('');
    setVoucherDiscount('');
    setSplitAmount1('');
    setSplitAmount2('');
  };

  const handleSave = () => {
    if (!description || !amount || !category) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Valor inválido');
      return;
    }

    if (paymentMethod === 'split') {
      const split1 = parseFloat(splitAmount1);
      const split2 = parseFloat(splitAmount2);
      
      if (isNaN(split1) || isNaN(split2)) {
        toast.error('Valores de divisão inválidos');
        return;
      }

      if (Math.abs((split1 + split2) - amountNum) > 0.01) {
        toast.error('A soma dos valores divididos deve ser igual ao valor total');
        return;
      }
    }

    const now = new Date();
    const patient = mockPatients.find((p) => p.id === patientId);

    const transaction: Omit<Transaction, 'id'> = {
      type,
      description,
      amount: amountNum,
      paymentMethod,
      patientId: patientId || undefined,
      patientName: patient?.name,
      category,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      userId: 'user1',
      userName: 'Recepcionista Ana',
      notes: notes || undefined,
      voucherDiscount: voucherDiscount ? parseFloat(voucherDiscount) : undefined,
      paymentSplit: paymentMethod === 'split' ? {
        method1: splitMethod1,
        amount1: parseFloat(splitAmount1),
        method2: splitMethod2,
        amount2: parseFloat(splitAmount2),
      } : undefined,
    };

    onSave(transaction);
    resetForm();
    onOpenChange(false);
    toast.success(type === 'income' ? 'Recebimento registrado!' : 'Despesa registrada!');
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (paymentMethod === 'split' && value) {
      const half = (parseFloat(value) / 2).toFixed(2);
      setSplitAmount1(half);
      setSplitAmount2(half);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === 'income' ? 'Registrar Recebimento' : 'Registrar Despesa'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Consulta, Limpeza, Material..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === 'income' && (
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {mockPatients.filter((p) => p.status === 'active').map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label>Forma de Pagamento *</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                      paymentMethod === method.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5',
                      paymentMethod === method.value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className={cn(
                      'text-xs font-medium',
                      paymentMethod === method.value ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voucher Discount */}
          {paymentMethod === 'voucher' && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label>Desconto do Voucher/Parceria (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={voucherDiscount}
                onChange={(e) => setVoucherDiscount(e.target.value)}
                placeholder="Valor do desconto"
              />
              <p className="text-xs text-muted-foreground">
                Informe o valor do desconto concedido pela parceria
              </p>
            </div>
          )}

          {/* Split Payment */}
          {paymentMethod === 'split' && (
            <div className="space-y-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Dividir Pagamento</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Método 1</Label>
                  <Select value={splitMethod1} onValueChange={(v) => setSplitMethod1(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit">Crédito</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    value={splitAmount1}
                    onChange={(e) => setSplitAmount1(e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Método 2</Label>
                  <Select value={splitMethod2} onValueChange={(v) => setSplitMethod2(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit">Crédito</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    value={splitAmount2}
                    onChange={(e) => setSplitAmount2(e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
