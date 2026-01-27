import { CommissionRule, CommissionCalculation, ProcedurePrice, CommissionSummary, StaffMember } from '@/types/commission';

// Only dental procedures
export const mockProcedurePrices: ProcedurePrice[] = [
  // Clinic 1 - Odonto Premium Centro
  { id: 'proc1', clinicId: 'clinic1', name: 'Limpeza Dental', price: 200, category: 'Prevenção', isActive: true },
  { id: 'proc2', clinicId: 'clinic1', name: 'Retorno', price: 80, category: 'Consulta', isActive: true },
  { id: 'proc3', clinicId: 'clinic1', name: 'Avaliação Inicial', price: 150, category: 'Consulta', isActive: true },
  { id: 'proc4', clinicId: 'clinic1', name: 'Implante Unitário', price: 3500, category: 'Implantodontia', isActive: true },
  { id: 'proc5', clinicId: 'clinic1', name: 'Clareamento', price: 800, category: 'Estética', isActive: true },
  { id: 'proc6', clinicId: 'clinic1', name: 'Tratamento de Canal', price: 650, category: 'Endodontia', isActive: true },
  { id: 'proc7', clinicId: 'clinic1', name: 'Extração Simples', price: 250, category: 'Cirurgia', isActive: true },
  { id: 'proc8', clinicId: 'clinic1', name: 'Restauração Resina', price: 180, category: 'Restauração', isActive: true },
  // Clinic 2 - Sorriso Perfeito
  { id: 'proc9', clinicId: 'clinic2', name: 'Limpeza Dental', price: 180, category: 'Prevenção', isActive: true },
  { id: 'proc10', clinicId: 'clinic2', name: 'Clareamento', price: 750, category: 'Estética', isActive: true },
  { id: 'proc11', clinicId: 'clinic2', name: 'Avaliação Ortodôntica', price: 200, category: 'Ortodontia', isActive: true },
  { id: 'proc12', clinicId: 'clinic2', name: 'Alinhadores (arcada)', price: 2500, category: 'Ortodontia', isActive: true },
  { id: 'proc13', clinicId: 'clinic2', name: 'Faceta de Porcelana', price: 1800, category: 'Estética', isActive: true },
  { id: 'proc14', clinicId: 'clinic2', name: 'Aplicação de Toxina Botulínica (ml)', price: 150, category: 'Harmonização', isActive: true },
  // Clinic 3 - Centro Odontológico Jardins
  { id: 'proc15', clinicId: 'clinic3', name: 'Limpeza Dental', price: 220, category: 'Prevenção', isActive: true },
  { id: 'proc16', clinicId: 'clinic3', name: 'Tratamento de Canal', price: 700, category: 'Endodontia', isActive: true },
  { id: 'proc17', clinicId: 'clinic3', name: 'Prótese Total', price: 2800, category: 'Prótese', isActive: true },
  { id: 'proc18', clinicId: 'clinic3', name: 'Tratamento Periodontal', price: 450, category: 'Periodontia', isActive: true },
];

// Staff members (sellers and receptionists)
export const mockStaffMembers: StaffMember[] = [
  { id: 'staff1', name: 'Ana Souza', role: 'reception', clinicId: 'clinic1', isActive: true },
  { id: 'staff2', name: 'Carlos Vendas', role: 'seller', clinicId: 'clinic1', isActive: true },
  { id: 'staff3', name: 'Mariana Atendimento', role: 'reception', clinicId: 'clinic2', isActive: true },
  { id: 'staff4', name: 'João Comercial', role: 'seller', clinicId: 'clinic2', isActive: true },
  { id: 'staff5', name: 'Patrícia Recepção', role: 'reception', clinicId: 'clinic3', isActive: true },
  { id: 'staff6', name: 'Roberto Sales', role: 'seller', clinicId: 'clinic3', isActive: true },
];

export const mockCommissionRules: CommissionRule[] = [
  // ===== CLINIC 1 - Odonto Premium Centro =====
  // Regra geral - 30% para todos os profissionais
  {
    id: 'cr1',
    clinicId: 'clinic1',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 30,
    isActive: true,
    priority: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    notes: 'Comissão padrão para todos os profissionais',
  },
  // Dr. Carlos - 45% em implantes
  {
    id: 'cr2',
    clinicId: 'clinic1',
    professionalId: 'prof1',
    beneficiaryType: 'professional',
    procedure: 'Implante Unitário',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 45,
    isActive: true,
    priority: 36,
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z',
    notes: 'Comissão especial para implantes',
  },
  // Regra para sábados - valor fixo R$50 por atendimento
  {
    id: 'cr3',
    clinicId: 'clinic1',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'all',
    dayOfWeek: 'saturday',
    calculationType: 'fixed',
    calculationUnit: 'appointment',
    value: 50,
    isActive: true,
    priority: 11,
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
    notes: 'Adicional fixo para plantões aos sábados',
  },
  // Comissão vendedor - 5% para qualquer vendedor
  {
    id: 'cr9',
    clinicId: 'clinic1',
    professionalId: 'all',
    beneficiaryType: 'seller',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 5,
    isActive: true,
    priority: 1,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    notes: 'Comissão de 5% para vendedor responsável pelo lead',
  },

  // ===== CLINIC 2 - Sorriso Perfeito Odontologia =====
  // Regra geral - 35% para todos os profissionais
  {
    id: 'cr4',
    clinicId: 'clinic2',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 35,
    isActive: true,
    priority: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  // Dra. Ana Costa - 45% em clareamento
  {
    id: 'cr5',
    clinicId: 'clinic2',
    professionalId: 'prof2',
    beneficiaryType: 'professional',
    procedure: 'Clareamento',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 45,
    isActive: true,
    priority: 36,
    createdAt: '2025-01-08T00:00:00Z',
    updatedAt: '2025-01-08T00:00:00Z',
    notes: 'Comissão especial para clareamentos',
  },
  // Regra por arcada (Alinhadores)
  {
    id: 'cr11',
    clinicId: 'clinic2',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'Alinhadores (arcada)',
    dayOfWeek: 'all',
    calculationType: 'fixed',
    calculationUnit: 'arch',
    value: 300,
    isActive: true,
    priority: 16,
    createdAt: '2025-01-18T00:00:00Z',
    updatedAt: '2025-01-18T00:00:00Z',
    notes: 'R$300 por arcada tratada',
  },
  // Regra por mL (Toxina)
  {
    id: 'cr10',
    clinicId: 'clinic2',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'Aplicação de Toxina Botulínica (ml)',
    dayOfWeek: 'all',
    calculationType: 'fixed',
    calculationUnit: 'ml',
    value: 25,
    isActive: true,
    priority: 16,
    createdAt: '2025-01-18T00:00:00Z',
    updatedAt: '2025-01-18T00:00:00Z',
    notes: 'R$25 por ml aplicado',
  },
  // Comissão vendedor - 4% para qualquer vendedor
  {
    id: 'cr12',
    clinicId: 'clinic2',
    professionalId: 'all',
    beneficiaryType: 'seller',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 4,
    isActive: true,
    priority: 1,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    notes: 'Comissão de 4% para vendedor responsável',
  },

  // ===== CLINIC 3 - Centro Odontológico Jardins =====
  // Regra geral - 28% padrão
  {
    id: 'cr6',
    clinicId: 'clinic3',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 28,
    isActive: true,
    priority: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  // Dra. Carla Mendes - 40% em tratamento de canal
  {
    id: 'cr7',
    clinicId: 'clinic3',
    professionalId: 'prof3',
    beneficiaryType: 'professional',
    procedure: 'Tratamento de Canal',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 40,
    isActive: true,
    priority: 36,
    createdAt: '2025-01-12T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    notes: 'Especialista em endodontia',
  },
  // Comissão vendedor - 6% para qualquer vendedor
  {
    id: 'cr13',
    clinicId: 'clinic3',
    professionalId: 'all',
    beneficiaryType: 'seller',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 6,
    isActive: true,
    priority: 1,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    notes: 'Comissão de 6% para vendedor responsável',
  },
];

export const mockCommissionCalculations: CommissionCalculation[] = [
  {
    id: 'calc1',
    appointmentId: 'ag1',
    professionalId: 'prof1',
    professionalName: 'Dr. Carlos Oliveira',
    beneficiaryType: 'professional',
    clinicId: 'clinic1',
    clinicName: 'Odonto Premium Centro',
    procedure: 'Avaliação Inicial',
    serviceValue: 150,
    quantity: 1,
    commissionRuleId: 'cr1',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    ruleValue: 30,
    commissionAmount: 45,
    date: '2025-01-20',
    status: 'paid',
    paidAt: '2025-01-20T18:00:00Z',
    transactionId: 'tr1',
    sellerId: 'staff2',
    sellerName: 'Carlos Vendas',
    leadSource: 'instagram',
  },
  {
    id: 'calc2',
    appointmentId: 'ag2',
    professionalId: 'prof2',
    professionalName: 'Dra. Ana Costa',
    beneficiaryType: 'professional',
    clinicId: 'clinic2',
    clinicName: 'Sorriso Perfeito Odontologia',
    procedure: 'Limpeza Dental',
    serviceValue: 180,
    quantity: 1,
    commissionRuleId: 'cr4',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    ruleValue: 35,
    commissionAmount: 63,
    date: '2025-01-20',
    status: 'pending',
    sellerId: 'staff4',
    sellerName: 'João Comercial',
    leadSource: 'whatsapp',
  },
  {
    id: 'calc3',
    appointmentId: 'ag3',
    professionalId: 'prof1',
    professionalName: 'Dr. Carlos Oliveira',
    beneficiaryType: 'professional',
    clinicId: 'clinic1',
    clinicName: 'Odonto Premium Centro',
    procedure: 'Retorno',
    serviceValue: 80,
    quantity: 1,
    commissionRuleId: 'cr1',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    ruleValue: 30,
    commissionAmount: 24,
    date: '2025-01-20',
    status: 'paid',
    paidAt: '2025-01-20T18:00:00Z',
    transactionId: 'tr2',
  },
  {
    id: 'calc4',
    appointmentId: 'ag4',
    professionalId: 'prof2',
    professionalName: 'Dra. Ana Costa',
    beneficiaryType: 'professional',
    clinicId: 'clinic2',
    clinicName: 'Sorriso Perfeito Odontologia',
    procedure: 'Clareamento',
    serviceValue: 750,
    quantity: 1,
    commissionRuleId: 'cr5',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    ruleValue: 45,
    commissionAmount: 337.5,
    date: '2025-01-21',
    status: 'pending',
    sellerId: 'staff4',
    sellerName: 'João Comercial',
    leadSource: 'paid_traffic',
  },
  {
    id: 'calc5',
    appointmentId: 'ag5',
    professionalId: 'prof3',
    professionalName: 'Dra. Carla Mendes',
    beneficiaryType: 'professional',
    clinicId: 'clinic3',
    clinicName: 'Centro Odontológico Jardins',
    procedure: 'Tratamento de Canal',
    serviceValue: 700,
    quantity: 1,
    commissionRuleId: 'cr7',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    ruleValue: 40,
    commissionAmount: 280,
    date: '2025-01-22',
    status: 'pending',
    sellerId: 'staff6',
    sellerName: 'Roberto Sales',
    leadSource: 'referral',
  },
  // Comissão de vendedor - ag1
  {
    id: 'calc6',
    appointmentId: 'ag1',
    professionalId: 'prof1',
    professionalName: 'Dr. Carlos Oliveira',
    beneficiaryType: 'seller',
    beneficiaryId: 'staff2',
    beneficiaryName: 'Carlos Vendas',
    clinicId: 'clinic1',
    clinicName: 'Odonto Premium Centro',
    procedure: 'Avaliação Inicial',
    serviceValue: 150,
    quantity: 1,
    commissionRuleId: 'cr9',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    ruleValue: 5,
    commissionAmount: 7.5,
    date: '2025-01-20',
    status: 'pending',
    leadSource: 'instagram',
  },
  // Comissão de vendedor - ag2
  {
    id: 'calc7',
    appointmentId: 'ag2',
    professionalId: 'prof2',
    professionalName: 'Dra. Ana Costa',
    beneficiaryType: 'seller',
    beneficiaryId: 'staff4',
    beneficiaryName: 'João Comercial',
    clinicId: 'clinic2',
    clinicName: 'Sorriso Perfeito Odontologia',
    procedure: 'Limpeza Dental',
    serviceValue: 180,
    quantity: 1,
    commissionRuleId: 'cr12',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    ruleValue: 4,
    commissionAmount: 7.2,
    date: '2025-01-20',
    status: 'pending',
    leadSource: 'whatsapp',
  },
];

// Função para calcular comissão baseada nas regras
export function calculateCommission(
  rules: CommissionRule[],
  professionalId: string,
  procedure: string,
  serviceValue: number,
  date: Date,
  quantity: number = 1
): { rule: CommissionRule | null; amount: number } {
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as CommissionRule['dayOfWeek'];

  // Filtra regras aplicáveis e ordena por prioridade (maior primeiro)
  const applicableRules = rules
    .filter(rule => {
      if (!rule.isActive) return false;
      if (rule.beneficiaryType !== 'professional') return false; // Main calculation is for professionals
      
      // Verifica profissional
      if (rule.professionalId !== 'all' && rule.professionalId !== professionalId) return false;
      
      // Verifica procedimento
      if (rule.procedure !== 'all' && rule.procedure !== procedure) return false;
      
      // Verifica dia da semana
      if (rule.dayOfWeek !== 'all' && rule.dayOfWeek !== dayOfWeek) return false;
      
      return true;
    })
    .sort((a, b) => b.priority - a.priority);

  if (applicableRules.length === 0) {
    return { rule: null, amount: 0 };
  }

  const rule = applicableRules[0];
  let amount: number;

  if (rule.calculationType === 'percentage') {
    amount = (serviceValue * rule.value) / 100;
  } else {
    // Fixed value - multiply by quantity for unit-based calculations
    if (rule.calculationUnit !== 'appointment') {
      amount = rule.value * quantity;
    } else {
      amount = rule.value;
    }
  }

  return { rule, amount };
}

// Função para gerar resumo de comissões por profissional
export function generateCommissionSummary(calculations: CommissionCalculation[]): CommissionSummary[] {
  const summaryMap = new Map<string, CommissionSummary>();

  calculations.forEach(calc => {
    const key = `${calc.beneficiaryType}-${calc.beneficiaryId || calc.professionalId}`;
    const existing = summaryMap.get(key);
    
    if (existing) {
      existing.totalServices++;
      existing.totalRevenue += calc.serviceValue;
      existing.totalCommission += calc.commissionAmount;
      if (calc.status === 'pending') {
        existing.pendingCommission += calc.commissionAmount;
      } else if (calc.status === 'paid') {
        existing.paidCommission += calc.commissionAmount;
      }
    } else {
      const displayName = calc.beneficiaryName || calc.professionalName;
      summaryMap.set(key, {
        professionalId: calc.beneficiaryId || calc.professionalId,
        professionalName: displayName,
        beneficiaryType: calc.beneficiaryType,
        totalServices: 1,
        totalRevenue: calc.serviceValue,
        totalCommission: calc.commissionAmount,
        pendingCommission: calc.status === 'pending' ? calc.commissionAmount : 0,
        paidCommission: calc.status === 'paid' ? calc.commissionAmount : 0,
        averageCommissionRate: 0,
      });
    }
  });

  // Calcula taxa média
  summaryMap.forEach(summary => {
    if (summary.totalRevenue > 0) {
      summary.averageCommissionRate = (summary.totalCommission / summary.totalRevenue) * 100;
    }
  });

  return Array.from(summaryMap.values());
}
