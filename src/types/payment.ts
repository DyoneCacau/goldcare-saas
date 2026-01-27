/**
 * Payment types for the commission system
 */

export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'pix' | 'voucher' | 'split';

export type PaymentStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';

export interface Payment {
  id: string;
  clinicId: string;
  appointmentId?: string;
  patientId?: string;
  patientName?: string;

  // Valores
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;

  // Método e status
  paymentMethod: PaymentMethod;
  status: PaymentStatus;

  // Metadados
  description?: string;
  confirmedAt?: string;
  confirmedBy?: string;

  // Auditoria
  createdAt: string;
  updatedAt: string;
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  credit: 'Cartão de Crédito',
  debit: 'Cartão de Débito',
  pix: 'PIX',
  voucher: 'Voucher/Convênio',
  split: 'Pagamento Misto',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};
