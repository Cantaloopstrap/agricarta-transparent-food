-- ==========================================
-- AGRIKARTA DATABASE SCHEMA
-- Supabase PostgreSQL Schema with RLS and Constraints
-- ==========================================

-- 1. Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Types / ENUMs
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('farmer', 'distributor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'settlement', 'expire', 'cancel', 'deny');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLE: users
-- Stores farmer, distributor, and admin profile data
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role user_role DEFAULT 'farmer'::user_role NOT NULL,
    status_active BOOLEAN DEFAULT true NOT NULL,
    is_premium BOOLEAN DEFAULT false NOT NULL,
    premium_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABLE: harvest_reports
-- Stores crowdsourced harvest ingestion from farmers via WhatsApp Bot
CREATE TABLE IF NOT EXISTS public.harvest_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    commodity_name VARCHAR(100) NOT NULL,
    weight_kg NUMERIC(10, 2) NOT NULL,
    proof_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. TABLE: distributors
-- Stores persona score evaluations synced from Google Form / Edge Functions
CREATE TABLE IF NOT EXISTS public.distributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    score_kualitas NUMERIC(5, 2) DEFAULT 0,
    score_disiplin NUMERIC(5, 2) DEFAULT 0,
    score_sikap NUMERIC(5, 2) DEFAULT 0,
    score_kejujuran NUMERIC(5, 2) DEFAULT 0,
    avg_score NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. TABLE: transactions
-- Stores Midtrans payment transactions for premium access
CREATE TABLE IF NOT EXISTS public.transactions (
    order_id VARCHAR(100) PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status transaction_status DEFAULT 'pending'::transaction_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. TABLE: daily_prices
-- Stores historical daily price data scraped from SP2KP
CREATE TABLE IF NOT EXISTS public.daily_prices (
    date DATE NOT NULL,
    commodity_id VARCHAR(50) NOT NULL,
    actual_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (date, commodity_id)
);

-- 8. TABLE: price_predictions
-- Stores H+1 to H+7 LSTM deep learning price predictions & confidence bounds
CREATE TABLE IF NOT EXISTS public.price_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_date DATE NOT NULL,
    commodity_id VARCHAR(50) NOT NULL,
    predicted_price NUMERIC(12, 2) NOT NULL,
    confidence_low NUMERIC(12, 2) NOT NULL,
    confidence_high NUMERIC(12, 2) NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_harvest_reports_user_id ON public.harvest_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_distributors_phone ON public.distributors(phone);
CREATE INDEX IF NOT EXISTS idx_transactions_phone ON public.transactions(phone);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_daily_prices_date ON public.daily_prices(date);
CREATE INDEX IF NOT EXISTS idx_daily_prices_commodity ON public.daily_prices(commodity_id);
CREATE INDEX IF NOT EXISTS idx_price_predictions_date ON public.price_predictions(target_date);
CREATE INDEX IF NOT EXISTS idx_price_predictions_commodity ON public.price_predictions(commodity_id);

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read/write users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Banned users cannot read/write harvest_reports" 
ON public.harvest_reports FOR ALL 
USING (COALESCE((SELECT status_active FROM public.users WHERE users.id = harvest_reports.user_id), true) = true)
WITH CHECK (COALESCE((SELECT status_active FROM public.users WHERE users.id = harvest_reports.user_id), true) = true);

CREATE POLICY "Allow public read/write distributors" ON public.distributors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write daily_prices" ON public.daily_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write price_predictions" ON public.price_predictions FOR ALL USING (true) WITH CHECK (true);
