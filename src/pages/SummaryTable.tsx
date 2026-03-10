import { useState } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface SummaryProps {
    type: 'GELİR' | 'GİDER';
}

export default function SummaryTable({ type }: SummaryProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [year, setYear] = useState(2026);

    const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    // Mock Data
    const data = [
        { name: 'Umut Arslan', jan: 15000, feb: 0, mar: 0, total: 15000, debt: 0, paid: 15000 },
        { name: 'Çağlayan Bodur', jan: 0, feb: 25000, mar: 0, total: 25000, debt: 25000, paid: 0 },
        { name: 'Ziver İnşaat', jan: 10000, feb: 10000, mar: 0, total: 20000, debt: 5000, paid: 15000 },
    ];

    const isIncome = type === 'GELİR';
    const ThemeIcon = isIncome ? TrendingUp : TrendingDown;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl text-white shadow-lg", isIncome ? "bg-green-500 shadow-green-500/20" : "bg-red-500 shadow-red-500/20")}>
                            <ThemeIcon size={28} />
                        </div>
                        {type} İcmal Tablosu
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 ml-14">Yıllık finansal performans ve detaylı döküm.</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-gray-500 dark:text-gray-400 transition-colors"><ChevronLeft size={20} /></button>
                    <span className="px-4 font-bold text-lg text-gray-900 dark:text-white font-mono">{year}</span>
                    <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-gray-500 dark:text-gray-400 transition-colors"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="glass dark:glass-dark rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden">
                <div className="p-6 border-b border-gray-100/50 dark:border-slate-700/50 flex gap-4 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md justify-between items-center">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Müşteri veya Cari Ara..."
                            className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all shadow-sm font-medium text-gray-700 dark:text-gray-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-5 py-3 border border-gray-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 rounded-2xl text-gray-600 dark:text-gray-300 font-semibold hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm">
                        <Download size={18} />
                        <span className="hidden sm:inline">Excel Raporu</span>
                    </button>
                </div>

                <div className="overflow-x-auto bg-white/40 dark:bg-slate-900/20">
                    <table className="w-full text-center text-sm">
                        <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider border-b border-gray-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-5 text-left min-w-[240px] sticky left-0 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur z-20 border-r border-gray-100 dark:border-slate-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 size={16} />
                                        Müşteri / Cari
                                    </div>
                                </th>
                                {months.map(m => (
                                    <th key={m} className="px-4 py-5 font-medium text-gray-400">{m.slice(0, 3)}</th>
                                ))}
                                <th className="px-4 py-5 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l border-blue-100 dark:border-blue-800/30">TOPLAM</th>
                                <th className="px-4 py-5 bg-green-50/50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-l border-green-100 dark:border-green-800/30">ALINAN</th>
                                <th className="px-4 py-5 bg-red-50/50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-l border-red-100 dark:border-red-800/30">KALAN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50 dark:divide-slate-800/50">
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-white/80 dark:hover:bg-slate-800/50 transition-colors duration-150 group">
                                    <td className="px-6 py-4 text-left font-bold text-gray-900 dark:text-white sticky left-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10 border-r border-gray-100 dark:border-slate-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] group-hover:bg-white dark:group-hover:bg-slate-900">
                                        {row.name}
                                    </td>
                                    <td className="px-4 py-4 font-medium text-gray-600 dark:text-gray-400">{row.jan > 0 ? `₺${row.jan.toLocaleString()}` : <span className="text-gray-300 dark:text-gray-600">-</span>}</td>
                                    <td className="px-4 py-4 font-medium text-gray-600 dark:text-gray-400">{row.feb > 0 ? `₺${row.feb.toLocaleString()}` : <span className="text-gray-300 dark:text-gray-600">-</span>}</td>
                                    {/* ... rest of months rendered dynamically in real app ... */}
                                    {[...Array(10)].map((_, idx) => <td key={idx} className="px-4 py-4 text-gray-200 dark:text-gray-700 text-xs">•</td>)}

                                    <td className="px-4 py-4 font-bold bg-blue-50/30 dark:bg-blue-900/10 text-gray-900 dark:text-white border-l border-blue-50 dark:border-blue-900/20 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20">₺{row.total.toLocaleString()}</td>
                                    <td className="px-4 py-4 font-bold bg-green-50/30 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-l border-green-50 dark:border-green-900/20 group-hover:bg-green-50/50 dark:group-hover:bg-green-900/20">₺{row.paid.toLocaleString()}</td>
                                    <td className="px-4 py-4 font-bold bg-red-50/30 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-l border-red-50 dark:border-red-900/20 group-hover:bg-red-50/50 dark:group-hover:bg-red-900/20">₺{row.debt.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
