export interface Customer {
    id: string; // MUS + 4 digits
    name: string;
}

export type JobType =
    | 'EKB ÇİZİM VE ONAYI'
    | 'EKB ÇİZİMİ'
    | 'EKB ONAYI'
    | 'ÖN HESAP SONUÇ FORMU'
    | 'AKUSTİK RAPOR & PROJE'
    | '3BSYM';

export type JobStatus =
    | 'TESLİM EDİLDİ'
    | 'DEVAM EDİYOR'
    | 'İPTAL EDİLDİ'
    | 'BEKLEMEDE';

export type PaymentStatus =
    | 'ÖDEME ALINDI'
    | 'ÖDENMEDİ';

export interface IncomingJob {
    id: string;
    date: string;
    fileNo: string; // YYYYMMXXX
    customerName: string;
    jobName: string;
    jobType: JobType;
    status: JobStatus;
    saleAmount: number;
    paymentStatus: PaymentStatus;
    note1?: string;
    note2?: string;
    fileName: string;
}

export interface OutgoingJob {
    id: string;
    date: string;
    fileNo: string;
    customerName: string;
    jobName: string;
    jobType: string;
    status: JobStatus;
    saleAmount: number;
    paymentStatus: PaymentStatus;
    fee: number; // Harç ücreti
    note2?: string;
    note3?: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    createdAt: string;
}

export interface Company {
    id: string; // FRM + 4 digits
    name: string;
    taxNo: string;
    taxOffice: string;
    tradeRegNo?: string;
    address: string;
    phone: string;
    email?: string;
    sector?: string;
    createdAt: string;
}

export type AccountType = 'MÜŞTERİ' | 'TEDARİKÇİ' | 'HEM MÜŞTERİ HEM TEDARİKÇİ';

export interface Account {
    id: string; // CAR + 4 digits
    name: string;
    type: AccountType;
    taxNo?: string;
    taxOffice?: string;
    address?: string;
    phone?: string;
    email?: string;
    createdAt: string;
}

export type BankAccountType = 'BANKA' | 'KASA';
export type Currency = 'TRY' | 'USD' | 'EUR';

export interface BankAccount {
    id: string; // BNK + 4 digits
    name: string;
    accountType: BankAccountType;
    bankName?: string;
    iban?: string;
    currency: Currency;
    openingBalance: number;
    createdAt: string;
}

export type TransactionDirection = 'GİRİŞ' | 'ÇIKIŞ';
export type TransactionType = 'NAKİT' | 'HAVALE' | 'EFT' | 'ÇEK' | 'KREDİ KARTI' | 'DİĞER';

export interface Transaction {
    id: string; // TRN + 4 digits
    date: string;
    accountId: string;
    direction: TransactionDirection;
    type: TransactionType;
    amount: number;
    description: string;
    reference?: string;
    createdAt: string;
}

export type StockUnit = 'ADET' | 'KG' | 'LT' | 'MT' | 'M2' | 'PAKET' | 'KUTU';

export interface Product {
    id: string; // PRD + 4 digits
    name: string;
    category?: string;
    unit: StockUnit;
    salePrice: number;
    purchasePrice: number;
    barcode?: string;
    minStock: number;
    currentStock: number;
    createdAt: string;
}

export type StockMovementType = 'GİRİŞ' | 'ÇIKIŞ' | 'SAYIM';

export interface StockMovement {
    id: string; // STK + 4 digits
    date: string;
    productId: string;
    productName: string;
    type: StockMovementType;
    quantity: number;
    unitPrice: number;
    description?: string;
    createdAt: string;
}

export interface Invoice {
    id: string;
    date: string;
    type: 'E-ARŞİV' | 'E-FATURA' | 'Z RAPORU';
    invoiceNo: string;
    taxNo: string;
    customerName: string;
    serviceAmount: number;
    taxRate: 0.01 | 0.10 | 0.20;
    totalAmount: number;
    paymentStatus: 'Ödeme Bekleniyor' | 'Ödeme Tamamlandı' | 'Fatura Kesilecek';
    notes?: string;
}
