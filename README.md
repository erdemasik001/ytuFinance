# YTU Finance — ERP System

Küçük ve orta ölçekli işletmeler için geliştirilmiş, dosya tabanlı, kurulum gerektirmeyen hafif bir ERP uygulamasıdır. Veritabanı ya da sunucu yazılımı kurmanıza gerek yoktur; tüm veriler yerel `.txt` dosyalarında JSON formatında saklanır.

---

## Özellikler

- **Çoklu kullanıcı desteği** — Her kullanıcının verileri birbirinden izole klasörlerde tutulur
- **Gelen / Giden iş takibi** — İş durumu, ödeme durumu, dosya numarası; düzenleme, silme, toplu işlem
- **Fatura yönetimi** — E-Arşiv, E-Fatura, Z Raporu; KDV otomatik hesaplanır; yazdırma desteği
- **Gelir & Gider İcmal tablosu** — Müşteri bazlı yıllık döküm, CSV/Excel export
- **Firma Yönetimi** — Vergi no, adres, sektör bilgileriyle tam CRUD
- **Cari Hesaplar** — Müşteri, tedarikçi veya her ikisi tipinde cari kayıt yönetimi
- **Banka & Kasa** — Banka hesabı ve kasa takibi; anlık bakiye hesaplama; GİRİŞ/ÇIKIŞ işlemleri
- **Stok & Ürünler** — Ürün kataloğu, stok hareketleri (GİRİŞ/ÇIKIŞ/SAYIM), düşük stok uyarısı
- **Raporlamalar** — Kâr-Zarar, KDV, Fatura, Stok, Banka/Kasa raporları; interaktif grafikler; CSV export
- **Sayfalama** — Tüm listelerde 15'li sayfalama ve akıllı sayfa numaralandırma
- **Dışa aktarım** — Tüm tablolar CSV olarak indirilebilir; faturalar yazdırılabilir
- **Karanlık / Aydınlık tema** — Elle değiştirilebilir, tercih tarayıcıda saklanır
- **Kullanıcı kimlik doğrulama** — Kayıt, giriş, şifre sıfırlama; route bazlı erişim koruması

---

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Arayüz | React 19 + TypeScript |
| Stil | Tailwind CSS v4 |
| Bundler | Vite 7 |
| Routing | React Router v7 |
| Grafikler | Recharts |
| API / Veri | Vite eklentisi + Node.js `fs` (dosya tabanlı) |
| İkonlar | Lucide React |

---

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde çalışır.

---

## Varsayılan Yönetici Hesabı

İlk açılışta kullanabileceğiniz hazır hesap:

| Alan | Değer |
|---|---|
| E-posta | `admin@ytufinance.com` |
| Şifre | `ytufinance2026` |

> Şifreyi değiştirmek için giriş ekranındaki **Şifremi Unuttum?** bağlantısını kullanabilirsiniz.

---

## Veri Yapısı

```
data/
├── kullanicilar.txt              ← Tüm kullanıcı hesapları (global)
├── admin/
│   ├── gelen-isler.txt
│   ├── giden-isler.txt
│   ├── faturalar.txt
│   ├── firmalar.txt
│   ├── cariler.txt
│   ├── banka-hesaplari.txt
│   ├── islemler.txt
│   ├── urunler.txt
│   └── stok-hareketleri.txt
└── <kullanici-adi>/
    └── (aynı dosya yapısı)
```

Her kullanıcı kayıt olduğunda kendi klasörü otomatik oluşturulur ve boş veri dosyaları eklenir. Bir kullanıcının verileri diğerine görünmez.

Tüm dosyalar **JSON array** formatında saklanır; elle düzenlenebilir ve yedeklenebilir.

---

## API

Vite geliştirme sunucusu, `vite.config.ts` içindeki özel eklenti aracılığıyla kendi dahili REST API'sini çalıştırır. Harici bir backend gerekmez.

### Kimlik Doğrulama

| Method | Endpoint | Body | Açıklama |
|---|---|---|---|
| `POST` | `/api/auth/login` | `{ email, password }` | Giriş yap, kullanıcı bilgisi döner |
| `POST` | `/api/auth/register` | `{ username, email, password }` | Yeni hesap oluştur |
| `POST` | `/api/auth/reset-password` | `{ email, newPassword }` | Şifre güncelle |

### Kullanıcı Kaynakları

Tüm CRUD işlemleri `/api/{kullanici-adi}/{kaynak}` şemasını izler:

| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/api/{user}/{kaynak}` | Tüm kayıtları listele |
| `POST` | `/api/{user}/{kaynak}` | Yeni kayıt ekle |
| `PUT` | `/api/{user}/{kaynak}/{id}` | Kayıt güncelle |
| `DELETE` | `/api/{user}/{kaynak}/{id}` | Kayıt sil |

**Kaynak adları:** `gelen-isler`, `giden-isler`, `faturalar`, `firmalar`, `cariler`, `banka-hesaplari`, `islemler`, `urunler`, `stok-hareketleri`

Giriş yapan kullanıcının adı `localStorage`'da tutulur; `src/lib/api.ts` her istekte bunu okuyarak doğru klasöre yönlenir.

---

## Sayfalar

### Ana Sayfa (`/`)
Toplam gelir, gider ve net bakiye kartları. Düşük stok uyarı bandı. Bekleyen ödemeler ve son işlemlerin özeti.

### Gelen İşler (`/gelen-isler`)
Müşterilerden alınan işlerin listesi. Durum ve ödeme durumuna göre filtreleme. Düzenleme, silme, toplu silme ve sayfalama desteği.

**İş tipleri:** EKB ÇİZİM VE ONAYI, EKB ÇİZİMİ, EKB ONAYI, ÖN HESAP SONUÇ FORMU, AKUSTİK RAPOR & PROJE, 3BSYM

**İş durumları:** TESLİM EDİLDİ, DEVAM EDİYOR, İPTAL EDİLDİ, BEKLEMEDE

### Giden İşler (`/giden-isler`)
Dışarıya verilen veya taşere edilen işler. Harç ücreti alanı dahil. Düzenleme, silme ve toplu işlem desteği.

### Faturalar (`/faturalar`)
E-Arşiv, E-Fatura ve Z Raporu takibi. Hizmet bedeli girildiğinde KDV otomatik hesaplanır. Yazdırma, düzenleme, toplu silme, CSV dışa aktarım.

### Gelir İcmal (`/gelir-icmal`)
Gelen işlerin müşteri bazında aylık dökümü. Yıl seçimi, toplam / alınan / kalan sütunları. CSV export.

### Gider İcmal (`/gider-icmal`)
Giden işlerin aynı formatta yıllık özeti. Harç ücreti de gider hesabına dahil edilir.

### Firmalar (`/firmalar`)
İş yapılan firmaların tam CRUD yönetimi. Vergi no, vergi dairesi, ticaret sicil no, adres, sektör alanları. Ad ve vergi no ile arama.

### Cari Hesaplar (`/cariler`)
Müşteri, tedarikçi veya her ikisi tipiyle cari kayıt yönetimi. Tip filtresi ve renk kodlu rozet gösterimi.

### Banka & Kasa (`/banka-kasa`)
Banka hesabı ve kasa tanımları. TRY/USD/EUR para birimi desteği. Başlangıç bakiyesi + GİRİŞ/ÇIKIŞ işlemleriyle anlık bakiye hesaplama. İşlem geçmişi tablosu ve sayfalama.

### Stok & Ürünler (`/urunler`)
Ürün kataloğu (satış/alış fiyatı, birim, barkod, minimum stok). Stok hareketleri: GİRİŞ, ÇIKIŞ ve SAYIM tipleri. Stok seviyesi görsel barı. Düşük stok uyarı bandı.

### Raporlamalar (`/raporlar`)

5 sekmeli raporlama modülü, tüm verilerden otomatik olarak hesaplanır:

| Sekme | İçerik |
|---|---|
| **Kâr-Zarar** | Aylık gelir/gider bar grafiği, net kâr çizgi grafiği, yıl karşılaştırma, CSV export |
| **KDV Raporu** | KDV oranına göre yığılmış bar grafik, aylık KDV tablosu, CSV export |
| **Fatura Raporu** | Aylık tutar bar grafiği, ödeme durumu pasta grafiği, fatura tip özeti |
| **Stok Raporu** | Kategori bazlı pasta grafik, stok tablosu, düşük stok listesi, CSV export |
| **Banka/Kasa** | Hesap bakiye kartları, aylık nakit akış bar grafiği, net nakit çizgi grafiği, CSV export |

---

## Derleme (Production Build)

```bash
npm run build
```

Çıktı `dist/` klasörüne yazılır.

> **Not:** Dosya tabanlı API yalnızca Vite geliştirme sunucusunda (`npm run dev`) çalışır. Production build için `vite.config.ts` içindeki eklentinin yerine gerçek bir backend gerekir.
