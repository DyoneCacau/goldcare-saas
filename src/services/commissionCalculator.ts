import { supabase } from '@/integrations/supabase/client';
import { CommissionRule, calculateAutoPriority } from '@/types/commission';
import { AgendaAppointment } from '@/types/agenda';

/**
 * Service for calculating and persisting commissions to Supabase
 */

interface CalculateCommissionParams {
  appointmentId: string;
  clinicId: string;
  professionalId: string;
  procedure: string;
  appointmentDate: Date;
  serviceValue: number;
  quantity?: number;
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

  // Fetch all active rules for the clinic
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
    return [];
  }

  // Transform from snake_case to camelCase and filter applicable rules
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
      // Check professional match (for professional type rules)
      if (rule.beneficiaryType === 'professional') {
        if (rule.professionalId !== 'all' && rule.professionalId !== professionalId) return false;
      }

      // Check procedure match
      if (rule.procedure !== 'all' && rule.procedure !== procedure) return false;

      // Check day of week match
      if (rule.dayOfWeek !== 'all' && rule.dayOfWeek !== dayOfWeek) return false;

      // For seller rules, only include if seller is assigned
      if (rule.beneficiaryType === 'seller') {
        if (!sellerId) return false;
        if (rule.beneficiaryId && rule.beneficiaryId !== sellerId) return false;
      }

      return true;
    })
    .sort((a, b) => b.priority - a.priority);

  // Group by beneficiary type and get best rule for each
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

  // Fixed value - multiply by quantity for unit-based calculations
  if (rule.calculationUnit !== 'appointment') {
    return { amount: rule.value * quantity, percentage: null };
  }

  return { amount: rule.value, percentage: null };
}

/**
 * Calculate and persist commissions for an appointment
 */
export async function calculateAndSaveCommissions(
  params: CalculateCommissionParams
): Promise<CommissionResult[]> {
  const {
    appointmentId,
    clinicId,
    professionalId,
    procedure,
    appointmentDate,
    serviceValue,
    quantity = 1,
    sellerId,
    receptionistId,
  } = params;

  // 1. Fetch applicable rules
  const applicableRules = await fetchApplicableRules(
    clinicId,
    professionalId,
    procedure,
    appointmentDate,
    sellerId
  );

  if (applicableRules.length === 0) {
    console.warn('No commission rules found for this appointment');
    return [];
  }

  // 2. Calculate commissions
  const commissionsToInsert: any[] = [];
  const results: CommissionResult[] = [];

  for (const rule of applicableRules) {
    // Skip staff rules if no staff is assigned
    if (rule.beneficiaryType === 'seller' && !sellerId && !rule.beneficiaryId) continue;
    if (rule.beneficiaryType === 'reception' && !receptionistId && !rule.beneficiaryId) continue;

    const { amount, percentage } = calculateAmount(rule, serviceValue, quantity);

    // Determine beneficiary ID
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

  // 3. Insert into Supabase
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
  }

  return results;
}

/**
 * Get commissions for a specific beneficiary (professional, seller, etc.)
 */
export async function getCommissionsByBeneficiary(
  clinicId: string,
  beneficiaryId: string,
  filters?: {
    status?: 'pending' | 'paid' | 'cancelled';
    startDate?: string;
    endDate?: string;
  }
): Promise<any[]> {
  let query = supabase
    .from('commissions')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('beneficiary_id', beneficiaryId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching commissions:', error);
    throw new Error('Erro ao buscar comissões');
  }

  return data || [];
}

/**
 * Get commission summary for a beneficiary
 */
export async function getCommissionSummary(
  clinicId: string,
  beneficiaryId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  total: number;
  pending: number;
  paid: number;
  count: number;
}> {
  let query = supabase
    .from('commissions')
    .select('amount, status')
    .eq('clinic_id', clinicId)
    .eq('beneficiary_id', beneficiaryId);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching commission summary:', error);
    throw new Error('Erro ao buscar resumo de comissões');
  }

  const summary = {
    total: 0,
    pending: 0,
    paid: 0,
    count: data?.length || 0,
  };

  data?.forEach((commission) => {
    const amount = parseFloat(commission.amount.toString());
    summary.total += amount;

    if (commission.status === 'pending') {
      summary.pending += amount;
    } else if (commission.status === 'paid') {
      summary.paid += amount;
    }
  });

  return summary;
}

/**
 * Check if commission already exists for an appointment
 */
export async function hasExistingCommission(
  appointmentId: string,
  beneficiaryType?: 'professional' | 'seller' | 'reception'
): Promise<boolean> {
  let query = supabase
    .from('commissions')
    .select('id')
    .eq('appointment_id', appointmentId);

  if (beneficiaryType) {
    query = query.eq('beneficiary_type', beneficiaryType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking existing commission:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}
