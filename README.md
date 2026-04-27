# YTU Finance — ERP System

Küçük ve orta ölçekli işletmeler için geliştirilmiş, dosya tabanlı, kurulum gerektirmeyen hafif bir ERP uygulamasıdır. Veritabanı ya da sunucu yazılımı kurmanıza gerek yoktur; tüm veriler yerel `.txt` dosyalarında JSON formatında saklanır.

---

## Özellikler

- **Çoklu kullanıcı desteği** — Her kullanıcının verileri birbirinden izole klasörlerde tutulur
- **Gelen / Giden iş takibi** — İş durumu, ödeme durumu, dosya numarası
- **Fatura yönetimi** — E-Arşiv, E-Fatura, Z Raporu; KDV otomatik hesaplanır
- **Gelir & Gider İcmal tablosu** — Müşteri bazlı yıllık döküm, CSV/Excel export
- **Dışa aktarım** — Tüm tablolar CSV olarak indirilebilir
- **Karanlık / Aydınlık tema** — Elle değiştirilebilir, tercih tarayıcıda saklanır
- **Kullanıcı kimlik doğrulama** — Kayıt, giriş, şifre sıfırlama

---

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Arayüz | React 19 + TypeScript |
| Stil | Tailwind CSS v4 |
| Bundler | Vite 7 |
| Routing | React Router v7 |
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
├── kullanicilar.txt        ← Tüm kullanıcı hesapları (global)
├── admin/
│   ├── gelen-isler.txt
│   ├── giden-isler.txt
│   └── faturalar.txt
└── <kullanici-adi>/
    ├── gelen-isler.txt
    ├── giden-isler.txt
    └── faturalar.txt
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

**Kaynak adları:** `gelen-isler`, `giden-isler`, `faturalar`

Giriş yapan kullanıcının adı `localStorage`'da tutulur; `src/lib/api.ts` her istekte bunu okuyarak doğru klasöre yönlenir.

---

## Sayfalar

### Ana Sayfa (`/`)
Toplam gelir, gider ve net bakiye kartları. Bekleyen ödemeler ve son işlemlerin özeti. "Tümünü Gör" butonları ilgili sayfaya yönlendirir.

### Gelen İşler (`/gelen-isler`)
Müşterilerden alınan işlerin listesi. Durum ve ödeme durumuna göre filtreleme. Yeni iş ekleme modalı.

**İş tipleri:** EKB ÇİZİM VE ONAYI, EKB ÇİZİMİ, EKB ONAYI, ÖN HESAP SONUÇ FORMU, AKUSTİK RAPOR & PROJE, 3BSYM

**İş durumları:** TESLİM EDİLDİ, DEVAM EDİYOR, İPTAL EDİLDİ, BEKLEMEDE

### Giden İşler (`/giden-isler`)
Dışarıya verilen veya taşere edilen işler. Harç ücreti alanı dahil.

### Faturalar (`/faturalar`)
E-Arşiv, E-Fatura ve Z Raporu takibi. Hizmet bedeli girildiğinde KDV otomatik hesaplanır. Tip ve ödeme durumuna göre filtre, CSV dışa aktarım.

### Gelir İcmal (`/gelir-icmal`)
Gelen işlerin müşteri bazında aylık dökümü. Yıl seçimi, toplam / alınan / kalan sütunları. CSV olarak Excel'e aktarılabilir.

### Gider İcmal (`/gider-icmal`)
Giden işlerin aynı formatta yıllık özeti.

---

## Derleme (Production Build)

```bash
npm run build
```

Çıktı `dist/` klasörüne yazılır.

> **Not:** Dosya tabanlı API yalnızca Vite geliştirme sunucusunda (`npm run dev`) çalışır. Production build için `vite.config.ts` içindeki eklentinin yerine gerçek bir backend gerekir.
