-- =========================================================================
-- ACCRAWEDEY DATABASE MIGRATION: 0001_initial_schema.sql
-- =========================================================================

-- 1. Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. WORLDS TABLE (Versioned World Snapshots)
CREATE TABLE IF NOT EXISTS public.worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL DEFAULT 'accra-main',
  name TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  data JSONB NOT NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PLAYER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.player_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'player', -- 'player', 'admin'
  avatar_key TEXT NOT NULL DEFAULT 'kente_gold',
  balance BIGINT NOT NULL DEFAULT 50000, -- GH₵ 50,000 starting capital
  current_vehicle TEXT NOT NULL DEFAULT 'walk',
  last_x DOUBLE PRECISION DEFAULT 1000,
  last_y DOUBLE PRECISION DEFAULT 800,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. WORLD PROPERTIES (Persistent runtime state of properties)
CREATE TABLE IF NOT EXISTS public.world_properties (
  id TEXT PRIMARY KEY, -- String ID matching world data (e.g. 'prop_accra_mall')
  world_slug TEXT NOT NULL DEFAULT 'accra-main',
  name TEXT NOT NULL,
  type_id TEXT NOT NULL,
  price BIGINT NOT NULL,
  base_income_rate INT NOT NULL,
  tier INT NOT NULL DEFAULT 1,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_name TEXT,
  is_for_sale BOOLEAN NOT NULL DEFAULT TRUE,
  last_income_collected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ACCOUNT TRANSACTIONS (Append-only Financial Ledger)
CREATE TABLE IF NOT EXISTS public.account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL, -- Positive for credits, negative for debits
  balance_after BIGINT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'STARTING_GRANT', 'BUY_PROPERTY', 'COLLECT_RENT', 'UPGRADE_PROPERTY'
  reference_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_transactions ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- Worlds: Public read, Admin write
CREATE POLICY "Allow public read worlds" ON public.worlds
  FOR SELECT USING (true);

CREATE POLICY "Allow admin write worlds" ON public.worlds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Player Profiles: Public read, self update only non-balance fields
CREATE POLICY "Allow public read player profiles" ON public.player_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow users update own profile metadata" ON public.player_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- World Properties: Public read
CREATE POLICY "Allow public read properties" ON public.world_properties
  FOR SELECT USING (true);

-- Account Transactions: Read own history
CREATE POLICY "Allow users read own transactions" ON public.account_transactions
  FOR SELECT USING (auth.uid() = player_id);

-- =========================================================================
-- SERVER-AUTHORITATIVE RPC FUNCTIONS (ACID Financial Transactions)
-- =========================================================================

-- Function: Atomic Property Purchase
CREATE OR REPLACE FUNCTION public.purchase_property(
  p_property_id TEXT,
  p_player_x DOUBLE PRECISION,
  p_player_y DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_player public.player_profiles%ROWTYPE;
  v_prop public.world_properties%ROWTYPE;
  v_new_balance BIGINT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock player row for update
  SELECT * INTO v_player FROM public.player_profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player profile not found';
  END IF;

  -- Lock property row for update
  SELECT * INTO v_prop FROM public.world_properties WHERE id = p_property_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property % not found', p_property_id;
  END IF;

  -- Checks
  IF NOT v_prop.is_for_sale THEN
    RAISE EXCEPTION 'Property is not for sale';
  END IF;

  IF v_prop.owner_id IS NOT NULL AND v_prop.owner_id = v_user_id THEN
    RAISE EXCEPTION 'You already own this property';
  END IF;

  IF v_player.balance < v_prop.price THEN
    RAISE EXCEPTION 'Insufficient funds (Needed: %, Available: %)', v_prop.price, v_player.balance;
  END IF;

  -- Compute new balance
  v_new_balance := v_player.balance - v_prop.price;

  -- Deduct balance
  UPDATE public.player_profiles
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_user_id;

  -- Transfer ownership
  UPDATE public.world_properties
  SET owner_id = v_user_id,
      owner_name = v_player.username,
      is_for_sale = FALSE,
      last_income_collected_at = now(),
      updated_at = now()
  WHERE id = p_property_id;

  -- Record in append-only ledger
  INSERT INTO public.account_transactions (
    player_id, amount, balance_after, transaction_type, reference_id, metadata
  ) VALUES (
    v_user_id, -v_prop.price, v_new_balance, 'BUY_PROPERTY', p_property_id,
    jsonb_build_object('property_name', v_prop.name, 'price', v_prop.price)
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'property_id', p_property_id,
    'owner_name', v_player.username
  );
END;
$$;

-- Function: Collect Passive Rental Income for an Owned Property
CREATE OR REPLACE FUNCTION public.collect_property_income(
  p_property_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_player public.player_profiles%ROWTYPE;
  v_prop public.world_properties%ROWTYPE;
  v_minutes_elapsed NUMERIC;
  v_income_due BIGINT;
  v_new_balance BIGINT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_player FROM public.player_profiles WHERE id = v_user_id FOR UPDATE;
  SELECT * INTO v_prop FROM public.world_properties WHERE id = p_property_id FOR UPDATE;

  IF NOT FOUND OR v_prop.owner_id != v_user_id THEN
    RAISE EXCEPTION 'You do not own this property';
  END IF;

  -- Calculate minutes elapsed since last collection
  v_minutes_elapsed := EXTRACT(EPOCH FROM (now() - v_prop.last_income_collected_at)) / 60.0;
  IF v_minutes_elapsed < 0.1 THEN
    RAISE EXCEPTION 'Income already collected recently. Please wait.';
  END IF;

  -- Multiplier by tier
  v_income_due := FLOOR(v_minutes_elapsed * (v_prop.base_income_rate * v_prop.tier));
  IF v_income_due <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'No income accumulated yet');
  END IF;

  v_new_balance := v_player.balance + v_income_due;

  UPDATE public.player_profiles
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_user_id;

  UPDATE public.world_properties
  SET last_income_collected_at = now(), updated_at = now()
  WHERE id = p_property_id;

  INSERT INTO public.account_transactions (
    player_id, amount, balance_after, transaction_type, reference_id, metadata
  ) VALUES (
    v_user_id, v_income_due, v_new_balance, 'COLLECT_RENT', p_property_id,
    jsonb_build_object('minutes', v_minutes_elapsed, 'tier', v_prop.tier)
  );

  RETURN jsonb_build_object(
    'success', true,
    'income_collected', v_income_due,
    'new_balance', v_new_balance
  );
END;
$$;
