import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Building2, X } from 'lucide-react';
import type { Company } from '../types';
import { getAll, create, update, remove } from '../lib/api';
import { cn } from '../lib/utils';

const EMPTY_FORM: Omit<Company, 'id' | 'createdAt'> = {
    name: '',
    taxNo: '',
    taxOffice: '',
    tradeRegNo: '',
    address: '',
    phone: '',
    email: '',
    sector: '',
};

export default function Companies() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Company | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        loadCompanies();
    }, []);

    async function loadCompanies() {
        setLoading(true);
        try {
            const data = await getAll<Company>('firmalar');
            setCompanies(data);
        } catch {
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    }

    function openAdd() {
        setEditing(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    }

    function openEdit(company: Company) {
        setEditing(company);
        setForm({
            name: company.name,
            taxNo: company.taxNo,
            taxOffice: company.taxOffice,
            tradeRegNo: company.tradeRegNo || '',
            address: company.address,
            phone: company.phone,
            email: company.email || '',
            sector: company.sector || '',
        });
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditing(null);
    }

    async function handleSave() {
        if (!form.name.trim() || !form.taxNo.trim()) return;
        setSaving(true);
        try {
            if (editing) {
                const updated = await update<Company>('firmalar', editing.id, {
                    ...form,
                    createdAt: editing.createdAt,
                });
                setCompanies(prev => prev.map(c => c.id === editing.id ? updated : c));
            } else {
                const created = await create<Company>('firmalar', {
                    ...form,
                    createdAt: new Date().toISOString(),
                });
                setCompanies(prev => [...prev, created]);
            }
            closeModal();
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        await remove('firmalar', id);
        setCompanies(prev => prev.filter(c => c.id !== id));
        setDeleteConfirm(null);
    }

    const filtered = companies.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.taxNo.includes(search) ||
        (c.sector || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Firmalar</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Kayıtlı firma bilgilerini yönetin</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#cea14a] hover:bg-[#b8903f] text-white font-semibold rounded-2xl shadow-lg shadow-[#cea14a]/30 transition-all"
                >
                    <Plus size={18} />
                    Yeni Firma
                </button>
            </div>

            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Firma adı, vergi no veya sektör ara..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cea14a]/40 shadow-sm"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-blue-900/5 dark:shadow-blue-900/10 border border-gray-100 dark:border-slate-700/50 overflow-hidden">
                {loading ? (
                    <div className="text-center text-gray-400 py-16">Yükleniyor...</div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                        <Building2 size={40} className="opacity-30" />
                        <p className="font-medium">{search ? 'Arama sonucu bulunamadı' : 'Henüz firma eklenmemiş'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-800">
                                    <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-xs">Firma Adı</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-xs">Vergi No</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-xs hidden md:table-cell">Vergi Dairesi</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-xs hidden lg:table-cell">Telefon</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-xs hidden lg:table-cell">Sektör</th>
                                    <th className="px-6 py-4" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {filtered.map(company => (
                                    <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-[#cea14a]/10 flex items-center justify-center text-[#cea14a] font-bold text-sm shrink-0">
                                                    {company.name[0].toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-gray-900 dark:text-white">{company.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300 font-mono">{company.taxNo}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300 hidden md:table-cell">{company.taxOffice}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300 hidden lg:table-cell">{company.phone}</td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            {company.sector && (
                                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-500/20">
                                                    {company.sector}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(company)}
                                                    className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(company.id)}
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
                                {editing ? 'Firmayı Düzenle' : 'Yeni Firma Ekle'}
                            </h2>
                            <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Firma Adı *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="ABC Ltd. Şti." />
                            <FormField label="Vergi No *" value={form.taxNo} onChange={v => setForm(f => ({ ...f, taxNo: v }))} placeholder="1234567890" />
                            <FormField label="Vergi Dairesi" value={form.taxOffice} onChange={v => setForm(f => ({ ...f, taxOffice: v }))} placeholder="Kadıköy V.D." />
                            <FormField label="Ticaret Sicil No" value={form.tradeRegNo || ''} onChange={v => setForm(f => ({ ...f, tradeRegNo: v }))} placeholder="12345" />
                            <FormField label="Telefon" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="0212 000 00 00" />
                            <FormField label="E-posta" value={form.email || ''} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="info@firma.com" />
                            <FormField label="Sektör" value={form.sector || ''} onChange={v => setForm(f => ({ ...f, sector: v }))} placeholder="İnşaat, Tekstil..." />
                            <FormField label="Adres" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="İstanbul, Türkiye" className="sm:col-span-2" />
                        </div>
                        <div className="flex justify-end gap-3 p-6 pt-0">
                            <button onClick={closeModal} className="px-5 py-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold transition-colors">
                                İptal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name.trim() || !form.taxNo.trim()}
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
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Firma Silinsin mi?</h3>
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
