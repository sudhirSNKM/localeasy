/*
  # LocalEase Initial Schema

  ## Overview
  Full schema for LocalEase, a local business discovery and booking platform.

  ## Tables

  ### 1. profiles
  Extends auth.users with display info and role.
  - id: links to auth.users
  - full_name, phone, avatar_url: user display info
  - role: 'user' | 'admin' | 'super_admin'

  ### 2. categories
  Business categories (e.g., Hair, Spa, Dental).
  - name, icon, color: display info

  ### 3. businesses
  Business listings with approval workflow.
  - owner_id: references auth.users
  - status: 'pending' | 'approved' | 'rejected' (super_admin controls)
  - whatsapp: used for WhatsApp booking CTA

  ### 4. services
  Services offered by a business (price, duration).

  ### 5. bookings
  Customer bookings linking user → business → service.
  - status: 'pending' | 'confirmed' | 'completed' | 'cancelled'

  ### 6. promotions
  Time-limited discount promotions per business.
  - discount_pct: percentage discount
  - start_date / end_date: validity window

  ## Security
  - RLS enabled on all tables
  - Public read for approved businesses, categories, services, active promotions
  - Owners manage their own business data
  - Users manage their own bookings and profile
  - Super admins can manage everything via service role
*/

-- =====================
-- PROFILES
-- =====================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  avatar_url text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- =====================
-- CATEGORIES
-- =====================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'store',
  color text NOT NULL DEFAULT '#0EA5E9',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Super admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- =====================
-- BUSINESSES
-- =====================
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved businesses"
  ON businesses FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Owners can read own business"
  ON businesses FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Super admins can read all businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Admins can insert own business"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Super admins can update any business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- =====================
-- SERVICES
-- =====================
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 60,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active services of approved businesses"
  ON services FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.status = 'approved'
    )
  );

CREATE POLICY "Owners can read own business services"
  ON services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert services for own business"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update own business services"
  ON services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete own business services"
  ON services FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- =====================
-- BOOKINGS
-- =====================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  date date NOT NULL,
  time_slot text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Business owners can read bookings for their business"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can read all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Business owners can update booking status"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- =====================
-- PROMOTIONS
-- =====================
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount_pct integer NOT NULL DEFAULT 0 CHECK (discount_pct >= 0 AND discount_pct <= 100),
  start_date date NOT NULL,
  end_date date NOT NULL,
  image_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promotions of approved businesses"
  ON promotions FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.status = 'approved'
    )
  );

CREATE POLICY "Owners can read own business promotions"
  ON promotions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert promotions for own business"
  ON promotions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update own promotions"
  ON promotions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete own promotions"
  ON promotions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- =====================
-- SEED CATEGORIES
-- =====================
INSERT INTO categories (name, icon, color) VALUES
  ('Hair & Beauty', 'scissors', '#EC4899'),
  ('Spa & Wellness', 'sparkles', '#8B5CF6'),
  ('Dental', 'smile', '#0EA5E9'),
  ('Fitness', 'dumbbell', '#F59E0B'),
  ('Restaurants', 'utensils', '#EF4444'),
  ('Auto Services', 'car', '#6B7280'),
  ('Home Services', 'home', '#10B981'),
  ('Photography', 'camera', '#F97316')
ON CONFLICT (name) DO NOTHING;

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_business_id ON promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
