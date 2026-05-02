import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Users, X } from 'lucide-react';
import type { Account, AccountType } from '../types';
import { getAll, create, update, remove } from '../lib/api';
import { cn } from '../lib/utils';

const ACCOUNT_TYPES: AccountType[] = ['MÜŞTERİ', 'TEDARİKÇİ', 'HEM MÜŞTERİ HEM TEDARİKÇİ'];

const TYPE_STYLE: Record<AccountType, string> = {
    'MÜŞTERİ': 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20',
    'TEDARİKÇİ': 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-500/20',
    'HEM MÜŞTERİ HEM TEDARİKÇİ': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
};

const EMPTY_FORM: Omit<Account, 'id' | 'createdAt'> = {
    name: '',
    type: 'MÜŞTERİ',
    taxNo: '',
    taxOffice: '',
    address: '',
    phone: '',
    email: '',
};

export default function Accounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<AccountType | 'TÜMÜ'>('TÜMÜ');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Account | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    async function loadAccounts() {
        setLoading(true);
        try {
            const data = await getAll<Account>('cariler');
            setAccounts(data);
        } catch {
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    }

    function openAdd() {
        setEditing(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    }

    function openEdit(account: Account) {
        setEditing(account);
        setForm({
            name: account.name,
            type: account.type,
            taxNo: account.taxNo || '',
            taxOffice: account.taxOffice || '',
            address: account.address || '',
            phone: account.phone || '',
            email: account.email || '',
        });
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditing(null);
    }

    async function handleSave() {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (editing) {
                const updated = await update<Account>('cariler', editing.id, {
                    ...form,
                    createdAt: editing.createdAt,
                });
                setAccounts(prev => prev.map(a => a.id === editing.id ? updated : a));
            } else {
                const created = await create<Account>('cariler', {
                    ...form,
                    createdAt: new Date().toISOString(),
                });
                setAccounts(prev => [...prev, created]);
            }
            closeModal();
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        await remove('cariler', id);
        setAccounts(prev => prev.filter(a => a.id !== id));
        setDeleteConfirm(null);
    }

    const filtered = accounts.filter(a => {
        const matchesSearch =
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            (a.taxNo || '').includes(search) ||
            (a.phone || '').includes(search);
        const matchesType = typeFilter === 'TÜMÜ' || a.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const counts = {
        TÜMÜ: accounts.length,
        MÜŞTERİ: accounts.filter(a => a.type === 'MÜŞTERİ').length,
        TEDARİKÇİ: accounts.filter(a => a.type === 'TEDARİKÇİ').length,
        'HEM MÜŞTERİ HEM TEDARİKÇİ': accounts.filter(a => a.type === 'HEM MÜŞTERİ HEM TEDARİKÇİ').length,
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Cari Hesaplar</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Müşteri ve tedarikçi kayıtlarını yönetin</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#cea14a] hover:bg-[#b8903f] text-white font-semibold rounded-2xl shadow-lg shadow-[#cea14a]/30 transition-all"
                >
                    <Plus size={18} />
                    Yeni Cari
                </button>
            </div>

            {/* Tip Filtreleri */}
            <div className="flex flex-wrap gap-2">
                {(['TÜMÜ', ...ACCOUNT_TYPES] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={cn(
                            'px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                            typeFilter === t
                                ? 'bg-[#cea14a] text-white border-[#cea14a] shadow-lg shadow-[#cea14a]/20'
                                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-[#cea14a]/50'
                        )}
                    >
                        {t === 'HEM MÜŞTERİ HEM TEDARİKÇİ' ? 'İKİSİ DE' : t}
                        <span className="ml-2 opacity-60 text-xs">({counts[t]})</span>
                    </button>
                ))}
            </div>

            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Ad, vergi no veya telefon ara..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cea14a]/40 shadow-sm"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-blue-900/5 dark:shadow-blue-900/10 border border-gray-100 dark:border-slate-700/50 overflow-hidden">
                {loading ? (
                    <div className="text-center text-gray-400 py-16">Yükleniyor...</div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                        <Users size={40} className="opacity-30" />
                        <p className="font-medium">{search ? 'Arama sonucu bulunamadı' : 'Henüz cari hesap eklenmemiş'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-800">
                                    <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-xs">Cari Adı</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-xs">Tür</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-xs hidden md:table-cell">Vergi No</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-xs hidden lg:table-cell">Telefon</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-xs hidden lg:table-cell">E-posta</th>
                                    <th className="px-6 py-4" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {filtered.map(account => (
                                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-[#cea14a]/10 flex items-center justify-center text-[#cea14a] font-bold text-sm shrink-0">
                                                    {account.name[0].toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-gray-900 dark:text-white">{account.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                'px-2.5 py-1 rounded-lg text-xs font-semibold border',
                                                TYPE_STYLE[account.type]
                                            )}>
                                                {account.type === 'HEM MÜŞTERİ HEM TEDARİKÇİ' ? 'İKİSİ DE' : account.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300 font-mono hidden md:table-cell">
                                            {account.taxNo || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300 hidden lg:table-cell">
                                            {account.phone || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300 hidden lg:table-cell">
                                            {account.email || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(account)}
                                                    className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(account.id)}
                                                    className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Ekle/Düzenle Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 dark:border-slate-800 animate-slide-up">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editing ? 'Cari Hesabı Düzenle' : 'Yeni Cari Ekle'}
                            </h2>
                            <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cari Türü *</label>
                                <div className="flex gap-2 flex-wrap">
                                    {ACCOUNT_TYPES.map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, type: t }))}
                                            className={cn(
                                                'px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                                                form.type === t
                                                    ? 'bg-[#cea14a] text-white border-[#cea14a]'
                                                    : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-[#cea14a]/50'
                                            )}
                                        >
                                            {t === 'HEM MÜŞTERİ HEM TEDARİKÇİ' ? 'İKİSİ DE' : t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <FormField label="Cari Adı *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Müşteri / Tedarikçi adı" className="sm:col-span-2" />
                            <FormField label="Vergi No" value={form.taxNo || ''} onChange={v => setForm(f => ({ ...f, taxNo: v }))} placeholder="1234567890" />
                            <FormField label="Vergi Dairesi" value={form.taxOffice || ''} onChange={v => setForm(f => ({ ...f, taxOffice: v }))} placeholder="Kadıköy V.D." />
                            <FormField label="Telefon" value={form.phone || ''} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="0212 000 00 00" />
                            <FormField label="E-posta" value={form.email || ''} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="info@ornek.com" />
                            <FormField label="Adres" value={form.address || ''} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="İstanbul, Türkiye" className="sm:col-span-2" />
                        </div>
                        <div className="flex justify-end gap-3 p-6 pt-0">
                            <button onClick={closeModal} className="px-5 py-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold transition-colors">
                                İptal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name.trim()}
                                className="px-6 py-2.5 bg-[#cea14a] hover:bg-[#b8903f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg shadow-[#cea14a]/30 transition-all"
                            >
                                {saving ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Silme Onayı */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-slate-800 p-8 text-center">
                        <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cari Silinsin mi?</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Bu işlem geri alınamaz.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                Vazgeç
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/30 transition-colors">
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FormField({ label, value, onChange, placeholder, className }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cea14a]/40 transition"
            />
        </div>
    );
}
