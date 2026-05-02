import { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Briefcase, Building,
    CheckCircle2, Clock3, Banknote, ArrowRight, ChevronDown, X,
    Calendar, Hash, FileText, Tag, Wallet, StickyNote, Receipt,
    Pencil, Trash2
} from 'lucide-react';
import type { IncomingJob, OutgoingJob, JobStatus, JobType } from '../types';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { cn } from '../lib/utils';
import { getAll, create, update, remove } from '../lib/api';

interface JobListProps {
    type: 'GELEN' | 'GİDEN';
}

type AnyJob = IncomingJob | OutgoingJob;
type IncomingJobForm = Omit<IncomingJob, 'id'>;
type OutgoingJobForm = Omit<OutgoingJob, 'id'>;

const PAGE_SIZE = 15;

const JOB_TYPES: JobType[] = [
    'EKB ÇİZİM VE ONAYI', 'EKB ÇİZİMİ', 'EKB ONAYI',
    'ÖN HESAP SONUÇ FORMU', 'AKUSTİK RAPOR & PROJE', '3BSYM'
];
const JOB_STATUSES: JobStatus[] = ['TESLİM EDİLDİ', 'DEVAM EDİYOR', 'İPTAL EDİLDİ', 'BEKLEMEDE'];

const emptyIncoming = (): IncomingJobForm => ({
    date: '', fileNo: '', customerName: '', jobName: '',
    jobType: 'EKB ÇİZİMİ', status: 'DEVAM EDİYOR',
    saleAmount: 0, paymentStatus: 'ÖDENMEDİ',
    fileName: '', note1: '', note2: '',
});

const emptyOutgoing = (): OutgoingJobForm => ({
    date: '', fileNo: '', customerName: '', jobName: '',
    jobType: 'EKB ÇİZİMİ', status: 'DEVAM EDİYOR',
    saleAmount: 0, paymentStatus: 'ÖDENMEDİ',
    fee: 0, note2: '', note3: '',
});

const inputCls = "w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500";
const selectCls = "w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none appearance-none font-medium text-gray-900 dark:text-white";

const STATUS_COLORS: Record<string, string> = {
    'TESLİM EDİLDİ': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    'DEVAM EDİYOR':  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    'BEKLEMEDE':     'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    'İPTAL EDİLDİ': 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | number }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
            <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 shrink-0">
                <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 break-words">{value}</p>
            </div>
        </div>
    );
}

function JobDetailModal({ job, type, onClose, onEdit, onDelete }: {
    job: AnyJob; type: 'GELEN' | 'GİDEN';
    onClose: () => void; onEdit: (job: AnyJob) => void; onDelete: (id: string) => void;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const isIncoming = type === 'GELEN';
    const incoming = isIncoming ? (job as IncomingJob) : null;
    const outgoing = !isIncoming ? (job as OutgoingJob) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700 overflow-hidden animate-slide-up">
                <div className={cn(
                    "px-6 py-5 flex items-center justify-between",
                    isIncoming ? "bg-gradient-to-r from-orange-500 to-orange-400" : "bg-gradient-to-r from-purple-600 to-purple-500"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/20 rounded-xl flex flex-col items-center justify-center text-white">
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">DOSYA</span>
                            <span className="text-xs font-bold font-mono leading-none">{job.fileNo}</span>
                        </div>
                        <div>
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">{isIncoming ? 'Gelen İş' : 'Giden İş'}</p>
                            <h3 className="text-white font-bold text-lg leading-tight">{job.jobName}</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors"><X size={20} /></button>
                </div>
                <div className="px-6 py-3 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5", STATUS_COLORS[job.status] || STATUS_COLORS['İPTAL EDİLDİ'])}>
                        {job.status === 'TESLİM EDİLDİ' ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                        {job.status}
                    </span>
                    <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">₺{job.saleAmount.toLocaleString()}</p>
                        <p className={cn("text-xs font-bold flex items-center gap-1 justify-end", job.paymentStatus === 'ÖDEME ALINDI' ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
                            <Banknote size={11} />{job.paymentStatus}
                        </p>
                    </div>
                </div>
                <div className="px-6 py-2 max-h-64 overflow-y-auto">
                    <DetailRow icon={Building}  label="Müşteri"      value={job.customerName} />
                    <DetailRow icon={Calendar}  label="Tarih"        value={job.date} />
                    <DetailRow icon={Hash}      label="Dosya No"     value={job.fileNo} />
                    <DetailRow icon={Tag}       label="İş Tipi"      value={job.jobType} />
                    {outgoing && <DetailRow icon={Receipt}    label="Harç Ücreti" value={outgoing.fee ? `₺${outgoing.fee.toLocaleString()}` : undefined} />}
                    {incoming && <DetailRow icon={FileText}   label="Dosya Adı"   value={incoming.fileName} />}
                    {incoming?.note1 && <DetailRow icon={StickyNote} label="Not 1" value={incoming.note1} />}
                    {(incoming?.note2 || outgoing?.note2) && <DetailRow icon={StickyNote} label="Not 2" value={incoming?.note2 || outgoing?.note2} />}
                    {outgoing?.note3 && <DetailRow icon={StickyNote} label="Not 3" value={outgoing.note3} />}
                    <DetailRow icon={Wallet} label="Toplam Tutar" value={`₺${job.saleAmount.toLocaleString()}`} />
                </div>
                {confirmDelete ? (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-red-50 dark:bg-red-900/10">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 text-center">Bu iş kalıcı olarak silinecek. Emin misiniz?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm">Vazgeç</button>
                            <button onClick={() => onDelete(job.id)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors text-sm">Evet, Sil</button>
                        </div>
                    </div>
                ) : (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
                        <button onClick={() => setConfirmDelete(true)} className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl border border-red-200 dark:border-red-800/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold transition-colors text-sm">
                            <Trash2 size={15} />Sil
                        </button>
                        <button onClick={() => onEdit(job)} className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-colors text-sm">
                            <Pencil size={15} />Düzenle
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function JobList({ type }: JobListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPayment, setFilterPayment] = useState('');
    const [selectedJob, setSelectedJob] = useState<AnyJob | null>(null);
    const [editingJob, setEditingJob] = useState<AnyJob | null>(null);
    const [jobs, setJobs] = useState<AnyJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [inForm, setInForm] = useState<IncomingJobForm>(emptyIncoming());
    const [outForm, setOutForm] = useState<OutgoingJobForm>(emptyOutgoing());
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const resource = type === 'GELEN' ? 'gelen-isler' : 'giden-isler';

    useEffect(() => {
        setLoading(true);
        getAll<AnyJob>(resource).then(data => { setJobs(data); setLoading(false); });
    }, [resource]);

    // Filtre değişince sayfa sıfırla ve seçimi temizle
    useEffect(() => { setPage(1); setSelected(new Set()); }, [searchTerm, filterStatus, filterPayment]);

    function openEdit(job: AnyJob) {
        setSelectedJob(null);
        setEditingJob(job);
        if (type === 'GELEN') {
            const j = job as IncomingJob;
            setInForm({ date: j.date, fileNo: j.fileNo, customerName: j.customerName, jobName: j.jobName, jobType: j.jobType, status: j.status, saleAmount: j.saleAmount, paymentStatus: j.paymentStatus, fileName: j.fileName, note1: j.note1 || '', note2: j.note2 || '' });
        } else {
            const j = job as OutgoingJob;
            setOutForm({ date: j.date, fileNo: j.fileNo, customerName: j.customerName, jobName: j.jobName, jobType: j.jobType, status: j.status, saleAmount: j.saleAmount, paymentStatus: j.paymentStatus, fee: j.fee, note2: j.note2 || '', note3: j.note3 || '' });
        }
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingJob(null);
        setInForm(emptyIncoming());
        setOutForm(emptyOutgoing());
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingJob) {
            if (type === 'GELEN') {
                const data = { ...inForm, fileName: `${inForm.fileNo}_${inForm.customerName.replace(/\s+/g, '_')}` };
                const updated = await update<IncomingJob>(resource, editingJob.id, data);
                setJobs(prev => prev.map(j => j.id === editingJob.id ? updated : j));
            } else {
                const updated = await update<OutgoingJob>(resource, editingJob.id, outForm);
                setJobs(prev => prev.map(j => j.id === editingJob.id ? updated : j));
            }
        } else {
            if (type === 'GELEN') {
                const data = { ...inForm, fileName: `${inForm.fileNo}_${inForm.customerName.replace(/\s+/g, '_')}` };
                const created = await create<IncomingJob>(resource, data);
                setJobs(prev => [...prev, created]);
            } else {
                const created = await create<OutgoingJob>(resource, outForm);
                setJobs(prev => [...prev, created]);
            }
        }
        closeModal();
    };

    async function handleDelete(id: string) {
        await remove(resource, id);
        setJobs(prev => prev.filter(j => j.id !== id));
        setSelectedJob(null);
        setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
    }

    async function handleBulkDelete() {
        await Promise.all([...selected].map(id => remove(resource, id)));
        setJobs(prev => prev.filter(j => !selected.has(j.id)));
        setSelected(new Set());
        setBulkDeleteConfirm(false);
    }

    function toggleSelect(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        setSelected(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    }

    const setIn = (field: keyof IncomingJobForm) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const val = e.target.value;
            setInForm(prev => ({ ...prev, [field]: field === 'saleAmount' ? parseFloat(val) || 0 : val }));
        };

    const setOut = (field: keyof OutgoingJobForm) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const val = e.target.value;
            setOutForm(prev => ({ ...prev, [field]: ['saleAmount', 'fee'].includes(field) ? parseFloat(val) || 0 : val }));
        };

    const filtered = jobs.filter(j => {
        const matchSearch = [j.fileNo, j.customerName, j.jobName].some(v => v.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchStatus = !filterStatus || j.status === filterStatus;
        const matchPayment = !filterPayment || j.paymentStatus === filterPayment;
        return matchSearch && matchStatus && matchPayment;
    });

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const allPageSelected = paginated.length > 0 && paginated.every(j => selected.has(j.id));
    const hasActiveFilters = filterStatus || filterPayment;
    const modalTitle = editingJob ? (type === 'GELEN' ? 'Gelen İşi Düzenle' : 'Giden İşi Düzenle') : (type === 'GELEN' ? 'Yeni Gelen İş' : 'Yeni Giden İş');

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
                <button onClick={() => { setEditingJob(null); setIsModalOpen(true); }}
                    className="group flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 duration-200">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-semibold">Yeni İş Ekle</span>
                </button>
            </div>

            {/* Toplu işlem çubuğu */}
            {selected.size > 0 && (
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">{selected.size} kayıt seçildi</span>
                        <button onClick={() => setSelected(new Set())} className="text-blue-200 hover:text-white text-xs underline underline-offset-2 transition-colors">Seçimi temizle</button>
                    </div>
                    <button
                        onClick={() => setBulkDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-md"
                    >
                        <Trash2 size={15} />
                        Seçilenleri Sil
                    </button>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {type === 'GELEN' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Tarih</label>
                                    <input required type="date" value={inForm.date} onChange={setIn('date')} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Dosya No</label>
                                    <input required type="text" value={inForm.fileNo} onChange={setIn('fileNo')} className={inputCls} placeholder="202602001" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Müşteri Adı</label>
                                <input required type="text" value={inForm.customerName} onChange={setIn('customerName')} className={inputCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">İş Adı</label>
                                    <input required type="text" value={inForm.jobName} onChange={setIn('jobName')} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">İş Tipi</label>
                                    <div className="relative">
                                        <select value={inForm.jobType} onChange={setIn('jobType')} className={selectCls}>
                                            {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Durum</label>
                                    <div className="relative">
                                        <select value={inForm.status} onChange={setIn('status')} className={selectCls}>
                                            {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Tutar (₺)</label>
                                    <input required type="number" value={inForm.saleAmount || ''} onChange={setIn('saleAmount')} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Ödeme</label>
                                    <div className="relative">
                                        <select value={inForm.paymentStatus} onChange={setIn('paymentStatus')} className={selectCls}>
                                            <option>ÖDENMEDİ</option>
                                            <option>ÖDEME ALINDI</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Not 1</label>
                                    <input type="text" value={inForm.note1 || ''} onChange={setIn('note1')} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Not 2</label>
                                    <input type="text" value={inForm.note2 || ''} onChange={setIn('note2')} className={inputCls} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Tarih</label>
                                    <input required type="date" value={outForm.date} onChange={setOut('date')} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Dosya No</label>
                                    <input required type="text" value={outForm.fileNo} onChange={setOut('fileNo')} className={inputCls} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Müşteri / Firma Adı</label>
                                <input required type="text" value={outForm.customerName} onChange={setOut('customerName')} className={inputCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">İş Adı</label>
                                    <input required type="text" value={outForm.jobName} onChange={setOut('jobName')} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">İş Tipi</label>
                                    <input type="text" value={outForm.jobType} onChange={setOut('jobType')} className={inputCls} />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Durum</label>
                                    <div className="relative">
                                        <select value={outForm.status} onChange={setOut('status')} className={selectCls}>
                                            {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Tutar (₺)</label>
                                    <input required type="number" value={outForm.saleAmount || ''} onChange={setOut('saleAmount')} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Harç (₺)</label>
                                    <input type="number" value={outForm.fee || ''} onChange={setOut('fee')} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Ödeme</label>
                                    <div className="relative">
                                        <select value={outForm.paymentStatus} onChange={setOut('paymentStatus')} className={selectCls}>
                                            <option>ÖDENMEDİ</option>
                                            <option>ÖDEME ALINDI</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Not 2</label>
                                    <input type="text" value={outForm.note2 || ''} onChange={setOut('note2')} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Not 3</label>
                                    <input type="text" value={outForm.note3 || ''} onChange={setOut('note3')} className={inputCls} />
                                </div>
                            </div>
                        </>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeModal}
                            className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">İptal</button>
                        <button type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
                            {editingJob ? 'Güncelle' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="glass dark:glass-dark rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden">
                <div className="p-6 border-b border-gray-100/50 dark:border-slate-700/50 flex flex-col gap-4 backdrop-blur-xl bg-white/60 dark:bg-slate-900/40">
                    <div className="flex flex-col md:flex-row gap-4">
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
                    </div>
                    {showFilters && (
                        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100/50 dark:border-slate-700/50">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Durum:</label>
                                <div className="relative">
                                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                        className="pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium outline-none appearance-none text-gray-900 dark:text-white">
                                        <option value="">Tümü</option>
                                        {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Ödeme:</label>
                                <div className="relative">
                                    <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
                                        className="pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium outline-none appearance-none text-gray-900 dark:text-white">
                                        <option value="">Tümü</option>
                                        <option>ÖDEME ALINDI</option>
                                        <option>ÖDENMEDİ</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            {hasActiveFilters && (
                                <button onClick={() => { setFilterStatus(''); setFilterPayment(''); }}
                                    className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                    <X size={14} />Temizle
                                </button>
                            )}
                        </div>
                    )}
                    {/* Tümünü seç (bu sayfadaki) */}
                    {paginated.length > 0 && (
                        <div className="flex items-center gap-3 pt-1 border-t border-gray-100/50 dark:border-slate-700/50">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={allPageSelected}
                                    onChange={e => {
                                        if (e.target.checked) setSelected(prev => new Set([...prev, ...paginated.map(j => j.id)]));
                                        else setSelected(prev => { const s = new Set(prev); paginated.forEach(j => s.delete(j.id)); return s; });
                                    }}
                                    className="w-4 h-4 rounded accent-[#cea14a]"
                                />
                                <span className="font-medium">Bu sayfadakileri seç ({paginated.length})</span>
                            </label>
                        </div>
                    )}
                </div>

                <div className="grid gap-4 p-6 bg-gray-50/50 dark:bg-slate-900/50">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">Kayıt bulunamadı.</div>
                    ) : paginated.map((job) => (
                        <div
                            key={job.id}
                            onClick={() => setSelectedJob(job)}
                            className={cn(
                                "group bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden cursor-pointer",
                                selected.has(job.id)
                                    ? "border-[#cea14a] ring-2 ring-[#cea14a]/30"
                                    : "border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/30"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-5">
                                    {/* Checkbox */}
                                    <div
                                        className="mt-1 shrink-0"
                                        onClick={e => toggleSelect(job.id, e)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected.has(job.id)}
                                            onChange={() => {}}
                                            className="w-4 h-4 rounded accent-[#cea14a] cursor-pointer"
                                        />
                                    </div>
                                    <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center shadow-inner shrink-0">
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
                                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5", STATUS_COLORS[job.status] || STATUS_COLORS['İPTAL EDİLDİ'])}>
                                            {job.status === 'TESLİM EDİLDİ' ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                                            {job.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end min-w-[120px]">
                                        <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">₺{job.saleAmount.toLocaleString()}</span>
                                        <span className={cn(
                                            "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide",
                                            job.paymentStatus === 'ÖDEME ALINDI' ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                                        )}>
                                            <Banknote size={12} />{job.paymentStatus}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 border-t border-gray-100 dark:border-slate-800">
                    <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
                </div>
            </div>

            {selectedJob && (
                <JobDetailModal job={selectedJob} type={type} onClose={() => setSelectedJob(null)} onEdit={openEdit} onDelete={handleDelete} />
            )}

            {/* Toplu silme onayı */}
            {bulkDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-slate-800 p-8 text-center">
                        <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{selected.size} kayıt silinsin mi?</h3>
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
