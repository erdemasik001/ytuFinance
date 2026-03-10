import { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    Briefcase,
    Building,
    CheckCircle2,
    Clock3,
    Banknote,
    ArrowRight
} from 'lucide-react';
import type { JobStatus, JobType } from '../types';
import { cn } from '../lib/utils';

interface JobListProps {
    type: 'GELEN' | 'GİDEN';
}

export default function JobList({ type }: JobListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Mock Data
    const jobs = [
        {
            date: '2026-02-10',
            fileNo: '202602001',
            customerName: 'Umut Arslan',
            jobName: 'EKB ÇİZİMİ',
            jobType: 'EKB ÇİZİMİ' as JobType,
            status: 'DEVAM EDİYOR' as JobStatus,
            amount: 15000,
            paymentStatus: 'ÖDENMEDİ'
        },
        {
            date: '2026-02-08',
            fileNo: '202602002',
            customerName: 'Ziver İnşaat',
            jobName: 'AKUSTİK RAPOR',
            jobType: 'AKUSTİK RAPOR & PROJE' as JobType,
            status: 'TESLİM EDİLDİ' as JobStatus,
            amount: 8500,
            paymentStatus: 'ÖDEME ALINDI'
        },
    ];

    const getStatusColor = (status: string) => {
        if (status === 'TESLİM EDİLDİ') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (status === 'DEVAM EDİYOR') return 'bg-blue-100 text-blue-700 border-blue-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="space-y-8 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl text-white shadow-lg", type === 'GELEN' ? "bg-orange-500 shadow-orange-500/20" : "bg-purple-500 shadow-purple-500/20")}>
                            <Briefcase size={28} />
                        </div>
                        {type === 'GELEN' ? 'Gelen İşler' : 'Giden İşler'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 ml-14">
                        {type === 'GELEN' ? 'Müşterilerden alınan işlerin takibi.' : 'Dışarıya verilen veya taşere edilen işler.'}
                    </p>
                </div>
                <button className="group flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 duration-200">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-semibold">Yeni İş Ekle</span>
                </button>
            </div>

            <div className="glass dark:glass-dark rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden">
                <div className="p-6 border-b border-gray-100/50 dark:border-slate-700/50 flex flex-col md:flex-row gap-4 backdrop-blur-xl bg-white/60 dark:bg-slate-900/40">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Dosya No, Müşteri Ara..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all shadow-sm font-medium text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-5 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 rounded-2xl hover:bg-white dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-600 dark:text-gray-300 font-medium transition-all shadow-sm hover:shadow active:scale-95">
                        <Filter size={18} />
                        <span className="hidden sm:inline">Filtrele</span>
                    </button>
                </div>

                <div className="grid gap-4 p-6 bg-gray-50/50 dark:bg-slate-900/50">
                    {jobs.map((job, i) => (
                        <div key={i} className="group bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/30 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                            {/* Decorative gradient background on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-5">
                                    <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center shadow-inner">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DOSYA</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">{job.fileNo}</span>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{job.jobName}</h3>
                                            <span className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 font-medium">{job.jobType}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <Building size={14} />
                                            <span className="font-medium text-sm">{job.customerName}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                            <span className="text-xs">{job.date}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 pl-4 md:pl-0 border-l md:border-l-0 border-gray-100 dark:border-slate-700">
                                    <div className="flex flex-col items-end min-w-[100px]">
                                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 backdrop-blur-md", getStatusColor(job.status))}>
                                            {job.status === 'TESLİM EDİLDİ' ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                                            {job.status}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-end min-w-[120px]">
                                        <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">₺{job.amount.toLocaleString()}</span>
                                        <span className={cn(
                                            "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide",
                                            job.paymentStatus === 'ÖDEME ALINDI' ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                                        )}>
                                            <Banknote size={12} />
                                            {job.paymentStatus}
                                        </span>
                                    </div>

                                    <button className="p-3 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm hover:shadow-blue-500/30">
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
