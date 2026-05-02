import { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Download, FileText,
    CheckCircle2, Clock, AlertCircle, ChevronDown, X,
    Pencil, Trash2, Printer
} from 'lucide-react';
import type { Invoice } from '../types';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { cn } from '../lib/utils';
import { getAll, create, update, remove } from '../lib/api';

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const PAGE_SIZE = 15;

type InvoiceForm = Omit<Invoice, 'id'>;

const emptyForm = (): InvoiceForm => ({
    date: '', type: 'E-ARŞİV', invoiceNo: '', taxNo: '',
    customerName: '', serviceAmount: 0, taxRate: 0.20,
    totalAmount: 0, paymentStatus: 'Ödeme Bekleniyor', notes: '',
});

const inputCls = "w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500";

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
            <Icon size={14} />{status}
        </span>
    );
};

function PrintModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
    const kdvTutar = invoice.totalAmount - invoice.serviceAmount;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden">
                <div id="invoice-print-area" className="p-10 bg-white text-gray-900">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-[#cea14a]">YTU FINANCE</h1>
                            <p className="text-xs text-gray-500 tracking-widest mt-0.5">ERP SYSTEM</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-700">{invoice.type}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{invoice.invoiceNo}</p>
                        </div>
                    </div>
                    <div className="border-t border-b border-gray-200 py-4 mb-6 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Müşteri</p>
                            <p className="font-semibold text-gray-800">{invoice.customerName}</p>
                            <p className="text-xs text-gray-500 font-mono">{invoice.taxNo}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tarih</p>
                            <p className="font-semibold text-gray-800">{invoice.date}</p>
                        </div>
                    </div>
                    <table className="w-full text-sm mb-6">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Hizmet</th>
                                <th className="text-right py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-3 text-gray-700">Hizmet Bedeli</td>
                                <td className="py-3 text-right font-semibold">₺{invoice.serviceAmount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-gray-500 text-xs">KDV (%{invoice.taxRate * 100})</td>
                                <td className="py-2 text-right text-gray-500 text-xs">₺{kdvTutar.toLocaleString()}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-gray-800">
                                <td className="pt-3 font-bold text-gray-900">TOPLAM</td>
                                <td className="pt-3 text-right font-bold text-xl text-gray-900">₺{invoice.totalAmount.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-4">
                        <span>{invoice.paymentStatus}</span>
                        {invoice.notes && <span>{invoice.notes}</span>}
                    </div>
                </div>
                <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-colors text-sm">Kapat</button>
                    <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#cea14a] hover:bg-[#b8903f] text-white font-semibold shadow-lg transition-colors text-sm">
                        <Printer size={16} />Yazdır
                    </button>
                </div>
            </div>
            <style>{`@media print { body > * { display: none !important; } #invoice-print-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; } }`}</style>
        </div>
    );
}

function exportToCSV(invoices: Invoice[]) {
    const headers = ['Fatura No', 'Tip', 'Tarih', 'Müşteri', 'Vergi No', 'Hizmet Bedeli', 'KDV Oranı', 'Toplam Tutar', 'Ödeme Durumu', 'Not'];
    const rows = invoices.map(inv => [inv.invoiceNo, inv.type, inv.date, inv.customerName, inv.taxNo, inv.serviceAmount, `%${inv.taxRate * 100}`, inv.totalAmount, inv.paymentStatus, inv.notes || '']);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
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
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    useEffect(() => {
        getAll<Invoice>('faturalar').then(data => { setInvoices(data); setLoading(false); });
    }, []);

    useEffect(() => { setPage(1); setSelected(new Set()); }, [searchTerm, filterType, filterStatus]);

    function openEdit(inv: Invoice) {
        setEditingInvoice(inv);
        setForm({ date: inv.date, type: inv.type, invoiceNo: inv.invoiceNo, taxNo: inv.taxNo, customerName: inv.customerName, serviceAmount: inv.serviceAmount, taxRate: inv.taxRate, totalAmount: inv.totalAmount, paymentStatus: inv.paymentStatus, notes: inv.notes || '' });
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingInvoice(null);
        setForm(emptyForm());
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingInvoice) {
            const updated = await update<Invoice>('faturalar', editingInvoice.id, form);
            setInvoices(prev => prev.map(i => i.id === editingInvoice.id ? updated : i));
        } else {
            const created = await create<Invoice>('faturalar', form);
            setInvoices(prev => [...prev, created]);
        }
        closeModal();
    };

    async function handleDelete(id: string) {
        await remove('faturalar', id);
        setInvoices(prev => prev.filter(i => i.id !== id));
        setDeleteConfirm(null);
        setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
    }

    async function handleBulkDelete() {
        await Promise.all([...selected].map(id => remove('faturalar', id)));
        setInvoices(prev => prev.filter(i => !selected.has(i.id)));
        setSelected(new Set());
        setBulkDeleteConfirm(false);
    }

    function toggleSelect(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    }

    const set = (field: keyof InvoiceForm) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const val = e.target.value;
            setForm(prev => {
                const updated = { ...prev, [field]: field === 'serviceAmount' ? parseFloat(val) || 0 : val };
                if (field === 'serviceAmount' || field === 'taxRate') {
                    const s = field === 'serviceAmount' ? parseFloat(val) || 0 : prev.serviceAmount;
                    const r = field === 'taxRate' ? parseFloat(val) : prev.taxRate;
                    updated.totalAmount = parseFloat((s * (1 + r)).toFixed(2));
                }
                return updated;
            });
        };

    const filtered = invoices.filter(inv => {
        const matchSearch = [inv.invoiceNo, inv.customerName, inv.taxNo].some(v => v.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchType = !filterType || inv.type === filterType;
        const matchStatus = !filterStatus || inv.paymentStatus === filterStatus;
        return matchSearch && matchType && matchStatus;
    });

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const allPageSelected = paginated.length > 0 && paginated.every(i => selected.has(i.id));
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
                    onClick={() => { setEditingInvoice(null); setIsModalOpen(true); }}
                    className="group flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 duration-200"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-semibold">Yeni Fatura</span>
                </button>
            </div>

            {/* Toplu işlem çubuğu */}
            {selected.size > 0 && (
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">{selected.size} fatura seçildi</span>
                        <button onClick={() => setSelected(new Set())} className="text-blue-200 hover:text-white text-xs underline underline-offset-2 transition-colors">Seçimi temizle</button>
                    </div>
                    <button onClick={() => setBulkDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-md">
                        <Trash2 size={15} />Seçilenleri Sil
                    </button>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingInvoice ? 'Faturayı Düzenle' : 'Yeni Fatura Oluştur'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Müşteri Adı</label>
                            <input required type="text" value={form.customerName} onChange={set('customerName')} className={inputCls} placeholder="Müşteri adı" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Vergi No</label>
                            <input required type="text" value={form.taxNo} onChange={set('taxNo')} className={inputCls} placeholder="1234567890" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Fatura Tipi</label>
                            <div className="relative">
                                <select value={form.type} onChange={set('type')} className={inputCls}>
                                    <option>E-ARŞİV</option><option>E-FATURA</option><option>Z RAPORU</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Tarih</label>
                            <input required type="date" value={form.date} onChange={set('date')} className={inputCls} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Fatura No</label>
                        <input required type="text" value={form.invoiceNo} onChange={set('invoiceNo')} className={inputCls} placeholder="GIB202600000001" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Hizmet Bedeli (₺)</label>
                            <input required type="number" value={form.serviceAmount || ''} onChange={set('serviceAmount')} className={inputCls} placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">KDV Oranı</label>
                            <div className="relative">
                                <select value={form.taxRate} onChange={set('taxRate')} className={inputCls}>
                                    <option value={0.01}>%1</option><option value={0.10}>%10</option><option value={0.20}>%20</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Toplam Tutar (₺)</label>
                            <input readOnly type="number" value={form.totalAmount} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl outline-none cursor-not-allowed text-gray-600 dark:text-gray-400 font-medium" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Ödeme Durumu</label>
                            <div className="relative">
                                <select value={form.paymentStatus} onChange={set('paymentStatus')} className={inputCls}>
                                    <option>Ödeme Bekleniyor</option><option>Ödeme Tamamlandı</option><option>Fatura Kesilecek</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Not</label>
                            <input type="text" value={form.notes} onChange={set('notes')} className={inputCls} placeholder="Kredi Kartı, Havale..." />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">İptal</button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
                            {editingInvoice ? 'Güncelle' : 'Kaydet'}
                        </button>
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
                            <button onClick={() => setShowFilters(f => !f)}
                                className={cn("flex items-center gap-2 px-5 py-3.5 border rounded-2xl font-medium transition-all shadow-sm active:scale-95",
                                    showFilters || hasActiveFilters ? "bg-blue-600 border-blue-600 text-white" : "bg-white/80 dark:bg-slate-800/80 border-gray-200/50 dark:border-slate-700/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700")}>
                                <Filter size={18} />
                                <span className="hidden sm:inline">Filtrele</span>
                                {hasActiveFilters && <span className="bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">!</span>}
                            </button>
                            <button onClick={() => exportToCSV(filtered)}
                                className="flex items-center gap-2 px-5 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 rounded-2xl hover:bg-white dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 font-medium transition-all shadow-sm active:scale-95">
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
                                    <select value={filterType} onChange={e => setFilterType(e.target.value)}
                                        className="pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium outline-none appearance-none text-gray-900 dark:text-white">
                                        <option value="">Tümü</option>
                                        <option>E-ARŞİV</option><option>E-FATURA</option><option>Z RAPORU</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Durum:</label>
                                <div className="relative">
                                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                        className="pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium outline-none appearance-none text-gray-900 dark:text-white">
                                        <option value="">Tümü</option>
                                        <option>Ödeme Bekleniyor</option><option>Ödeme Tamamlandı</option><option>Fatura Kesilecek</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            {hasActiveFilters && (
                                <button onClick={() => { setFilterType(''); setFilterStatus(''); }}
                                    className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                    <X size={14} />Temizle
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
                                    <th className="px-6 py-5">
                                        <input
                                            type="checkbox"
                                            checked={allPageSelected}
                                            onChange={e => {
                                                if (e.target.checked) setSelected(prev => new Set([...prev, ...paginated.map(i => i.id)]));
                                                else setSelected(prev => { const s = new Set(prev); paginated.forEach(i => s.delete(i.id)); return s; });
                                            }}
                                            className="w-4 h-4 rounded accent-[#cea14a]"
                                        />
                                    </th>
                                    <th className="px-4 py-5">Fatura Detayı</th>
                                    <th className="px-6 py-5">Müşteri</th>
                                    <th className="px-6 py-5">Hizmet Bedeli</th>
                                    <th className="px-6 py-5">Toplam Tutar</th>
                                    <th className="px-6 py-5">Durum</th>
                                    <th className="px-6 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/50 dark:divide-slate-800/50">
                                {paginated.map((inv) => (
                                    <tr key={inv.id} className={cn("group transition-colors duration-200", selected.has(inv.id) ? "bg-[#cea14a]/5 dark:bg-[#cea14a]/10" : "hover:bg-white/80 dark:hover:bg-slate-800/50")}>
                                        <td className="px-6 py-5" onClick={e => toggleSelect(inv.id, e)}>
                                            <input type="checkbox" checked={selected.has(inv.id)} onChange={() => {}} className="w-4 h-4 rounded accent-[#cea14a] cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shadow-sm border border-blue-100 dark:border-blue-800/30 group-hover:scale-110 transition-transform duration-300">
                                                    {inv.date.split('-')[2]}<br />{MONTHS_TR[parseInt(inv.date.split('-')[1]) - 1]}
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
                                        <td className="px-6 py-5"><StatusBadge status={inv.paymentStatus} /></td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => setPrintInvoice(inv)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="Yazdır">
                                                    <Printer size={16} />
                                                </button>
                                                <button onClick={() => openEdit(inv)} className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Düzenle">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(inv.id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors" title="Sil">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="px-6 border-t border-gray-100 dark:border-slate-800">
                    <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
                </div>
            </div>

            {printInvoice && <PrintModal invoice={printInvoice} onClose={() => setPrintInvoice(null)} />}

            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-slate-800 p-8 text-center">
                        <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Fatura Silinsin mi?</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Bu işlem geri alınamaz.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Vazgeç</button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/30 transition-colors">Sil</button>
                        </div>
                    </div>
                </div>
            )}

            {bulkDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-slate-800 p-8 text-center">
                        <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{selected.size} fatura silinsin mi?</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Bu işlem geri alınamaz.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Vazgeç</button>
                            <button onClick={handleBulkDelete} className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/30 transition-colors">Sil</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
