# YTU Finance ERP

Küçük ve orta ölçekli mühendislik firmaları için geliştirilmiş web tabanlı finans ve iş takip sistemi. Veriler Supabase (PostgreSQL) üzerinde tutulur; Row Level Security ile her kullanıcı yalnızca kendi verilerine erişebilir.

---

## Modüller

| # | Modül | Açıklama |
|---|---|---|
| 1 | Dashboard | Gelir/gider özeti, bekleyen ödemeler, düşük stok uyarıları |
| 2 | Gelen İşler | Müşteriden alınan iş emirleri, iş durumu ve ödeme takibi |
| 3 | Giden İşler | Alt yüklenicilere verilen işler ve harç ücretleri |
| 4 | Faturalar | E-Arşiv / E-Fatura / Z Raporu yönetimi, otomatik KDV hesaplama |
| 5 | Firmalar | Firma kartları (vergi no, adres, sektör bilgileri) |
| 6 | Cariler | Müşteri ve tedarikçi hesap yönetimi |
| 7 | Banka & Kasa | Hesap tanımları, gelir/gider işlemleri, anlık bakiye |
| 8 | Ürünler & Stok | Ürün kartları, stok hareketleri, minimum stok uyarısı |
| 9 | Raporlamalar | Kâr-Zarar, KDV, Fatura, Stok ve Banka/Kasa raporları |

---

## Teknoloji Stack

| Katman | Teknoloji | Versiyon |
|---|---|---|
| Frontend | React + TypeScript | 19 / 5 |
| Stil | Tailwind CSS | 4 |
| Build | Vite | 7 |
| Router | React Router | 7 |
| Grafikler | Recharts | 3 |
| Veritabanı | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth | — |
| İkonlar | Lucide React | — |

---

## Gereksinimler

- Node.js 18+
- npm
- Supabase hesabı (ücretsiz plan yeterlidir)

---

## Kurulum

### 1. Depoyu klonlayın

```bash
git clone https://github.com/erdemasik001/planaks.git
cd planaks
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Supabase projesi oluşturun

1. [supabase.com](https://supabase.com) adresine gidin → **New project**
2. **Authentication → Sign In / Providers → Email** altında **"Confirm email"** seçeneğini **kapatın**
3. **SQL Editor → New query** bölümüne `supabase/schema.sql` dosyasının tamamını yapıştırın ve **Run** butonuna basın

### 4. Ortam değişkenlerini ayarlayın

Proje kök dizininde `.env` adında bir dosya oluşturun (`.env.example` şablonunu kullanabilirsiniz):

```env
VITE_SUPABASE_URL=https://<proje-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-key>
```

| Değişken | Nereden alınır |
|---|---|
| `VITE_SUPABASE_URL` | Settings → General → Project ID → `https://<id>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Settings → API Keys → Publishable key |

### 5. Uygulamayı başlatın

```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışır.

---

## Veritabanı Şeması

Tüm tablo tanımları, ilişkiler ve Row Level Security politikaları `supabase/schema.sql` dosyasındadır.

```
auth.users              ← Supabase Auth (yerleşik)
profiles                ← Kullanıcı adı ve rol bilgisi
gelen_isler             ← Gelen iş emirleri
giden_isler             ← Giden iş emirleri
faturalar               ← Fatura kayıtları
firmalar                ← Firma kartları
cariler                 ← Cari hesaplar
banka_hesaplari         ← Banka ve kasa hesapları
islemler                ← Gelir/gider işlemleri (banka_hesaplari'na bağlı)
urunler                 ← Ürün kartları
stok_hareketleri        ← Stok giriş/çıkış hareketleri (urunler'e bağlı)
```

Tüm tablolar `user_id UUID` alanı içerir. RLS politikaları sayesinde kullanıcılar yalnızca `auth.uid() = user_id` koşulunu sağlayan satırlara erişebilir.

Yeni kullanıcı kaydında `profiles` tablosu bir veritabanı trigger'ı (`handle_new_user`) ile otomatik olarak doldurulur.

---

## Proje Yapısı

```
planaks/
├── src/
│   ├── components/         # Yeniden kullanılabilir UI bileşenleri (Modal, Pagination…)
│   ├── layouts/            # DashboardLayout (sidebar, tema, oturum kontrolü)
│   ├── lib/
│   │   ├── api.ts          # CRUD (getAll/create/update/remove) + auth fonksiyonları
│   │   └── supabase.ts     # Supabase client başlatma
│   ├── pages/              # Sayfa bileşenleri (Login, Dashboard, Faturalar…)
│   ├── types/
│   │   └── index.ts        # TypeScript arayüz tanımları
│   ├── App.tsx             # Route tanımları
│   └── main.tsx            # Uygulama giriş noktası
├── supabase/
│   └── schema.sql          # Veritabanı şeması ve RLS politikaları
├── public/                 # Statik dosyalar
├── .env.example            # Ortam değişkeni şablonu
├── vite.config.ts          # Vite yapılandırması
├── tailwind.config.js      # Tailwind yapılandırması
└── README.md
```

---

## Production Build

```bash
npm run build
```

Çıktı `dist/` klasörüne yazılır. Vercel, Netlify veya benzeri statik hosting servislerine deploy edilebilir.

> **Not:** Deploy sırasında `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` ortam değişkenlerini hosting platformunun ayarlarına da eklemeniz gerekir.
