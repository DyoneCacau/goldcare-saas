import { supabase } from '@/integrations/supabase/client';
import { CommissionRule } from '@/types/commission';

/**
 * Service for generating commissions when a payment is confirmed
 * This is the SINGLE SOURCE OF TRUTH for commission generation
 */

interface GenerateCommissionsParams {
  paymentId: string;
  clinicId: string;
  appointmentId?: string;
  professionalId?: string;
  procedure?: string;
  appointmentDate?: Date;
  sellerId?: string;
  receptionistId?: string;
}

interface CommissionResult {
  id: string;
  beneficiaryId: string;
  beneficiaryType: 'professional' | 'seller' | 'reception';
  amount: number;
  baseValue: number;
  percentage: number | null;
}

/**
 * Check if commissions already exist for this payment (IDEMPOTENCY)
 */
export async function hasCommissionsForPayment(paymentId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('commissions')
    .select('id')
    .eq('payment_id', paymentId)
    .limit(1);

  if (error) {
    console.error('Error checking existing commissions:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Fetch applicable commission rules from Supabase
 */
async function fetchApplicableRules(
  clinicId: string,
  professionalId: string,
  procedure: string,
  date: Date,
  sellerId?: string
): Promise<CommissionRule[]> {
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    date.getDay()
  ] as CommissionRule['dayOfWeek'];

  const { data: allRules, error } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching commission rules:', error);
    throw new Error('Erro ao buscar regras de comissão');
  }

  if (!allRules || allRules.length === 0) {
    console.warn('No commission rules found for clinic:', clinicId);
    return [];
  }

  // Transform and filter
  const applicableRules = allRules
    .map((rule) => ({
      id: rule.id,
      clinicId: rule.clinic_id,
      professionalId: rule.professional_id,
      beneficiaryType: rule.beneficiary_type as 'professional' | 'seller' | 'reception',
      beneficiaryId: rule.beneficiary_id,
      beneficiaryName: rule.beneficiary_name,
      procedure: rule.procedure,
      dayOfWeek: rule.day_of_week as CommissionRule['dayOfWeek'],
      calculationType: rule.calculation_type as 'percentage' | 'fixed',
      calculationUnit: rule.calculation_unit as CommissionRule['calculationUnit'],
      value: parseFloat(rule.value),
      isActive: rule.is_active,
      priority: rule.priority,
      notes: rule.notes,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at,
    }))
    .filter((rule) => {
      if (rule.beneficiaryType === 'professional') {
        if (rule.professionalId !== 'all' && rule.professionalId !== professionalId) return false;
      }
      if (rule.procedure !== 'all' && rule.procedure !== procedure) return false;
      if (rule.dayOfWeek !== 'all' && rule.dayOfWeek !== dayOfWeek) return false;
      if (rule.beneficiaryType === 'seller') {
        if (!sellerId) return false;
        if (rule.beneficiaryId && rule.beneficiaryId !== sellerId) return false;
      }
      return true;
    })
    .sort((a, b) => b.priority - a.priority);

  // Group by beneficiary
  const rulesByBeneficiary = new Map<string, CommissionRule>();
  applicableRules.forEach((rule) => {
    const key = `${rule.beneficiaryType}-${rule.beneficiaryId || 'general'}`;
    if (!rulesByBeneficiary.has(key)) {
      rulesByBeneficiary.set(key, rule);
    }
  });

  return Array.from(rulesByBeneficiary.values());
}

/**
 * Calculate commission amount based on rule
 */
function calculateAmount(
  rule: CommissionRule,
  serviceValue: number,
  quantity: number = 1
): { amount: number; percentage: number | null } {
  if (rule.calculationType === 'percentage') {
    const amount = (serviceValue * rule.value) / 100;
    return { amount, percentage: rule.value };
  }

  if (rule.calculationUnit !== 'appointment') {
    return { amount: rule.value * quantity, percentage: null };
  }

  return { amount: rule.value, percentage: null };
}

/**
 * Generate commissions when payment is confirmed
 * THIS IS THE CORE FUNCTION - CALLED WHEN PAYMENT STATUS = 'CONFIRMED'
 */
export async function generateCommissionsForPayment(
  params: GenerateCommissionsParams
): Promise<CommissionResult[]> {
  const {
    paymentId,
    clinicId,
    appointmentId,
    professionalId,
    procedure,
    appointmentDate,
    sellerId,
    receptionistId,
  } = params;

  // STEP 1: Check idempotency (CRITICAL)
  const alreadyExists = await hasCommissionsForPayment(paymentId);
  if (alreadyExists) {
    console.warn('Commissions already exist for payment:', paymentId);
    return []; // Don't generate duplicates
  }

  // STEP 2: Validate required data
  if (!appointmentId || !professionalId || !procedure || !appointmentDate) {
    console.warn('Missing appointment data, cannot generate commissions for payment:', paymentId);
    return [];
  }

  // STEP 3: Get payment amount
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('total_amount, paid_amount')
    .eq('id', paymentId)
    .single();

  if (paymentError || !payment) {
    throw new Error('Payment not found');
  }

  const serviceValue = parseFloat(payment.paid_amount || payment.total_amount);

  // STEP 4: Fetch applicable rules
  const applicableRules = await fetchApplicableRules(
    clinicId,
    professionalId,
    procedure,
    appointmentDate,
    sellerId
  );

  if (applicableRules.length === 0) {
    console.warn('No commission rules found for payment:', paymentId);
    return [];
  }

  // STEP 5: Calculate and insert commissions
  const commissionsToInsert: any[] = [];
  const results: CommissionResult[] = [];

  for (const rule of applicableRules) {
    if (rule.beneficiaryType === 'seller' && !sellerId && !rule.beneficiaryId) continue;
    if (rule.beneficiaryType === 'reception' && !receptionistId && !rule.beneficiaryId) continue;

    const { amount, percentage } = calculateAmount(rule, serviceValue, 1);

    let beneficiaryId = rule.beneficiaryId;
    if (rule.beneficiaryType === 'professional' && !beneficiaryId) {
      beneficiaryId = professionalId;
    } else if (rule.beneficiaryType === 'seller' && sellerId) {
      beneficiaryId = sellerId;
    } else if (rule.beneficiaryType === 'reception' && receptionistId) {
      beneficiaryId = receptionistId;
    }

    if (!beneficiaryId) continue;

    commissionsToInsert.push({
      clinic_id: clinicId,
      payment_id: paymentId, // CRITICAL: Links commission to payment
      appointment_id: appointmentId,
      beneficiary_id: beneficiaryId,
      beneficiary_type: rule.beneficiaryType,
      amount,
      base_value: serviceValue,
      percentage,
      status: 'pending',
    });

    results.push({
      id: '', // Will be filled after insert
      beneficiaryId,
      beneficiaryType: rule.beneficiaryType,
      amount,
      baseValue: serviceValue,
      percentage,
    });
  }

  // STEP 6: Insert into Supabase (TRANSACTION SAFETY)
  if (commissionsToInsert.length > 0) {
    const { data, error } = await supabase
      .from('commissions')
      .insert(commissionsToInsert)
      .select();

    if (error) {
      console.error('Error saving commissions:', error);
      throw new Error('Erro ao salvar comissões: ' + error.message);
    }

    // Update results with IDs
    if (data) {
      results.forEach((result, index) => {
        result.id = data[index].id;
      });
    }

    console.log(`✅ Generated ${results.length} commissions for payment ${paymentId}`);
  }

  return results;
}

/**
 * Cancel commissions when payment is cancelled/refunded
 */
export async function cancelCommissionsForPayment(paymentId: string): Promise<void> {
  const { error } = await supabase
    .from('commissions')
    .update({ status: 'cancelled' })
    .eq('payment_id', paymentId);

  if (error) {
    console.error('Error cancelling commissions:', error);
    throw new Error('Erro ao cancelar comissões');
  }

  console.log(`✅ Cancelled commissions for payment ${paymentId}`);
}
