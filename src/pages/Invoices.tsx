import { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    Download,
    FileText,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronDown
} from 'lucide-react';
import type { Invoice } from '../types';
import Modal from '../components/Modal';
import { cn } from '../lib/utils';

export default function Invoices() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Data
    const invoices: Invoice[] = [
        {
            date: '2026-02-10',
            type: 'E-ARŞİV',
            invoiceNo: 'GIB202600000001',
            taxNo: '1234567890',
            customerName: 'Umut Arslan',
            serviceAmount: 15000,
            taxRate: 0.20,
            totalAmount: 18000,
            paymentStatus: 'Ödeme Bekleniyor',
            notes: 'Kredi Kartı'
        },
        {
            date: '2026-02-11',
            type: 'E-FATURA',
            invoiceNo: 'GIB202600000002',
            taxNo: '9876543210',
            customerName: 'Ziver İnşaat',
            serviceAmount: 25000,
            taxRate: 0.20,
            totalAmount: 30000,
            paymentStatus: 'Ödeme Tamamlandı',
            notes: 'Havale/EFT'
        }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsModalOpen(false);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            'Ödeme Tamamlandı': 'bg-green-100/50 text-green-700 border-green-200',
            'Ödeme Bekleniyor': 'bg-amber-100/50 text-amber-700 border-amber-200',
            'İptal': 'bg-red-100/50 text-red-700 border-red-200'
        };

        const icons = {
            'Ödeme Tamamlandı': CheckCircle2,
            'Ödeme Bekleniyor': Clock,
            'İptal': AlertCircle
        };

        const Icon = icons[status as keyof typeof icons] || AlertCircle;
        const style = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';

        return (
            <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md", style)}>
                <Icon size={14} />
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
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

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Fatura Oluştur">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ... (Form fields styled similar to Login inputs) ... */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Müşteri Adı</label>
                            <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" placeholder="Müşteri seçin..." />
                        </div>
                        {/* Shorthand for other fields for brevity in this example, assuming full implementation follows same pattern */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Fatura Tipi</label>
                                <div className="relative">
                                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-medium">
                                        <option>E-ARŞİV</option>
                                        <option>E-FATURA</option>
                                        <option>Z RAPORU</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tarih</label>
                                <input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
                            </div>
                        </div>
                        {/* More fields... */}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors">İptal</button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">Kaydet</button>
                    </div>
                </form>
            </Modal>

            {/* Content Area */}
            <div className="glass dark:glass-dark rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl shadow-blue-500/5 dark:shadow-black/20 overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-6 border-b border-gray-100/50 dark:border-slate-700/50 flex flex-col md:flex-row gap-4 backdrop-blur-xl bg-white/60 dark:bg-slate-900/40">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Fatura No, Müşteri veya Tutar Ara..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all shadow-sm font-medium text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-5 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 rounded-2xl hover:bg-white dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-600 dark:text-gray-300 font-medium transition-all shadow-sm hover:shadow active:scale-95">
                            <Filter size={18} />
                            <span className="hidden sm:inline">Filtrele</span>
                        </button>
                        <button className="flex items-center gap-2 px-5 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 rounded-2xl hover:bg-white dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-600 dark:text-gray-300 font-medium transition-all shadow-sm hover:shadow active:scale-95">
                            <Download size={18} />
                            <span className="hidden sm:inline">Dışa Aktar</span>
                        </button>
                    </div>
                </div>

                {/* Modern Table List */}
                <div className="overflow-x-auto bg-white/40 dark:bg-slate-900/20">
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
                            {invoices.map((inv, i) => (
                                <tr key={i} className="group hover:bg-white/80 dark:hover:bg-slate-800/50 transition-colors duration-200">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shadow-sm border border-blue-100 dark:border-blue-800/30 group-hover:scale-110 transition-transform duration-300">
                                                {inv.date.split('-')[2]}
                                                <br />
                                                {['Oca', 'Şub', 'Mar'][parseInt(inv.date.split('-')[1]) - 1]}
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
                </div>
            </div>
        </div>
    );
}
