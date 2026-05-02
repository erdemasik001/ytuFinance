-- ============================================================
-- YTU Finance ERP – Supabase Şeması
-- Supabase SQL Editor'da bu dosyayı çalıştırın.
-- ============================================================

-- ── 1. PROFILES (auth.users'ı genişletir) ───────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user',
  created_at  DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Kayıt sırasında profil oluşturma yetkisi
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Kayıt sonrası profile otomatik ekleyen trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'user',
    CURRENT_DATE
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. GELEN İŞLER ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gelen_isler (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  file_no         TEXT,
  customer_name   TEXT NOT NULL,
  job_name        TEXT NOT NULL,
  job_type        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'DEVAM EDİYOR',
  sale_amount     NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_status  TEXT NOT NULL DEFAULT 'ÖDENMEDİ',
  file_name       TEXT,
  note1           TEXT,
  note2           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gelen_isler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gelen_isler_policy" ON public.gelen_isler
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 3. GİDEN İŞLER ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.giden_isler (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  file_no         TEXT,
  customer_name   TEXT NOT NULL,
  job_name        TEXT NOT NULL,
  job_type        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'DEVAM EDİYOR',
  sale_amount     NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_status  TEXT NOT NULL DEFAULT 'ÖDENMEDİ',
  fee             NUMERIC(15,2) NOT NULL DEFAULT 0,
  note2           TEXT,
  note3           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.giden_isler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "giden_isler_policy" ON public.giden_isler
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4. FATURALAR ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faturalar (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  type            TEXT NOT NULL,
  invoice_no      TEXT,
  tax_no          TEXT,
  customer_name   TEXT NOT NULL,
  service_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate        NUMERIC(4,2) NOT NULL DEFAULT 0.20,
  total_amount    NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_status  TEXT NOT NULL DEFAULT 'Ödeme Bekleniyor',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faturalar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faturalar_policy" ON public.faturalar
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 5. FİRMALAR ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.firmalar (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  tax_no        TEXT,
  tax_office    TEXT,
  trade_reg_no  TEXT,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  sector        TEXT,
  created_at    DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.firmalar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "firmalar_policy" ON public.firmalar
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 6. CARİLER ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cariler (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'MÜŞTERİ',
  tax_no      TEXT,
  tax_office  TEXT,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  created_at  DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.cariler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cariler_policy" ON public.cariler
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 7. BANKA HESAPLARI ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banka_hesaplari (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  account_type     TEXT NOT NULL DEFAULT 'BANKA',
  bank_name        TEXT,
  iban             TEXT,
  currency         TEXT NOT NULL DEFAULT 'TRY',
  opening_balance  NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at       DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.banka_hesaplari ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banka_hesaplari_policy" ON public.banka_hesaplari
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 8. İŞLEMLER ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.islemler (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  account_id   UUID NOT NULL REFERENCES public.banka_hesaplari(id) ON DELETE CASCADE,
  direction    TEXT NOT NULL,
  type         TEXT NOT NULL,
  amount       NUMERIC(15,2) NOT NULL DEFAULT 0,
  description  TEXT NOT NULL,
  reference    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.islemler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "islemler_policy" ON public.islemler
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 9. ÜRÜNLER ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.urunler (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT,
  unit            TEXT NOT NULL DEFAULT 'ADET',
  sale_price      NUMERIC(15,2) NOT NULL DEFAULT 0,
  purchase_price  NUMERIC(15,2) NOT NULL DEFAULT 0,
  barcode         TEXT,
  min_stock       INTEGER NOT NULL DEFAULT 0,
  current_stock   INTEGER NOT NULL DEFAULT 0,
  created_at      DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.urunler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "urunler_policy" ON public.urunler
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 10. STOK HAREKETLERİ ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stok_hareketleri (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  product_id    UUID NOT NULL REFERENCES public.urunler(id) ON DELETE CASCADE,
  product_name  TEXT NOT NULL,
  type          TEXT NOT NULL,
  quantity      NUMERIC(15,3) NOT NULL DEFAULT 0,
  unit_price    NUMERIC(15,2) NOT NULL DEFAULT 0,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stok_hareketleri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stok_hareketleri_policy" ON public.stok_hareketleri
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
