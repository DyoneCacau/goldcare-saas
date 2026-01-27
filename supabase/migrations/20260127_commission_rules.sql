-- Create enum types for commission rules
CREATE TYPE calculation_type AS ENUM ('percentage', 'fixed');
CREATE TYPE calculation_unit AS ENUM ('appointment', 'ml', 'arch', 'unit', 'session');
CREATE TYPE beneficiary_type AS ENUM ('professional', 'seller', 'reception');
CREATE TYPE day_of_week_enum AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'all');

-- Create commission_rules table
CREATE TABLE IF NOT EXISTS public.commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    professional_id VARCHAR NOT NULL, -- Can be UUID or 'all'
    beneficiary_type beneficiary_type NOT NULL,
    beneficiary_id UUID, -- Optional: for seller/reception specific rules
    beneficiary_name VARCHAR,
    procedure VARCHAR NOT NULL, -- Can be procedure name or 'all'
    day_of_week day_of_week_enum NOT NULL DEFAULT 'all',
    calculation_type calculation_type NOT NULL,
    calculation_unit calculation_unit NOT NULL DEFAULT 'appointment',
    value DECIMAL(10,2) NOT NULL, -- percentage (0-100) or fixed amount
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_value CHECK (
        (calculation_type = 'percentage' AND value >= 0 AND value <= 100) OR
        (calculation_type = 'fixed' AND value >= 0)
    )
);

-- Create index for faster queries
CREATE INDEX idx_commission_rules_clinic_id ON public.commission_rules(clinic_id);
CREATE INDEX idx_commission_rules_professional_id ON public.commission_rules(professional_id);
CREATE INDEX idx_commission_rules_beneficiary ON public.commission_rules(beneficiary_type, beneficiary_id);
CREATE INDEX idx_commission_rules_active ON public.commission_rules(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view commission rules from their clinic" ON public.commission_rules;
DROP POLICY IF EXISTS "Admins can manage commission rules" ON public.commission_rules;
DROP POLICY IF EXISTS "Super admins can manage all commission rules" ON public.commission_rules;

-- RLS Policies for commission_rules
CREATE POLICY "Users can view commission rules from their clinic"
    ON public.commission_rules
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage commission rules"
    ON public.commission_rules
    FOR ALL
    USING (
        clinic_id IN (
            SELECT cu.clinic_id
            FROM public.clinic_users cu
            JOIN public.user_roles ur ON ur.user_id = cu.user_id
            WHERE cu.user_id = auth.uid()
            AND ur.role IN ('admin', 'superadmin')
        )
    )
    WITH CHECK (
        clinic_id IN (
            SELECT cu.clinic_id
            FROM public.clinic_users cu
            JOIN public.user_roles ur ON ur.user_id = cu.user_id
            WHERE cu.user_id = auth.uid()
            AND ur.role IN ('admin', 'superadmin')
        )
    );

-- Update updated_at trigger
CREATE OR REPLACE TRIGGER update_commission_rules_updated_at
    BEFORE UPDATE ON public.commission_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.commission_rules IS 'Commission calculation rules for professionals, sellers, and reception staff';
