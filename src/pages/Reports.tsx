import { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    BarChart3, TrendingUp, TrendingDown, FileText,
    Package, Landmark, ChevronLeft, ChevronRight, Printer,
    Download, AlertTriangle
} from 'lucide-react';
import type { IncomingJob, OutgoingJob, Invoice, Product, BankAccount, Transaction } from '../types';
import { getAll } from '../lib/api';
import { cn } from '../lib/utils';

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTHS_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const COLORS = ['#cea14a', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4', '#84cc16'];

type Tab = 'kar-zarar' | 'kdv' | 'fatura' | 'stok' | 'banka';

function TabButton({ id, active, icon: Icon, label, onClick }: {
    id: Tab; active: boolean; icon: any; label: string; onClick: () => void;
}) {
    return (
        <button onClick={onClick}
            className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap',
                active
                    ? 'bg-[#cea14a] text-white border-[#cea14a] shadow-lg shadow-[#cea14a]/20'
                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-[#cea14a]/50'
            )}>
            <Icon size={16} />
            {label}
        </button>
    );
}

function SectionCard({ title, subtitle, children, onPrint }: {
    title: string; subtitle?: string; children: React.ReactNode; onPrint?: () => void;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-slate-800">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{title}</h3>
                    {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                {onPrint && (
                    <button onClick={onPrint}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <Printer size={15} />
                        Yazdır
                    </button>
                )}
            </div>
            <div className="p-6 md:p-8">{children}</div>
        </div>
    );
}

function StatBox({ label, value, sub, color = 'gray' }: { label: string; value: string; sub?: string; color?: string }) {
    const colors: Record<string, string> = {
        green: 'text-green-600 dark:text-green-400',
        red: 'text-red-500 dark:text-red-400',
        blue: 'text-blue-600 dark:text-blue-400',
        amber: 'text-amber-600 dark:text-amber-400',
        gray: 'text-gray-900 dark:text-white',
    };
    return (
        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={cn('text-2xl font-bold', colors[color])}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    );
}

function YearPicker({ year, onChange }: { year: number; onChange: (y: number) => void }) {
    return (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <button onClick={() => onChange(year - 1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 transition-colors"><ChevronLeft size={16} /></button>
            <span className="px-3 font-bold text-gray-900 dark:text-white font-mono text-sm">{year}</span>
            <button onClick={() => onChange(year + 1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 transition-colors"><ChevronRight size={16} /></button>
        </div>
    );
}

function exportCSV(data: Record<string, unknown>[], filename: string) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

export default function Reports() {
    const [tab, setTab] = useState<Tab>('kar-zarar');
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    const [gelenIsler, setGelenIsler] = useState<IncomingJob[]>([]);
    const [gidenIsler, setGidenIsler] = useState<OutgoingJob[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getAll<IncomingJob>('gelen-isler').catch(() => []),
            getAll<OutgoingJob>('giden-isler').catch(() => []),
            getAll<Invoice>('faturalar').catch(() => []),
            getAll<Product>('urunler').catch(() => []),
            getAll<BankAccount>('banka-hesaplari').catch(() => []),
            getAll<Transaction>('islemler').catch(() => []),
        ]).then(([gelen, giden, inv, prods, accs, txs]) => {
            setGelenIsler(gelen);
            setGidenIsler(giden);
            setInvoices(inv);
            setProducts(prods);
            setBankAccounts(accs);
            setTransactions(txs);
            setLoading(false);
        });
    }, []);

    // — KÂR-ZARAR hesaplamaları —
    const karZararData = useCallback(() => {
        const thisYear = MONTHS.map((ay, i) => {
            const gelir = gelenIsler.filter(j => {
                const [y, m] = j.date.split('-');
                return parseInt(y) === year && parseInt(m) - 1 === i;
            }).reduce((s, j) => s + j.saleAmount, 0);
            const gider = gidenIsler.filter(j => {
                const [y, m] = j.date.split('-');
                return parseInt(y) === year && parseInt(m) - 1 === i;
            }).reduce((s, j) => s + j.saleAmount + j.fee, 0);
            return { ay, gelir, gider, kar: gelir - gider };
        });

        const lastYear = MONTHS.map((ay, i) => {
            const gelir = gelenIsler.filter(j => {
                const [y, m] = j.date.split('-');
                return parseInt(y) === year - 1 && parseInt(m) - 1 === i;
            }).reduce((s, j) => s + j.saleAmount, 0);
            const gider = gidenIsler.filter(j => {
                const [y, m] = j.date.split('-');
                return parseInt(y) === year - 1 && parseInt(m) - 1 === i;
            }).reduce((s, j) => s + j.saleAmount + j.fee, 0);
            return { ay, gelir, gider, kar: gelir - gider };
        });

        const totalGelir = thisYear.reduce((s, r) => s + r.gelir, 0);
        const totalGider = thisYear.reduce((s, r) => s + r.gider, 0);
        const totalKar = totalGelir - totalGider;
        const prevGelir = lastYear.reduce((s, r) => s + r.gelir, 0);
        const prevGider = lastYear.reduce((s, r) => s + r.gider, 0);

        return { thisYear, lastYear, totalGelir, totalGider, totalKar, prevGelir, prevGider };
    }, [gelenIsler, gidenIsler, year]);

    // — KDV hesaplamaları —
    const kdvData = useCallback(() => {
        const yearInvoices = invoices.filter(inv => inv.date.startsWith(String(year)));
        const monthly = MONTHS.map((ay, i) => {
            const month = String(i + 1).padStart(2, '0');
            const monthInvs = yearInvoices.filter(inv => inv.date.startsWith(`${year}-${month}`));
            const kdv1 = monthInvs.filter(inv => inv.taxRate === 0.01).reduce((s, inv) => s + (inv.totalAmount - inv.serviceAmount), 0);
            const kdv10 = monthInvs.filter(inv => inv.taxRate === 0.10).reduce((s, inv) => s + (inv.totalAmount - inv.serviceAmount), 0);
            const kdv20 = monthInvs.filter(inv => inv.taxRate === 0.20).reduce((s, inv) => s + (inv.totalAmount - inv.serviceAmount), 0);
            const total = kdv1 + kdv10 + kdv20;
            return { ay, '%1': kdv1, '%10': kdv10, '%20': kdv20, toplam: total };
        });
        const totalKDV = monthly.reduce((s, r) => s + r.toplam, 0);
        const totalMatrah = yearInvoices.reduce((s, inv) => s + inv.serviceAmount, 0);
        return { monthly, totalKDV, totalMatrah, count: yearInvoices.length };
    }, [invoices, year]);

    // — Fatura hesaplamaları —
    const faturaData = useCallback(() => {
        const yearInvoices = invoices.filter(inv => inv.date.startsWith(String(year)));
        const byType = [
            { ad: 'E-ARŞİV', sayi: yearInvoices.filter(i => i.type === 'E-ARŞİV').length, tutar: yearInvoices.filter(i => i.type === 'E-ARŞİV').reduce((s, i) => s + i.totalAmount, 0) },
            { ad: 'E-FATURA', sayi: yearInvoices.filter(i => i.type === 'E-FATURA').length, tutar: yearInvoices.filter(i => i.type === 'E-FATURA').reduce((s, i) => s + i.totalAmount, 0) },
            { ad: 'Z RAPORU', sayi: yearInvoices.filter(i => i.type === 'Z RAPORU').length, tutar: yearInvoices.filter(i => i.type === 'Z RAPORU').reduce((s, i) => s + i.totalAmount, 0) },
        ];
        const byStatus = [
            { ad: 'Ödeme Tamamlandı', sayi: yearInvoices.filter(i => i.paymentStatus === 'Ödeme Tamamlandı').length },
            { ad: 'Ödeme Bekleniyor', sayi: yearInvoices.filter(i => i.paymentStatus === 'Ödeme Bekleniyor').length },
            { ad: 'Fatura Kesilecek', sayi: yearInvoices.filter(i => i.paymentStatus === 'Fatura Kesilecek').length },
        ].filter(s => s.sayi > 0);
        const monthly = MONTHS.map((ay, i) => {
            const month = String(i + 1).padStart(2, '0');
            const monthInvs = yearInvoices.filter(inv => inv.date.startsWith(`${year}-${month}`));
            return { ay, tutar: monthInvs.reduce((s, inv) => s + inv.totalAmount, 0), adet: monthInvs.length };
        });
        return { byType, byStatus, monthly, total: yearInvoices.reduce((s, i) => s + i.totalAmount, 0), count: yearInvoices.length };
    }, [invoices, year]);

    // — Stok hesaplamaları —
    const stokData = useCallback(() => {
        const lowStock = products.filter(p => p.minStock > 0 && p.currentStock < p.minStock);
        const outOfStock = products.filter(p => p.currentStock <= 0);
        const totalValue = products.reduce((s, p) => s + p.currentStock * p.salePrice, 0);
        const totalCost = products.reduce((s, p) => s + p.currentStock * p.purchasePrice, 0);
        const byCategory = Object.entries(
            products.reduce<Record<string, number>>((acc, p) => {
                const cat = p.category || 'Diğer';
                acc[cat] = (acc[cat] || 0) + p.currentStock * p.salePrice;
                return acc;
            }, {})
        ).map(([name, value]) => ({ name, value }));
        return { lowStock, outOfStock, totalValue, totalCost, byCategory };
    }, [products]);

    // — Banka/Kasa hesaplamaları —
    const bankaData = useCallback(() => {
        const accountsWithBalance = bankAccounts.map(acc => {
            const balance = transactions
                .filter(t => t.accountId === acc.id)
                .reduce((s, t) => s + (t.direction === 'GİRİŞ' ? t.amount : -t.amount), acc.openingBalance);
            return { ...acc, balance };
        });
        const monthly = MONTHS.map((ay, i) => {
            const month = String(i + 1).padStart(2, '0');
            const monthTxs = transactions.filter(t => t.date.startsWith(`${year}-${month}`));
            const giris = monthTxs.filter(t => t.direction === 'GİRİŞ').reduce((s, t) => s + t.amount, 0);
            const cikis = monthTxs.filter(t => t.direction === 'ÇIKIŞ').reduce((s, t) => s + t.amount, 0);
            return { ay, giris, cikis, net: giris - cikis };
        });
        const totalBalance = accountsWithBalance.reduce((s, a) => s + a.balance, 0);
        return { accountsWithBalance, monthly, totalBalance };
    }, [bankAccounts, transactions, year]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64 text-gray-400">
                <div className="text-center">
                    <BarChart3 size={40} className="mx-auto mb-3 opacity-30 animate-pulse" />
                    <p>Raporlar yükleniyor...</p>
                </div>
            </div>
        );
    }

    const kz = karZararData();
    const kdv = kdvData();
    const fat = faturaData();
    const stok = stokData();
    const banka = bankaData();

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Raporlar</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Finansal analiz ve iş performansı özeti</p>
                </div>
                <YearPicker year={year} onChange={setYear} />
            </div>

            {/* Sekme Navigasyonu */}
            <div className="flex gap-2 flex-wrap">
                <TabButton id="kar-zarar" active={tab === 'kar-zarar'} icon={TrendingUp} label="Kâr-Zarar" onClick={() => setTab('kar-zarar')} />
                <TabButton id="kdv" active={tab === 'kdv'} icon={FileText} label="KDV Raporu" onClick={() => setTab('kdv')} />
                <TabButton id="fatura" active={tab === 'fatura'} icon={FileText} label="Fatura Raporu" onClick={() => setTab('fatura')} />
                <TabButton id="stok" active={tab === 'stok'} icon={Package} label="Stok Raporu" onClick={() => setTab('stok')} />
                <TabButton id="banka" active={tab === 'banka'} icon={Landmark} label="Banka/Kasa" onClick={() => setTab('banka')} />
            </div>

            {/* ===================== KÂR-ZARAR ===================== */}
            {tab === 'kar-zarar' && (
                <div className="space-y-6">
                    {/* Özet */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatBox label={`${year} Gelir`} value={`₺${kz.totalGelir.toLocaleString()}`} sub={`Geçen yıl: ₺${kz.prevGelir.toLocaleString()}`} color="green" />
                        <StatBox label={`${year} Gider`} value={`₺${kz.totalGider.toLocaleString()}`} sub={`Geçen yıl: ₺${kz.prevGider.toLocaleString()}`} color="red" />
                        <StatBox label="Net Kâr" value={`₺${kz.totalKar.toLocaleString()}`} sub={kz.totalKar >= 0 ? 'Kârlı dönem' : 'Zararlı dönem'} color={kz.totalKar >= 0 ? 'green' : 'red'} />
                        <StatBox label="Kâr Marjı" value={kz.totalGelir > 0 ? `%${((kz.totalKar / kz.totalGelir) * 100).toFixed(1)}` : '—'} color="blue" />
                    </div>

                    <SectionCard
                        title={`${year} — Aylık Gelir-Gider`}
                        subtitle="Giden işlerde harç ücreti dahildir"
                        onPrint={() => window.print()}
                    >
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={kz.thisYear} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₺${(v / 1000).toFixed(0)}K`} />
                                <Tooltip formatter={(v: number) => `₺${v.toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey="gelir" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="gider" name="Gider" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </SectionCard>

                    <SectionCard title="Aylık Net Kâr" subtitle="Pozitif = kâr, negatif = zarar">
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={kz.thisYear}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₺${(v / 1000).toFixed(0)}K`} />
                                <Tooltip formatter={(v: number) => `₺${v.toLocaleString()}`} />
                                <Line type="monotone" dataKey="kar" name="Net Kâr" stroke="#cea14a" strokeWidth={2.5} dot={{ fill: '#cea14a', r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </SectionCard>

                    <SectionCard title={`${year} vs ${year - 1} Karşılaştırma`}>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={MONTHS.map((ay, i) => ({ ay, [`${year} Gelir`]: kz.thisYear[i].gelir, [`${year - 1} Gelir`]: kz.lastYear[i].gelir }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₺${(v / 1000).toFixed(0)}K`} />
                                <Tooltip formatter={(v: number) => `₺${v.toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey={`${year} Gelir`} fill="#cea14a" radius={[4, 4, 0, 0]} />
                                <Bar dataKey={`${year - 1} Gelir`} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </SectionCard>

                    <div className="flex justify-end">
                        <button onClick={() => exportCSV(kz.thisYear.map(r => ({ Ay: r.ay, Gelir: r.gelir, Gider: r.gider, 'Net Kar': r.kar })), `kar-zarar-${year}.csv`)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                            <Download size={16} />CSV İndir
                        </button>
                    </div>
                </div>
            )}

            {/* ===================== KDV ===================== */}
            {tab === 'kdv' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <StatBox label="Toplam KDV" value={`₺${kdv.totalKDV.toLocaleString()}`} color="blue" />
                        <StatBox label="Toplam Matrah" value={`₺${kdv.totalMatrah.toLocaleString()}`} color="gray" />
                        <StatBox label="Fatura Adedi" value={String(kdv.count)} />
                    </div>

                    <SectionCard title={`${year} — Aylık KDV Dağılımı`} subtitle="KDV oranlarına göre aylık tutar" onPrint={() => window.print()}>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={kdv.monthly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₺${(v / 1000).toFixed(0)}K`} />
                                <Tooltip formatter={(v: number) => `₺${v.toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey="%1" name="%1 KDV" fill="#10b981" stackId="a" />
                                <Bar dataKey="%10" name="%10 KDV" fill="#3b82f6" stackId="a" />
                                <Bar dataKey="%20" name="%20 KDV" fill="#cea14a" stackId="a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </SectionCard>

                    <SectionCard title="Aylık KDV Tablosu">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-slate-800">
                                        {['Ay', 'Matrah (approx.)', '%1 KDV', '%10 KDV', '%20 KDV', 'Toplam KDV'].map(h => (
                                            <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                    {kdv.monthly.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{MONTHS_FULL[i]}</td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-slate-300">₺{(row['%1'] / 0.01 + row['%10'] / 0.1 + row['%20'] / 0.2).toFixed(0).replace(/\.0+$/, '')}</td>
                                            <td className="py-3 px-4 text-green-600 dark:text-green-400">{row['%1'] > 0 ? `₺${row['%1'].toLocaleString()}` : '—'}</td>
                                            <td className="py-3 px-4 text-blue-600 dark:text-blue-400">{row['%10'] > 0 ? `₺${row['%10'].toLocaleString()}` : '—'}</td>
                                            <td className="py-3 px-4 text-amber-600 dark:text-amber-400">{row['%20'] > 0 ? `₺${row['%20'].toLocaleString()}` : '—'}</td>
                                            <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{row.toplam > 0 ? `₺${row.toplam.toLocaleString()}` : '—'}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                                        <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">TOPLAM</td>
                                        <td className="py-3 px-4 font-bold">₺{kdv.totalMatrah.toLocaleString()}</td>
                                        <td className="py-3 px-4 font-bold text-green-600 dark:text-green-400">₺{kdv.monthly.reduce((s, r) => s + r['%1'], 0).toLocaleString()}</td>
                                        <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">₺{kdv.monthly.reduce((s, r) => s + r['%10'], 0).toLocaleString()}</td>
                                        <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">₺{kdv.monthly.reduce((s, r) => s + r['%20'], 0).toLocaleString()}</td>
                                        <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">₺{kdv.totalKDV.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>

                    <div className="flex justify-end">
                        <button onClick={() => exportCSV(kdv.monthly.map((r, i) => ({ Ay: MONTHS_FULL[i], '%1 KDV': r['%1'], '%10 KDV': r['%10'], '%20 KDV': r['%20'], 'Toplam': r.toplam })), `kdv-raporu-${year}.csv`)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                            <Download size={16} />CSV İndir
                        </button>
                    </div>
                </div>
            )}

            {/* ===================== FATURA ===================== */}
            {tab === 'fatura' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatBox label="Toplam Fatura" value={String(fat.count)} />
                        <StatBox label="Toplam Tutar" value={`₺${fat.total.toLocaleString()}`} color="blue" />
                        <StatBox label="E-Arşiv" value={String(fat.byType.find(t => t.ad === 'E-ARŞİV')?.sayi || 0)} />
                        <StatBox label="E-Fatura" value={String(fat.byType.find(t => t.ad === 'E-FATURA')?.sayi || 0)} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SectionCard title="Aylık Fatura Tutarları">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={fat.monthly}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₺${(v / 1000).toFixed(0)}K`} />
                                    <Tooltip formatter={(v: number) => `₺${v.toLocaleString()}`} />
                                    <Bar dataKey="tutar" name="Tutar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </SectionCard>

                        <SectionCard title="Ödeme Durumu Dağılımı">
                            {fat.byStatus.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={fat.byStatus} dataKey="sayi" nameKey="ad" cx="50%" cy="50%" outerRadius={100} label={({ ad, sayi }) => `${ad}: ${sayi}`}>
                                            {fat.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-64 text-gray-400">{year} yılına ait fatura yok</div>
                            )}
                        </SectionCard>
                    </div>

                    <SectionCard title="Fatura Türü Özeti">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {fat.byType.map(t => (
                                <div key={t.ad} className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-5">
                                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">{t.ad}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{t.sayi} adet</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">₺{t.tutar.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            )}

            {/* ===================== STOK ===================== */}
            {tab === 'stok' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatBox label="Toplam Ürün" value={String(products.length)} />
                        <StatBox label="Stok Değeri" value={`₺${stok.totalValue.toLocaleString()}`} color="green" sub="Satış fiyatından" />
                        <StatBox label="Maliyet" value={`₺${stok.totalCost.toLocaleString()}`} color="gray" sub="Alış fiyatından" />
                        <StatBox label="Düşük Stok" value={String(stok.lowStock.length)} color={stok.lowStock.length > 0 ? 'amber' : 'gray'} />
                    </div>

                    {stok.lowStock.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                                <p className="font-semibold text-amber-700 dark:text-amber-300">{stok.lowStock.length} ürün minimum stok altında</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {stok.lowStock.map(p => (
                                    <div key={p.id} className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-700/50 text-sm">
                                        <span className="font-semibold text-gray-900 dark:text-white">{p.name}</span>
                                        <span className="text-amber-600 dark:text-amber-400 ml-2 text-xs">{p.currentStock}/{p.minStock} {p.unit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {stok.byCategory.length > 0 && (
                            <SectionCard title="Kategori Bazlı Stok Değeri">
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={stok.byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} %${(percent * 100).toFixed(0)}`}>
                                            {stok.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => `₺${v.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </SectionCard>
                        )}

                        <SectionCard title="Stok Durumu Tablosu">
                            <div className="overflow-y-auto max-h-72">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white dark:bg-slate-900">
                                        <tr className="border-b border-gray-100 dark:border-slate-800">
                                            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ürün</th>
                                            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok</th>
                                            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Değer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                        {products.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                                                <td className={cn('py-2 px-3 text-right font-semibold', p.minStock > 0 && p.currentStock < p.minStock ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-slate-300')}>
                                                    {p.currentStock} {p.unit}
                                                </td>
                                                <td className="py-2 px-3 text-right text-gray-600 dark:text-slate-300">₺{(p.currentStock * p.salePrice).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={() => exportCSV(products.map(p => ({ Ürün: p.name, Kategori: p.category || '', Birim: p.unit, 'Mevcut Stok': p.currentStock, 'Min Stok': p.minStock, 'Satış Fiyatı': p.salePrice, 'Alış Fiyatı': p.purchasePrice, 'Stok Değeri': p.currentStock * p.salePrice })), `stok-raporu-${year}.csv`)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                            <Download size={16} />CSV İndir
                        </button>
                    </div>
                </div>
            )}

            {/* ===================== BANKA/KASA ===================== */}
            {tab === 'banka' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatBox label="Toplam Net Bakiye" value={`₺${banka.totalBalance.toLocaleString()}`} color={banka.totalBalance >= 0 ? 'green' : 'red'} />
                        <StatBox label={`${year} Toplam Giriş`} value={`₺${banka.monthly.reduce((s, r) => s + r.giris, 0).toLocaleString()}`} color="green" />
                        <StatBox label={`${year} Toplam Çıkış`} value={`₺${banka.monthly.reduce((s, r) => s + r.cikis, 0).toLocaleString()}`} color="red" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {banka.accountsWithBalance.map(acc => (
                            <div key={acc.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center text-white text-sm', acc.accountType === 'BANKA' ? 'bg-blue-500' : 'bg-green-500')}>
                                        {acc.accountType === 'BANKA' ? <Landmark size={16} /> : '💵'}
                                    </div>
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{acc.name}</p>
                                </div>
                                <p className={cn('text-xl font-bold', acc.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500')}>
                                    ₺{acc.balance.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{acc.bankName || acc.accountType} · {acc.currency}</p>
                            </div>
                        ))}
                        {bankAccounts.length === 0 && (
                            <div className="col-span-3 text-center py-8 text-gray-400">Henüz hesap eklenmemiş</div>
                        )}
                    </div>

                    <SectionCard title={`${year} — Aylık Nakit Akışı`} onPrint={() => window.print()}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={banka.monthly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₺${(v / 1000).toFixed(0)}K`} />
                                <Tooltip formatter={(v: number) => `₺${v.toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey="giris" name="Giriş" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="cikis" name="Çıkış" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </SectionCard>

                    <SectionCard title="Aylık Net Nakit Akışı">
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={banka.monthly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₺${(v / 1000).toFixed(0)}K`} />
                                <Tooltip formatter={(v: number) => `₺${v.toLocaleString()}`} />
                                <Line type="monotone" dataKey="net" name="Net Akış" stroke="#cea14a" strokeWidth={2.5} dot={{ fill: '#cea14a', r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </SectionCard>

                    <div className="flex justify-end">
                        <button onClick={() => exportCSV(banka.monthly.map((r, i) => ({ Ay: MONTHS_FULL[i], Giriş: r.giris, Çıkış: r.cikis, Net: r.net })), `banka-kasa-${year}.csv`)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                            <Download size={16} />CSV İndir
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
