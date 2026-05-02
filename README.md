# YTU Finance ERP

Küçük ve orta ölçekli mühendislik firmaları için geliştirilmiş web tabanlı finans ve iş takip sistemi.  
Veriler **Supabase (PostgreSQL)** üzerinde tutulur; Row Level Security ile her kullanıcı yalnızca kendi verilerine erişebilir.

---

## Sistem Gereksinimleri

| Gereksinim | Minimum Versiyon |
|---|---|
| Node.js | 18.x |
| npm | 9.x |
| Supabase hesabı | Ücretsiz plan yeterlidir |

---

## Kullanılan Kütüphaneler

### Üretim Bağımlılıkları

| Kütüphane | Versiyon | Kullanım Amacı |
|---|---|---|
| `react` | ^19.2.0 | UI framework |
| `react-dom` | ^19.2.0 | React DOM renderer |
| `react-router-dom` | ^7.13.0 | Sayfa yönlendirme |
| `@supabase/supabase-js` | ^2.95.3 | Veritabanı ve kimlik doğrulama |
| `recharts` | ^3.8.1 | Grafik ve veri görselleştirme |
| `lucide-react` | ^0.563.0 | İkon seti |
| `tailwind-merge` | ^3.4.0 | Tailwind sınıf birleştirme yardımcısı |
| `clsx` | ^2.1.1 | Koşullu CSS sınıf yönetimi |
| `date-fns` | ^4.1.0 | Tarih biçimlendirme ve hesaplama |

### Geliştirme Bağımlılıkları

| Kütüphane | Versiyon | Kullanım Amacı |
|---|---|---|
| `typescript` | ~5.9.3 | Statik tip denetimi |
| `vite` | ^7.3.1 | Geliştirme sunucusu ve build aracı |
| `@vitejs/plugin-react` | ^5.1.1 | Vite için React desteği |
| `tailwindcss` | ^4.1.18 | Utility-first CSS framework |
| `@tailwindcss/vite` | ^4.1.18 | Tailwind için Vite entegrasyonu |
| `eslint` | ^9.39.1 | Kod kalite denetimi |

---

## Ortam Değişkenleri

Uygulamanın çalışabilmesi için proje kök dizininde `.env` dosyası oluşturulmalıdır.  
Şablon olarak `.env.example` dosyasını kopyalayabilirsiniz:

```bash
cp .env.example .env
```

`.env` dosyası içeriği:

```env
VITE_SUPABASE_URL=https://<proje-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-key>
```

| Değişken | Açıklama | Nereden Alınır |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase proje API adresi | Supabase Dashboard → Settings → General → Project ID ile `https://<id>.supabase.co` formatında oluşturulur |
| `VITE_SUPABASE_ANON_KEY` | Supabase genel erişim anahtarı | Supabase Dashboard → Settings → API Keys → **Publishable key** |

> `.env` dosyası `.gitignore` ile versiyon kontrolünden hariç tutulmuştur. Anahtarlarınızı asla repoya commit etmeyiniz.

---

## Veritabanı Kurulumu

Veritabanı olarak **Supabase (PostgreSQL)** kullanılmaktadır. Tüm tablo tanımları, ilişkiler ve Row Level Security politikaları `supabase/schema.sql` dosyasında bulunmaktadır.

### Tablolar

| Tablo | Açıklama | İlişki |
|---|---|---|
| `auth.users` | Supabase Auth — kimlik doğrulama (yerleşik) | — |
| `profiles` | Kullanıcı adı ve rol bilgisi | `auth.users.id` |
| `gelen_isler` | Müşteriden alınan iş emirleri | `auth.users.id` |
| `giden_isler` | Alt yüklenicilere verilen işler | `auth.users.id` |
| `faturalar` | E-Arşiv / E-Fatura / Z Raporu kayıtları | `auth.users.id` |
| `firmalar` | Firma kartları | `auth.users.id` |
| `cariler` | Müşteri ve tedarikçi hesapları | `auth.users.id` |
| `banka_hesaplari` | Banka hesabı ve kasa tanımları | `auth.users.id` |
| `islemler` | Gelir/gider işlem kayıtları | `auth.users.id`, `banka_hesaplari.id` |
| `urunler` | Ürün kataloğu | `auth.users.id` |
| `stok_hareketleri` | Stok giriş/çıkış/sayım hareketleri | `auth.users.id`, `urunler.id` |

Her tablo `user_id UUID` alanı içerir. **Row Level Security (RLS)** politikaları sayesinde her kullanıcı yalnızca `auth.uid() = user_id` koşulunu sağlayan satırlara erişebilir.

### Şemayı Uygulamak

1. [supabase.com](https://supabase.com) → **SQL Editor** → **New query**
2. `supabase/schema.sql` dosyasının tamamını yapıştırın
3. **Run** butonuna basın

---

## Kurulum ve Çalıştırma

### 1. Depoyu klonlayın

```bash
git clone https://github.com/erdemasik001/ytuFinance.git
cd ytuFinance
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Supabase ayarlarını yapın

1. [supabase.com](https://supabase.com) → **New project** ile yeni proje oluşturun
2. **Authentication → Sign In / Providers → Email** altında **"Confirm email"** seçeneğini **kapatın**
3. `supabase/schema.sql` dosyasını SQL Editor'da çalıştırın (bkz. Veritabanı Kurulumu)

### 4. Ortam değişkenlerini tanımlayın

```bash
cp .env.example .env
# .env dosyasını açıp VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini doldurun
```

### 5. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışır.

---

## Modüller

| # | Modül | Açıklama |
|---|---|---|
| 1 | Dashboard | Gelir/gider özeti, bekleyen ödemeler, düşük stok uyarıları |
| 2 | Gelen İşler | Müşteriden alınan iş emirleri; iş durumu ve ödeme takibi |
| 3 | Giden İşler | Alt yüklenicilere verilen işler ve harç ücretleri |
| 4 | Faturalar | E-Arşiv / E-Fatura / Z Raporu; otomatik KDV hesaplama |
| 5 | Firmalar | Firma kartları — vergi no, adres, sektör bilgileri |
| 6 | Cariler | Müşteri ve tedarikçi hesap yönetimi |
| 7 | Banka & Kasa | Hesap tanımları, gelir/gider işlemleri, anlık bakiye |
| 8 | Ürünler & Stok | Ürün kartları, stok hareketleri, minimum stok uyarısı |
| 9 | Raporlamalar | Kâr-Zarar, KDV, Fatura, Stok ve Banka/Kasa raporları |

---

## Proje Yapısı

```
ytuFinance/
├── src/
│   ├── components/         # Yeniden kullanılabilir UI bileşenleri (Modal, Pagination…)
│   ├── layouts/            # DashboardLayout — sidebar, tema, oturum kontrolü
│   ├── lib/
│   │   ├── api.ts          # CRUD (getAll / create / update / remove) + auth fonksiyonları
│   │   └── supabase.ts     # Supabase client başlatma
│   ├── pages/              # Sayfa bileşenleri (Login, Dashboard, Faturalar…)
│   ├── types/
│   │   └── index.ts        # TypeScript arayüz tanımları
│   ├── App.tsx             # Route tanımları ve oturum koruması
│   └── main.tsx            # Uygulama giriş noktası
├── supabase/
│   └── schema.sql          # Veritabanı şeması ve RLS politikaları
├── public/                 # Statik dosyalar
├── .env.example            # Ortam değişkeni şablonu
├── vite.config.ts          # Vite yapılandırması
└── README.md
```

---

## Production Build

```bash
npm run build
```

Çıktı `dist/` klasörüne yazılır. Vercel, Netlify veya benzeri statik hosting servislerine deploy edilebilir.

> Deploy sırasında `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini hosting platformunun ortam değişkenleri bölümüne de eklemeniz gerekir.
