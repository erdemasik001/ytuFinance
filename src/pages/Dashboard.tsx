import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, Wallet, AlertCircle,
    Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import type { IncomingJob, OutgoingJob } from '../types';
import { cn } from '../lib/utils';
import { getAll } from '../lib/api';

const StatCard = ({ title, value, trendUp, icon: Icon, colorClass }: {
    title: string; value: string; trendUp?: boolean; icon: any; colorClass: string;
}) => (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg shadow-blue-900/5 dark:shadow-blue-900/10 border border-gray-100 dark:border-slate-700/50 card-hover group relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-32 opacity-[0.05] rounded-full -mr-16 -mt-16 bg-current ${colorClass} transition-transform duration-500 group-hover:scale-150`} />
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3.5 rounded-2xl ${colorClass} bg-opacity-20`}>
                <Icon size={24} className="text-white" />
            </div>
            {trendUp !== undefined && (
                <div className={cn(
                    "flex items-center px-2.5 py-1 rounded-full text-xs font-bold border",
                    trendUp
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                    {trendUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                    {trendUp ? 'Artış' : 'Azalış'}
                </div>
            )}
        </div>
        <div className="relative z-10">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">{title}</p>
        </div>
    </div>
);

export default function Dashboard() {
    const navigate = useNavigate();
    const [gelenIsler, setGelenIsler] = useState<IncomingJob[]>([]);
    const [gidenIsler, setGidenIsler] = useState<OutgoingJob[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getAll<IncomingJob>('gelen-isler'),
            getAll<OutgoingJob>('giden-isler'),
        ]).then(([gelen, giden]) => {
            setGelenIsler(gelen);
            setGidenIsler(giden);
            setLoading(false);
        });
    }, []);

    const totalIncome = gelenIsler.reduce((sum, j) => sum + j.saleAmount, 0);
    const totalExpense = gidenIsler.reduce((sum, j) => sum + j.saleAmount, 0);
    const netBalance = totalIncome - totalExpense;

    const unpaidJobs = gelenIsler.filter(j => j.paymentStatus === 'ÖDENMEDİ').slice(0, 3);
    const recentJobs = [...gelenIsler].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    const monthLabel = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Genel Bakış</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Finansal durumunuzun anlık özeti</p>
                </div>
                <div className="glass dark:glass-dark px-4 py-2 rounded-xl flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                    <div className="p-1.5 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Calendar size={18} />
                    </div>
                    <span className="capitalize">{monthLabel}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Toplam Gelir"
                    value={loading ? '...' : `₺${totalIncome.toLocaleString()}`}
                    trendUp={true}
                    icon={TrendingUp}
                    colorClass="bg-green-600"
                />
                <StatCard
                    title="Toplam Gider"
                    value={loading ? '...' : `₺${totalExpense.toLocaleString()}`}
                    trendUp={false}
                    icon={TrendingDown}
                    colorClass="bg-red-600"
                />
                <StatCard
                    title="Net Durum"
                    value={loading ? '...' : `₺${netBalance.toLocaleString()}`}
                    trendUp={netBalance >= 0}
                    icon={Wallet}
                    colorClass="bg-blue-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-blue-900/5 dark:shadow-blue-900/10 border border-gray-100 dark:border-slate-700/50 p-8 card-hover">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bekleyen Ödemeler</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Henüz tahsil edilmemiş işler</p>
                        </div>
                        <button onClick={() => navigate('/gelen-isler')} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors">Tümünü Gör</button>
                    </div>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center text-gray-400 py-6">Yükleniyor...</div>
                        ) : unpaidJobs.length === 0 ? (
                            <div className="text-center text-gray-400 py-6">Bekleyen ödeme yok.</div>
                        ) : unpaidJobs.map(job => (
                            <div key={job.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-500/20 transition-colors">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{job.customerName}</h4>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{job.jobName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-gray-900 dark:text-white text-lg">₺{job.saleAmount.toLocaleString()}</span>
                                    <span className="text-xs font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md border border-transparent dark:border-red-500/20">Ödenmedi</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-blue-900/5 dark:shadow-blue-900/10 border border-gray-100 dark:border-slate-700/50 p-8 card-hover">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Son İşlemler</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Son gerçekleşen finansal hareketler</p>
                        </div>
                        <button onClick={() => navigate('/gelir-icmal')} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors">Tümünü Gör</button>
                    </div>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center text-gray-400 py-6">Yükleniyor...</div>
                        ) : recentJobs.length === 0 ? (
                            <div className="text-center text-gray-400 py-6">Henüz işlem yok.</div>
                        ) : recentJobs.map(job => (
                            <div key={job.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-500 dark:text-green-400 group-hover:bg-green-100 dark:group-hover:bg-green-500/20 transition-colors">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{job.customerName}</h4>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{job.jobName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={cn(
                                        "block font-bold text-lg",
                                        job.paymentStatus === 'ÖDEME ALINDI'
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-gray-900 dark:text-white"
                                    )}>
                                        {job.paymentStatus === 'ÖDEME ALINDI' ? '+' : ''}₺{job.saleAmount.toLocaleString()}
                                    </span>
                                    <span className={cn(
                                        "text-xs font-semibold px-2 py-0.5 rounded-md",
                                        job.paymentStatus === 'ÖDEME ALINDI'
                                            ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10"
                                            : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
                                    )}>
                                        {job.paymentStatus === 'ÖDEME ALINDI' ? 'Tahsil Edildi' : 'Bekliyor'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
