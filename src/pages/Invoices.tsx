import { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Download, FileText, MoreHorizontal,
    CheckCircle2, Clock, AlertCircle, ChevronDown, X
} from 'lucide-react';
import type { Invoice } from '../types';
import Modal from '../components/Modal';
import { cn } from '../lib/utils';
import { getAll, create } from '../lib/api';

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

type InvoiceForm = Omit<Invoice, 'id'>;

const emptyForm = (): InvoiceForm => ({
    date: '',
    type: 'E-ARŞİV',
    invoiceNo: '',
    taxNo: '',
    customerName: '',
    serviceAmount: 0,
    taxRate: 0.20,
    totalAmount: 0,
    paymentStatus: 'Ödeme Bekleniyor',
    notes: '',
});

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        'Ödeme Tamamlandı': 'bg-green-100/50 text-green-700 border-green-200',
        'Ödeme Bekleniyor': 'bg-amber-100/50 text-amber-700 border-amber-200',
        'Fatura Kesilecek': 'bg-blue-100/50 text-blue-700 border-blue-200',
    };
    const icons: Record<string, any> = {
        'Ödeme Tamamlandı': CheckCircle2,
        'Ödeme Bekleniyor': Clock,
        'Fatura Kesilecek': AlertCircle,
    };
    const Icon = icons[status] || AlertCircle;
    return (
        <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md", styles[status] || 'bg-gray-100 text-gray-700')}>
            <Icon size={14} />
            {status}
        </span>
    );
};

function exportToCSV(invoices: Invoice[]) {
    const headers = ['Fatura No', 'Tip', 'Tarih', 'Müşteri', 'Vergi No', 'Hizmet Bedeli', 'KDV Oranı', 'Toplam Tutar', 'Ödeme Durumu', 'Not'];
    const rows = invoices.map(inv => [
        inv.invoiceNo,
        inv.type,
        inv.date,
        inv.customerName,
        inv.taxNo,
        inv.serviceAmount,
        `%${inv.taxRate * 100}`,
        inv.totalAmount,
        inv.paymentStatus,
        inv.notes || '',
    ]);
    const csv = [headers, ...rows]
        .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faturalar_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Invoices() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<InvoiceForm>(emptyForm());

    useEffect(() => {
        getAll<Invoice>('faturalar').then(data => {
            setInvoices(data);
            setLoading(false);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const created = await create<Invoice>('faturalar', form);
        setInvoices(prev => [...prev, created]);
        setForm(emptyForm());
        setIsModalOpen(false);
    };

    const set = (field: keyof InvoiceForm) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const val = e.target.value;
            setForm(prev => {
                const updated = {
                    ...prev,
                    [field]: field === 'serviceAmount' ? parseFloat(val) || 0 : val,
                };
                if (field === 'serviceAmount' || field === 'taxRate') {
                    const s = field === 'serviceAmount' ? parseFloat(val) || 0 : prev.serviceAmount;
                    const r = field === 'taxRate' ? parseFloat(val) : prev.taxRate;
                    updated.totalAmount = parseFloat((s * (1 + r)).toFixed(2));
                }
                return updated;
            });
        };

    const filtered = invoices.filter(inv => {
        const matchSearch = [inv.invoiceNo, inv.customerName, inv.taxNo].some(v =>
            v.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchType = !filterType || inv.type === filterType;
        const matchStatus = !filterStatus || inv.paymentStatus === filterStatus;
        return matchSearch && matchType && matchStatus;
    });

    const hasActiveFilters = filterType || filterStatus;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <FileText size={28} />
                        </div>
                        Faturalar
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 ml-14">Tüm fatura işlemlerinizi buradan yönetebilirsiniz.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 duration-200"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-semibold">Yeni Fatura</span>
                </button>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setForm(emptyForm()); }} title="Yeni Fatura Oluştur">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Müşteri Adı</label>
                            <input required type="text" value={form.customerName} onChange={set('customerName')}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="Müşteri adı" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Vergi No</label>
                            <input required type="text" value={form.taxNo} onChange={set('taxNo')}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="1234567890" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Fatura Tipi</label>
                            <div className="relative">
                                <select value={form.type} onChange={set('type')}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none appearance-none font-medium text-gray-900 dark:text-white">
                                    <option>E-ARŞİV</option>
                                    <option>E-FATURA</option>
                                    <option>Z RAPORU</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Tarih</label>
                            <input required type="date" value={form.date} onChange={set('date')}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Fatura No</label>
                        <input required type="text" value={form.invoiceNo} onChange={set('invoiceNo')}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            placeholder="GIB202600000001" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Hizmet Bedeli (₺)</label>
                            <input required type="number" value={form.serviceAmount || ''} onChange={set('serviceAmount')}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">KDV Oranı</label>
                            <div className="relative">
                                <select value={form.taxRate} onChange={set('taxRate')}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none appearance-none font-medium text-gray-900 dark:text-white">
                                    <option value={0.01}>%1</option>
                                    <option value={0.10}>%10</option>
                                    <option value={0.20}>%20</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Toplam Tutar (₺)</label>
                            <input readOnly type="number" value={form.totalAmount}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl outline-none cursor-not-allowed text-gray-600 dark:text-gray-400 font-medium" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Ödeme Durumu</label>
                            <div className="relative">
                                <select value={form.paymentStatus} onChange={set('paymentStatus')}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none appearance-none font-medium text-gray-900 dark:text-white">
                                    <option>Ödeme Bekleniyor</option>
                                    <option>Ödeme Tamamlandı</option>
                                    <option>Fatura Kesilecek</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Not</label>
                            <input type="text" value={form.notes} onChange={set('notes')}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="Kredi Kartı, Havale..." />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => { setIsModalOpen(false); setForm(emptyForm()); }}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors">İptal</button>
                        <button type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">Kaydet</button>
                    </div>
                </form>
            </Modal>

            <div className="glass dark:glass-dark rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl shadow-blue-500/5 dark:shadow-black/20 overflow-hidden">
                <div className="p-6 border-b border-gray-100/50 dark:border-slate-700/50 flex flex-col gap-4 backdrop-blur-xl bg-white/60 dark:bg-slate-900/40">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Fatura No, Müşteri veya Vergi No Ara..."
                                className="w-full pl-12 pr-4 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all shadow-sm font-medium text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFilters(f => !f)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3.5 border rounded-2xl font-medium transition-all shadow-sm active:scale-95",
                                    showFilters || hasActiveFilters
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "bg-white/80 dark:bg-slate-800/80 border-gray-200/50 dark:border-slate-700/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700"
                                )}
                            >
                                <Filter size={18} />
                                <span className="hidden sm:inline">Filtrele</span>
                                {hasActiveFilters && <span className="bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">!</span>}
                            </button>
                            <button
                                onClick={() => exportToCSV(filtered)}
                                className="flex items-center gap-2 px-5 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 rounded-2xl hover:bg-white dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 font-medium transition-all shadow-sm active:scale-95"
                            >
                                <Download size={18} />
                                <span className="hidden sm:inline">Dışa Aktar</span>
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100/50 dark:border-slate-700/50">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Tip:</label>
                                <div className="relative">
                                    <select
                                        value={filterType}
                                        onChange={e => setFilterType(e.target.value)}
                                        className="pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium outline-none appearance-none"
                                    >
                                        <option value="">Tümü</option>
                                        <option>E-ARŞİV</option>
                                        <option>E-FATURA</option>
                                        <option>Z RAPORU</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Durum:</label>
                                <div className="relative">
                                    <select
                                        value={filterStatus}
                                        onChange={e => setFilterStatus(e.target.value)}
                                        className="pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium outline-none appearance-none"
                                    >
                                        <option value="">Tümü</option>
                                        <option>Ödeme Bekleniyor</option>
                                        <option>Ödeme Tamamlandı</option>
                                        <option>Fatura Kesilecek</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={() => { setFilterType(''); setFilterStatus(''); }}
                                    className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                >
                                    <X size={14} />
                                    Temizle
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto bg-white/40 dark:bg-slate-900/20">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Yükleniyor...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">Kayıt bulunamadı.</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100/50 dark:border-slate-800/50">
                                <tr>
                                    <th className="px-8 py-5">Fatura Detayı</th>
                                    <th className="px-6 py-5">Müşteri</th>
                                    <th className="px-6 py-5">Hizmet Bedeli</th>
                                    <th className="px-6 py-5">Toplam Tutar</th>
                                    <th className="px-6 py-5">Durum</th>
                                    <th className="px-6 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/50 dark:divide-slate-800/50">
                                {filtered.map((inv) => (
                                    <tr key={inv.id} className="group hover:bg-white/80 dark:hover:bg-slate-800/50 transition-colors duration-200">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shadow-sm border border-blue-100 dark:border-blue-800/30 group-hover:scale-110 transition-transform duration-300">
                                                    {inv.date.split('-')[2]}
                                                    <br />
                                                    {MONTHS_TR[parseInt(inv.date.split('-')[1]) - 1]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white font-mono tracking-tight">{inv.invoiceNo}</p>
                                                    <p className="text-xs font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg inline-block mt-1">{inv.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{inv.customerName}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{inv.taxNo}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-medium text-gray-600 dark:text-gray-300">₺{inv.serviceAmount.toLocaleString()}</p>
                                            <p className="text-xs text-gray-400">+%{inv.taxRate * 100} KDV</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">₺{inv.totalAmount.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 font-medium">{inv.notes}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <StatusBadge status={inv.paymentStatus} />
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
