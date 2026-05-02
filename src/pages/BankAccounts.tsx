import { useState, useEffect } from 'react';
import {
    Plus, Search, Pencil, Trash2, X, Landmark, Wallet,
    ArrowDownCircle, ArrowUpCircle, ChevronDown, ReceiptText
} from 'lucide-react';
import type { BankAccount, BankAccountType, Currency, Transaction, TransactionDirection, TransactionType } from '../types';
import { getAll, create, update, remove } from '../lib/api';
import Pagination from '../components/Pagination';
import { cn } from '../lib/utils';

const PAGE_SIZE = 15;
const CURRENCIES: Currency[] = ['TRY', 'USD', 'EUR'];
const TX_TYPES: TransactionType[] = ['NAKİT', 'HAVALE', 'EFT', 'ÇEK', 'KREDİ KARTI', 'DİĞER'];

const CURRENCY_SYMBOL: Record<Currency, string> = { TRY: '₺', USD: '$', EUR: '€' };

const EMPTY_ACCOUNT: Omit<BankAccount, 'id' | 'createdAt'> = {
    name: '', accountType: 'BANKA', bankName: '', iban: '', currency: 'TRY', openingBalance: 0,
};

const EMPTY_TX: Omit<Transaction, 'id' | 'createdAt'> = {
    date: '', accountId: '', direction: 'GİRİŞ', type: 'NAKİT', amount: 0, description: '', reference: '',
};

function calcBalance(account: BankAccount, transactions: Transaction[]): number {
    return transactions
        .filter(t => t.accountId === account.id)
        .reduce((sum, t) => sum + (t.direction === 'GİRİŞ' ? t.amount : -t.amount), account.openingBalance);
}

function AccountForm({ initial, onSave, onCancel, saving }: {
    initial: Omit<BankAccount, 'id' | 'createdAt'>;
    onSave: (d: Omit<BankAccount, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState(initial);
    const f = <K extends keyof typeof form>(key: K, val: typeof form[K]) => setForm(p => ({ ...p, [key]: val }));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
            <div className="sm:col-span-2 flex gap-3">
                {(['BANKA', 'KASA'] as BankAccountType[]).map(t => (
                    <button key={t} type="button" onClick={() => f('accountType', t)}
                        className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                            form.accountType === t ? 'bg-[#cea14a] text-white border-[#cea14a]' : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700')}>
                        {t === 'BANKA' ? '🏦 Banka Hesabı' : '💵 Kasa'}
                    </button>
                ))}
            </div>
            <Field label="Hesap Adı *" value={form.name} onChange={v => f('name', v)} placeholder="Vakıfbank Vadesiz" />
            {form.accountType === 'BANKA' && <Field label="Banka Adı" value={form.bankName || ''} onChange={v => f('bankName', v)} placeholder="Vakıfbank" />}
            {form.accountType === 'BANKA' && <Field label="IBAN" value={form.iban || ''} onChange={v => f('iban', v)} placeholder="TR00 0000 0000 0000 0000 0000 00" className="sm:col-span-2" />}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Para Birimi</label>
                <div className="relative">
                    <select value={form.currency} onChange={e => f('currency', e.target.value as Currency)}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none appearance-none">
                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>
            <Field label="Açılış Bakiyesi" value={String(form.openingBalance)} onChange={v => f('openingBalance', parseFloat(v) || 0)} placeholder="0" type="number" />
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button onClick={onCancel} className="px-5 py-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold transition-colors">İptal</button>
                <button onClick={() => onSave(form)} disabled={saving || !form.name.trim()}
                    className="px-6 py-2.5 bg-[#cea14a] hover:bg-[#b8903f] disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-[#cea14a]/30 transition-all">
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>
        </div>
    );
}

function TransactionForm({ accounts, initial, onSave, onCancel, saving }: {
    accounts: BankAccount[];
    initial: Omit<Transaction, 'id' | 'createdAt'>;
    onSave: (d: Omit<Transaction, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState(initial);
    const f = <K extends keyof typeof form>(key: K, val: typeof form[K]) => setForm(p => ({ ...p, [key]: val }));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
            <div className="sm:col-span-2 flex gap-3">
                {(['GİRİŞ', 'ÇIKIŞ'] as TransactionDirection[]).map(d => (
                    <button key={d} type="button" onClick={() => f('direction', d)}
                        className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2',
                            form.direction === d
                                ? d === 'GİRİŞ' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500'
                                : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700')}>
                        {d === 'GİRİŞ' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                        {d}
                    </button>
                ))}
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Hesap *</label>
                <div className="relative">
                    <select value={form.accountId} onChange={e => f('accountId', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none appearance-none">
                        <option value="">Hesap seçin...</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">İşlem Türü</label>
                <div className="relative">
                    <select value={form.type} onChange={e => f('type', e.target.value as TransactionType)}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none appearance-none">
                        {TX_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>
            <Field label="Tarih *" value={form.date} onChange={v => f('date', v)} type="date" />
            <Field label="Tutar *" value={String(form.amount)} onChange={v => f('amount', parseFloat(v) || 0)} type="number" placeholder="0" />
            <Field label="Açıklama *" value={form.description} onChange={v => f('description', v)} placeholder="Müşteri ödemesi..." className="sm:col-span-2" />
            <Field label="Referans / Dekont No" value={form.reference || ''} onChange={v => f('reference', v)} placeholder="DKT-2026-001" className="sm:col-span-2" />
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button onClick={onCancel} className="px-5 py-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold transition-colors">İptal</button>
                <button onClick={() => onSave(form)} disabled={saving || !form.accountId || !form.date || !form.description.trim() || form.amount <= 0}
                    className="px-6 py-2.5 bg-[#cea14a] hover:bg-[#b8903f] disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-[#cea14a]/30 transition-all">
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>
        </div>
    );
}

export default function BankAccounts() {
    const [tab, setTab] = useState<'hesaplar' | 'islemler'>('hesaplar');
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Hesap form state
    const [accountModal, setAccountModal] = useState<'add' | BankAccount | null>(null);
    const [accountSaving, setAccountSaving] = useState(false);
    const [accountDeleteConfirm, setAccountDeleteConfirm] = useState<string | null>(null);
    const [accountSearch, setAccountSearch] = useState('');

    // İşlem form state
    const [txModal, setTxModal] = useState<'add' | Transaction | null>(null);
    const [txSaving, setTxSaving] = useState(false);
    const [txDeleteConfirm, setTxDeleteConfirm] = useState<string | null>(null);
    const [txSearch, setTxSearch] = useState('');
    const [txAccountFilter, setTxAccountFilter] = useState('');
    const [txDirectionFilter, setTxDirectionFilter] = useState('');
    const [txPage, setTxPage] = useState(1);

    useEffect(() => {
        Promise.all([
            getAll<BankAccount>('banka-hesaplari').catch(() => []),
            getAll<Transaction>('islemler').catch(() => []),
        ]).then(([accs, txs]) => {
            setAccounts(accs);
            setTransactions(txs);
            setLoading(false);
        });
    }, []);

    // — Hesap işlemleri —
    async function saveAccount(data: Omit<BankAccount, 'id' | 'createdAt'>) {
        setAccountSaving(true);
        try {
            if (accountModal && accountModal !== 'add') {
                const updated = await update<BankAccount>('banka-hesaplari', accountModal.id, { ...data, createdAt: accountModal.createdAt });
                setAccounts(p => p.map(a => a.id === accountModal.id ? updated : a));
            } else {
                const created = await create<BankAccount>('banka-hesaplari', { ...data, createdAt: new Date().toISOString() });
                setAccounts(p => [...p, created]);
            }
            setAccountModal(null);
        } finally { setAccountSaving(false); }
    }

    async function deleteAccount(id: string) {
        await remove('banka-hesaplari', id);
        setAccounts(p => p.filter(a => a.id !== id));
        setAccountDeleteConfirm(null);
    }

    // — İşlem işlemleri —
    async function saveTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
        setTxSaving(true);
        try {
            if (txModal && txModal !== 'add') {
                const updated = await update<Transaction>('islemler', txModal.id, { ...data, createdAt: txModal.createdAt });
                setTransactions(p => p.map(t => t.id === txModal.id ? updated : t));
            } else {
                const created = await create<Transaction>('islemler', { ...data, createdAt: new Date().toISOString() });
                setTransactions(p => [...p, created]);
            }
            setTxModal(null);
        } finally { setTxSaving(false); }
    }

    async function deleteTransaction(id: string) {
        await remove('islemler', id);
        setTransactions(p => p.filter(t => t.id !== id));
        setTxDeleteConfirm(null);
    }

    const filteredAccounts = accounts.filter(a =>
        a.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
        (a.bankName || '').toLowerCase().includes(accountSearch.toLowerCase())
    );

    const filteredTx = transactions.filter(t => {
        const matchSearch = t.description.toLowerCase().includes(txSearch.toLowerCase()) || (t.reference || '').toLowerCase().includes(txSearch.toLowerCase());
        const matchAccount = !txAccountFilter || t.accountId === txAccountFilter;
        const matchDir = !txDirectionFilter || t.direction === txDirectionFilter;
        return matchSearch && matchAccount && matchDir;
    }).sort((a, b) => b.date.localeCompare(a.date));

    const paginatedTx = filteredTx.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE);

    const totalIncome = transactions.reduce((s, t) => s + (t.direction === 'GİRİŞ' ? t.amount : 0), 0);
    const totalExpense = transactions.reduce((s, t) => s + (t.direction === 'ÇIKIŞ' ? t.amount : 0), 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Banka & Kasa</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Hesap bakiyeleri ve nakit akış takibi</p>
                </div>
                <button
                    onClick={() => { if (tab === 'hesaplar') setAccountModal('add'); else setTxModal('add'); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#cea14a] hover:bg-[#b8903f] text-white font-semibold rounded-2xl shadow-lg shadow-[#cea14a]/30 transition-all"
                >
                    <Plus size={18} />
                    {tab === 'hesaplar' ? 'Yeni Hesap' : 'Yeni İşlem'}
                </button>
            </div>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/50 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Toplam Hesap</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{accounts.length}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{accounts.filter(a => a.accountType === 'BANKA').length} banka · {accounts.filter(a => a.accountType === 'KASA').length} kasa</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/50 shadow-sm">
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Toplam Giriş</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">₺{totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/50 shadow-sm">
                    <p className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider mb-1">Toplam Çıkış</p>
                    <p className="text-2xl font-bold text-red-500 dark:text-red-400">₺{totalExpense.toLocaleString()}</p>
                </div>
            </div>

            {/* Sekmeler */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl w-fit">
                {(['hesaplar', 'islemler'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={cn('px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                            tab === t ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200')}>
                        {t === 'hesaplar' ? '🏦 Hesaplar' : '📋 İşlemler'}
                    </button>
                ))}
            </div>

            {/* — HESAPLAR SEKMESİ — */}
            {tab === 'hesaplar' && (
                <div className="space-y-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={accountSearch} onChange={e => setAccountSearch(e.target.value)} placeholder="Hesap adı veya banka ara..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cea14a]/40 shadow-sm" />
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
                            <Landmark size={40} className="opacity-30" />
                            <p className="font-medium">Henüz hesap eklenmemiş</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAccounts.map(account => {
                                const balance = calcBalance(account, transactions);
                                const sym = CURRENCY_SYMBOL[account.currency];
                                return (
                                    <div key={account.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center text-white text-lg', account.accountType === 'BANKA' ? 'bg-blue-500' : 'bg-green-500')}>
                                                    {account.accountType === 'BANKA' ? <Landmark size={20} /> : <Wallet size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{account.name}</p>
                                                    <p className="text-xs text-gray-400">{account.bankName || account.accountType}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setAccountModal(account)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-400 hover:text-blue-500 transition-colors"><Pencil size={14} /></button>
                                                <button onClick={() => setAccountDeleteConfirm(account.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Mevcut Bakiye</p>
                                            <p className={cn('text-2xl font-bold', balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500')}>
                                                {sym}{balance.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">{account.currency} · Açılış: {sym}{account.openingBalance.toLocaleString()}</p>
                                        </div>
                                        {account.iban && <p className="mt-3 text-xs font-mono text-gray-400 truncate">{account.iban}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* — İŞLEMLER SEKMESİ — */}
            {tab === 'islemler' && (
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={txSearch} onChange={e => { setTxSearch(e.target.value); setTxPage(1); }} placeholder="Açıklama veya referans ara..."
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cea14a]/40 shadow-sm" />
                        </div>
                        <div className="relative">
                            <select value={txAccountFilter} onChange={e => { setTxAccountFilter(e.target.value); setTxPage(1); }}
                                className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none appearance-none pr-10 font-medium">
                                <option value="">Tüm Hesaplar</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="flex gap-2">
                            {(['', 'GİRİŞ', 'ÇIKIŞ'] as const).map(d => (
                                <button key={d} onClick={() => { setTxDirectionFilter(d); setTxPage(1); }}
                                    className={cn('px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                                        txDirectionFilter === d ? 'bg-[#cea14a] text-white border-[#cea14a]' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700')}>
                                    {d === '' ? 'Tümü' : d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
                        ) : filteredTx.length === 0 ? (
                            <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
                                <ReceiptText size={40} className="opacity-30" />
                                <p className="font-medium">Henüz işlem kaydı yok</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-slate-800">
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tarih</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Açıklama</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Hesap</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Tür</th>
                                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tutar</th>
                                                <th className="px-4 py-4" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                            {paginatedTx.map(tx => {
                                                const account = accounts.find(a => a.id === tx.accountId);
                                                const sym = account ? CURRENCY_SYMBOL[account.currency] : '₺';
                                                return (
                                                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300 font-mono text-xs">{tx.date}</td>
                                                        <td className="px-6 py-4">
                                                            <p className="font-semibold text-gray-900 dark:text-white">{tx.description}</p>
                                                            {tx.reference && <p className="text-xs text-gray-400 font-mono">{tx.reference}</p>}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500 dark:text-slate-400 hidden md:table-cell">{account?.name || '—'}</td>
                                                        <td className="px-6 py-4 hidden lg:table-cell">
                                                            <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-xs font-semibold">{tx.type}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className={cn('font-bold text-base', tx.direction === 'GİRİŞ' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400')}>
                                                                {tx.direction === 'GİRİŞ' ? '+' : '-'}{sym}{tx.amount.toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => setTxModal(tx)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-400 hover:text-blue-500 transition-colors"><Pencil size={14} /></button>
                                                                <button onClick={() => setTxDeleteConfirm(tx.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-6 border-t border-gray-100 dark:border-slate-800">
                                    <Pagination total={filteredTx.length} page={txPage} pageSize={PAGE_SIZE} onPageChange={setTxPage} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Hesap Modal */}
            {accountModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between px-6 pt-6 pb-0">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{accountModal === 'add' ? 'Yeni Hesap Ekle' : 'Hesabı Düzenle'}</h2>
                            <button onClick={() => setAccountModal(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors"><X size={20} /></button>
                        </div>
                        <AccountForm
                            initial={accountModal === 'add' ? EMPTY_ACCOUNT : { name: accountModal.name, accountType: accountModal.accountType, bankName: accountModal.bankName, iban: accountModal.iban, currency: accountModal.currency, openingBalance: accountModal.openingBalance }}
                            onSave={saveAccount}
                            onCancel={() => setAccountModal(null)}
                            saving={accountSaving}
                        />
                    </div>
                </div>
            )}

            {/* İşlem Modal */}
            {txModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between px-6 pt-6 pb-0">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{txModal === 'add' ? 'Yeni İşlem Ekle' : 'İşlemi Düzenle'}</h2>
                            <button onClick={() => setTxModal(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors"><X size={20} /></button>
                        </div>
                        <TransactionForm
                            accounts={accounts}
                            initial={txModal === 'add' ? { ...EMPTY_TX, date: new Date().toISOString().slice(0, 10) } : { date: txModal.date, accountId: txModal.accountId, direction: txModal.direction, type: txModal.type, amount: txModal.amount, description: txModal.description, reference: txModal.reference }}
                            onSave={saveTransaction}
                            onCancel={() => setTxModal(null)}
                            saving={txSaving}
                        />
                    </div>
                </div>
            )}

            {/* Hesap silme onayı */}
            {accountDeleteConfirm && <DeleteConfirm label="Hesap" onConfirm={() => deleteAccount(accountDeleteConfirm)} onCancel={() => setAccountDeleteConfirm(null)} />}
            {txDeleteConfirm && <DeleteConfirm label="İşlem" onConfirm={() => deleteTransaction(txDeleteConfirm)} onCancel={() => setTxDeleteConfirm(null)} />}
        </div>
    );
}

function Field({ label, value, onChange, placeholder, type = 'text', className }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string;
}) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cea14a]/40 transition" />
        </div>
    );
}

function DeleteConfirm({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-slate-800 p-8 text-center">
                <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={24} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{label} silinsin mi?</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Bu işlem geri alınamaz.</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Vazgeç</button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/30 transition-colors">Sil</button>
                </div>
            </div>
        </div>
    );
}
