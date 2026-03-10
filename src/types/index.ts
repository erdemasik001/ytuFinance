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
    fileName: string; // generated
}

export interface OutgoingJob {
    date: string;
    fileNo: string;
    customerName: string;
    jobName: string;
    jobType: string;
    status: JobStatus;
    saleAmount: number; // Cost usually? Or sale price? Context implies expense tracking.
    paymentStatus: PaymentStatus;
    fee: number; // Harç ücreti
    note2?: string;
    note3?: string;
}

export interface Invoice {
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
