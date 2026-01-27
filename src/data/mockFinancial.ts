import { Transaction, CashRegister } from '@/types/financial';

const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const formatTime = (date: Date) => date.toTimeString().slice(0, 5);

export const mockTransactions: Transaction[] = [
  {
    id: 'tr1',
    type: 'income',
    description: 'Consulta Geral',
    amount: 150.00,
    paymentMethod: 'pix',
    patientId: '1',
    patientName: 'Maria Silva Santos',
    category: 'Consulta',
    date: formatDate(today),
    time: '08:30',
    userId: 'user1',
    userName: 'Recepcionista Ana',
  },
  {
    id: 'tr2',
    type: 'income',
    description: 'Limpeza Dental',
    amount: 200.00,
    paymentMethod: 'credit',
    patientId: '2',
    patientName: 'João Pedro Oliveira',
    category: 'Procedimento',
    date: formatDate(today),
    time: '09:15',
    userId: 'user1',
    userName: 'Recepcionista Ana',
  },
  {
    id: 'tr3',
    type: 'income',
    description: 'Clareamento + Consulta',
    amount: 500.00,
    paymentMethod: 'split',
    paymentSplit: {
      method1: 'pix',
      amount1: 250.00,
      method2: 'credit',
      amount2: 250.00,
    },
    patientId: '3',
    patientName: 'Ana Clara Rodrigues',
    category: 'Procedimento',
    date: formatDate(today),
    time: '10:00',
    userId: 'user1',
    userName: 'Recepcionista Ana',
  },
  {
    id: 'tr4',
    type: 'expense',
    description: 'Material de Limpeza',
    amount: 85.00,
    paymentMethod: 'cash',
    category: 'Suprimentos',
    date: formatDate(today),
    time: '11:30',
    userId: 'user1',
    userName: 'Recepcionista Ana',
  },
  {
    id: 'tr5',
    type: 'income',
    description: 'Retorno - Parceria Empresa X',
    amount: 120.00,
    paymentMethod: 'voucher',
    voucherDiscount: 30.00,
    patientId: '4',
    patientName: 'Carlos Eduardo Lima',
    category: 'Consulta',
    date: formatDate(today),
    time: '14:00',
    userId: 'user1',
    userName: 'Recepcionista Ana',
    notes: 'Voucher parceria Empresa X - 20% desconto',
  },
  {
    id: 'tr6',
    type: 'income',
    description: 'Extração',
    amount: 300.00,
    paymentMethod: 'debit',
    patientId: '5',
    patientName: 'Fernanda Costa Souza',
    category: 'Procedimento',
    date: formatDate(today),
    time: '15:30',
    userId: 'user1',
    userName: 'Recepcionista Ana',
  },
];

export const mockCashRegister: CashRegister = {
  id: 'cr1',
  openedAt: `${formatDate(today)}T08:00:00`,
  openedBy: 'user1',
  openedByName: 'Recepcionista Ana',
  initialBalance: 200.00,
  transactions: mockTransactions,
  status: 'open',
};

export const incomeCategories = [
  'Consulta',
  'Procedimento',
  'Retorno',
  'Exame',
  'Outros',
];

export const expenseCategories = [
  'Suprimentos',
  'Material Clínico',
  'Manutenção',
  'Serviços',
  'Outros',
];
