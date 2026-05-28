-- ============================================================
-- SCHEMA COMPLETO - Mentorat Roxana
-- Esegui questo intero file nel SQL Editor di Supabase
-- ============================================================

-- 1. PROFILES (estende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  stripe_customer_id text,
  stripe_payment_intent_id text,
  purchased_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role può sempre inserire (per webhook)
CREATE POLICY "Service role insert" ON profiles
  FOR INSERT WITH CHECK (true);

-- 2. AVAILABILITY (slot disponibili impostati da Roxana)
CREATE TABLE IF NOT EXISTS availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_booked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, start_time)
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone logged in can view availability" ON availability
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage availability" ON availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. BOOKINGS (prenotazioni clienti)
CREATE TABLE IF NOT EXISTS bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  availability_id uuid REFERENCES availability(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  meet_link text,
  client_notes text,
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients insert own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Admin can manage all bookings" ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. PLATFORM SETTINGS (prezzo, nome prodotto, ecc.)
CREATE TABLE IF NOT EXISTS platform_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- solo una riga
  price_amount integer DEFAULT 297,
  currency text DEFAULT 'eur',
  product_name text DEFAULT 'Mentorat Premium cu Roxana',
  product_description text DEFAULT 'De la 0 la 3000€ — Strategii personalizate pentru succesul tău online',
  sales_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Admin can update settings" ON platform_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT del record iniziale settings
INSERT INTO platform_settings (id, price_amount, currency, product_name, product_description, sales_active)
VALUES (1, 297, 'eur', 'Mentorat Premium cu Roxana', 'De la 0 la 3000€ — Strategii personalizate pentru succesul tău online', true)
ON CONFLICT (id) DO NOTHING;

-- 5. TRIGGER: crea profilo automaticamente quando un utente si registra via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
