import { useState, useEffect } from 'react';
import {
    Plus, Search, Pencil, Trash2, X, Package,
    ChevronDown, ArrowDownCircle, ArrowUpCircle, RefreshCw, AlertTriangle
} from 'lucide-react';
import type { Product, StockMovement, StockMovementType, StockUnit } from '../types';
import { getAll, create, update, remove } from '../lib/api';
import Pagination from '../components/Pagination';
import { cn } from '../lib/utils';

const PAGE_SIZE = 15;
const UNITS: StockUnit[] = ['ADET', 'KG', 'LT', 'MT', 'M2', 'PAKET', 'KUTU'];
const MOVEMENT_TYPES: StockMovementType[] = ['GİRİŞ', 'ÇIKIŞ', 'SAYIM'];

const EMPTY_PRODUCT: Omit<Product, 'id' | 'createdAt'> = {
    name: '', category: '', unit: 'ADET', salePrice: 0, purchasePrice: 0,
    barcode: '', minStock: 0, currentStock: 0,
};

const MOVEMENT_STYLE: Record<StockMovementType, string> = {
    'GİRİŞ':  'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20',
    'ÇIKIŞ':  'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20',
    'SAYIM':  'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
};

function StockBar({ current, min }: { current: number; min: number }) {
    if (min <= 0) return null;
    const pct = Math.min(100, Math.round((current / min) * 100));
    const color = current <= 0 ? 'bg-red-500' : current < min ? 'bg-amber-400' : 'bg-green-500';
    return (
        <div className="mt-1">
            <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden w-20">
                <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default function Products() {
    const [tab, setTab] = useState<'urunler' | 'hareketler'>('urunler');
    const [products, setProducts] = useState<Product[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);

    // Ürün state
    const [productModal, setProductModal] = useState<'add' | Product | null>(null);
    const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
    const [productSaving, setProductSaving] = useState(false);
    const [productDeleteConfirm, setProductDeleteConfirm] = useState<string | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Hareket state
    const [movementModal, setMovementModal] = useState(false);
    const [movementForm, setMovementForm] = useState<Omit<StockMovement, 'id' | 'createdAt'>>({
        date: '', productId: '', productName: '', type: 'GİRİŞ', quantity: 0, unitPrice: 0, description: '',
    });
    const [movementSaving, setMovementSaving] = useState(false);
    const [movementSearch, setMovementSearch] = useState('');
    const [movementProductFilter, setMovementProductFilter] = useState('');
    const [movementPage, setMovementPage] = useState(1);

    useEffect(() => {
        Promise.all([
            getAll<Product>('urunler').catch(() => []),
            getAll<StockMovement>('stok-hareketleri').catch(() => []),
        ]).then(([prods, movs]) => {
            setProducts(prods);
            setMovements(movs);
            setLoading(false);
        });
    }, []);

    // — Ürün işlemleri —
    function openAddProduct() {
        setProductForm(EMPTY_PRODUCT);
        setProductModal('add');
    }

    function openEditProduct(p: Product) {
        setProductForm({ name: p.name, category: p.category || '', unit: p.unit, salePrice: p.salePrice, purchasePrice: p.purchasePrice, barcode: p.barcode || '', minStock: p.minStock, currentStock: p.currentStock });
        setProductModal(p);
    }

    async function saveProduct() {
        setProductSaving(true);
        try {
            if (productModal && productModal !== 'add') {
                const updated = await update<Product>('urunler', productModal.id, { ...productForm, createdAt: productModal.createdAt });
                setProducts(p => p.map(x => x.id === productModal.id ? updated : x));
            } else {
                const created = await create<Product>('urunler', { ...productForm, createdAt: new Date().toISOString() });
                setProducts(p => [...p, created]);
            }
            setProductModal(null);
        } finally { setProductSaving(false); }
    }

    async function deleteProduct(id: string) {
        await remove('urunler', id);
        setProducts(p => p.filter(x => x.id !== id));
        setProductDeleteConfirm(null);
    }

    // — Stok hareketi —
    function openMovementModal(productId?: string) {
        const p = productId ? products.find(x => x.id === productId) : undefined;
        setMovementForm({
            date: new Date().toISOString().slice(0, 10),
            productId: productId || '',
            productName: p?.name || '',
            type: 'GİRİŞ', quantity: 0, unitPrice: p?.purchasePrice || 0, description: '',
        });
        setMovementModal(true);
    }

    async function saveMovement() {
        setMovementSaving(true);
        try {
            const created = await create<StockMovement>('stok-hareketleri', { ...movementForm, createdAt: new Date().toISOString() });
            setMovements(p => [...p, created]);

            // Ürün stok miktarını güncelle
            const product = products.find(x => x.id === movementForm.productId);
            if (product) {
                let newStock = product.currentStock;
                if (movementForm.type === 'GİRİŞ') newStock += movementForm.quantity;
                else if (movementForm.type === 'ÇIKIŞ') newStock -= movementForm.quantity;
                else if (movementForm.type === 'SAYIM') newStock = movementForm.quantity;

                const updated = await update<Product>('urunler', product.id, { ...product, currentStock: newStock });
                setProducts(p => p.map(x => x.id === product.id ? updated : x));
            }
            setMovementModal(false);
        } finally { setMovementSaving(false); }
    }

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode || '').includes(productSearch);
        const matchCat = !categoryFilter || p.category === categoryFilter;
        return matchSearch && matchCat;
    });

    const filteredMovements = movements.filter(m => {
        const matchSearch = m.productName.toLowerCase().includes(movementSearch.toLowerCase()) || (m.description || '').toLowerCase().includes(movementSearch.toLowerCase());
        const matchProduct = !movementProductFilter || m.productId === movementProductFilter;
        return matchSearch && matchProduct;
    }).sort((a, b) => b.date.localeCompare(a.date));

    const paginatedMovements = filteredMovements.slice((movementPage - 1) * PAGE_SIZE, movementPage * PAGE_SIZE);
    const lowStockCount = products.filter(p => p.minStock > 0 && p.currentStock < p.minStock).length;

    const pf = <K extends keyof typeof productForm>(key: K, val: typeof productForm[K]) =>
        setProductForm(p => ({ ...p, [key]: val }));

    const mf = <K extends keyof typeof movementForm>(key: K, val: typeof movementForm[K]) =>
        setMovementForm(p => ({ ...p, [key]: val }));

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Stok & Ürünler</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Ürün kataloğu ve stok takibi</p>
                </div>
                <button
                    onClick={() => tab === 'urunler' ? openAddProduct() : openMovementModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#cea14a] hover:bg-[#b8903f] text-white font-semibold rounded-2xl shadow-lg shadow-[#cea14a]/30 transition-all"
                >
                    <Plus size={18} />
                    {tab === 'urunler' ? 'Yeni Ürün' : 'Yeni Hareket'}
                </button>
            </div>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard label="Toplam Ürün" value={String(products.length)} />
                <SummaryCard label="Toplam Stok Değeri" value={`₺${products.reduce((s, p) => s + p.currentStock * p.salePrice, 0).toLocaleString()}`} />
                <SummaryCard label="Düşük Stok" value={String(lowStockCount)} alert={lowStockCount > 0} />
                <SummaryCard label="Toplam Hareket" value={String(movements.length)} />
            </div>

            {lowStockCount > 0 && (
                <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span className="text-sm font-semibold">{lowStockCount} ürün minimum stok seviyesinin altında!</span>
                </div>
            )}

            {/* Sekmeler */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl w-fit">
                {(['urunler', 'hareketler'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={cn('px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                            tab === t ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200')}>
                        {t === 'urunler' ? '📦 Ürünler' : '📊 Stok Hareketleri'}
                    </button>
                ))}
            </div>

            {/* — ÜRÜNLER SEKMESİ — */}
            {tab === 'urunler' && (
                <div className="space-y-4">
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-64">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Ürün adı veya barkod ara..."
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cea14a]/40 shadow-sm" />
                        </div>
                        {categories.length > 0 && (
                            <div className="relative">
                                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                                    className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none appearance-none pr-10 font-medium">
                                    <option value="">Tüm Kategoriler</option>
                                    {categories.map(c => <option key={c}>{c}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
                            <Package size={40} className="opacity-30" />
                            <p className="font-medium">{productSearch ? 'Arama sonucu bulunamadı' : 'Henüz ürün eklenmemiş'}</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-slate-800">
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ürün</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Kategori</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Stok</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Alış</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Satış</th>
                                        <th className="px-4 py-4" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                    {filteredProducts.map(product => {
                                        const isLow = product.minStock > 0 && product.currentStock < product.minStock;
                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0', isLow ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-[#cea14a]/10 text-[#cea14a]')}>
                                                            {isLow ? <AlertTriangle size={16} /> : product.name[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                                                            {product.barcode && <p className="text-xs text-gray-400 font-mono">{product.barcode}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    {product.category && (
                                                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-xs font-semibold">{product.category}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={cn('font-bold', isLow ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white')}>
                                                        {product.currentStock} {product.unit}
                                                    </span>
                                                    <StockBar current={product.currentStock} min={product.minStock} />
                                                    {isLow && <p className="text-xs text-red-400">Min: {product.minStock}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-500 dark:text-slate-400 hidden lg:table-cell">
                                                    ₺{product.purchasePrice.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                                                    ₺{product.salePrice.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openMovementModal(product.id)} title="Stok Hareketi Ekle"
                                                            className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10 text-gray-400 hover:text-green-500 transition-colors"><RefreshCw size={14} /></button>
                                                        <button onClick={() => openEditProduct(product)} title="Düzenle"
                                                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-400 hover:text-blue-500 transition-colors"><Pencil size={14} /></button>
                                                        <button onClick={() => setProductDeleteConfirm(product.id)} title="Sil"
                                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* — HAREKETLER SEKMESİ — */}
            {tab === 'hareketler' && (
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={movementSearch} onChange={e => { setMovementSearch(e.target.value); setMovementPage(1); }} placeholder="Ürün adı veya açıklama ara..."
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cea14a]/40 shadow-sm" />
                        </div>
                        <div className="relative">
                            <select value={movementProductFilter} onChange={e => { setMovementProductFilter(e.target.value); setMovementPage(1); }}
                                className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none appearance-none pr-10 font-medium">
                                <option value="">Tüm Ürünler</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
                        ) : filteredMovements.length === 0 ? (
                            <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
                                <RefreshCw size={40} className="opacity-30" />
                                <p className="font-medium">Henüz stok hareketi yok</p>
                            </div>
                        ) : (
                            <>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-slate-800">
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tarih</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ürün</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tür</th>
                                            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Miktar</th>
                                            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Birim Fiyat</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Açıklama</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                        {paginatedMovements.map(mov => {
                                            const product = products.find(p => p.id === mov.productId);
                                            return (
                                                <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-mono text-xs">{mov.date}</td>
                                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{mov.productName}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 w-fit', MOVEMENT_STYLE[mov.type])}>
                                                            {mov.type === 'GİRİŞ' ? <ArrowDownCircle size={12} /> : mov.type === 'ÇIKIŞ' ? <ArrowUpCircle size={12} /> : <RefreshCw size={12} />}
                                                            {mov.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold">
                                                        <span className={cn(mov.type === 'GİRİŞ' ? 'text-green-600 dark:text-green-400' : mov.type === 'ÇIKIŞ' ? 'text-red-500 dark:text-red-400' : 'text-blue-600 dark:text-blue-400')}>
                                                            {mov.type === 'GİRİŞ' ? '+' : mov.type === 'ÇIKIŞ' ? '-' : '='}{mov.quantity} {product?.unit || ''}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-500 dark:text-slate-400 hidden lg:table-cell">
                                                        {mov.unitPrice > 0 ? `₺${mov.unitPrice.toLocaleString()}` : '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 hidden md:table-cell">{mov.description || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div className="px-6 border-t border-gray-100 dark:border-slate-800">
                                    <Pagination total={filteredMovements.length} page={movementPage} pageSize={PAGE_SIZE} onPageChange={setMovementPage} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Ürün Ekle/Düzenle Modal */}
            {productModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{productModal === 'add' ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}</h2>
                            <button onClick={() => setProductModal(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FField label="Ürün Adı *" value={productForm.name} onChange={v => pf('name', v)} placeholder="Ürün adı" className="sm:col-span-2" />
                            <FField label="Kategori" value={productForm.category || ''} onChange={v => pf('category', v)} placeholder="Elektronik, Tekstil..." />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Birim</label>
                                <div className="relative">
                                    <select value={productForm.unit} onChange={e => pf('unit', e.target.value as StockUnit)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none appearance-none">
                                        {UNITS.map(u => <option key={u}>{u}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <FField label="Alış Fiyatı (₺)" value={String(productForm.purchasePrice)} onChange={v => pf('purchasePrice', parseFloat(v) || 0)} type="number" />
                            <FField label="Satış Fiyatı (₺)" value={String(productForm.salePrice)} onChange={v => pf('salePrice', parseFloat(v) || 0)} type="number" />
                            <FField label="Mevcut Stok" value={String(productForm.currentStock)} onChange={v => pf('currentStock', parseFloat(v) || 0)} type="number" />
                            <FField label="Min. Stok Uyarı Seviyesi" value={String(productForm.minStock)} onChange={v => pf('minStock', parseFloat(v) || 0)} type="number" />
                            <FField label="Barkod" value={productForm.barcode || ''} onChange={v => pf('barcode', v)} placeholder="8690000000001" className="sm:col-span-2" />
                        </div>
                        <div className="flex justify-end gap-3 p-6 pt-0">
                            <button onClick={() => setProductModal(null)} className="px-5 py-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold transition-colors">İptal</button>
                            <button onClick={saveProduct} disabled={productSaving || !productForm.name.trim()}
                                className="px-6 py-2.5 bg-[#cea14a] hover:bg-[#b8903f] disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-[#cea14a]/30 transition-all">
                                {productSaving ? 'Kaydediliyor...' : productModal === 'add' ? 'Kaydet' : 'Güncelle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stok Hareketi Modal */}
            {movementModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Stok Hareketi Ekle</h2>
                            <button onClick={() => setMovementModal(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Hareket Türü */}
                            <div className="flex gap-2">
                                {MOVEMENT_TYPES.map(t => (
                                    <button key={t} type="button" onClick={() => mf('type', t)}
                                        className={cn('flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5',
                                            movementForm.type === t
                                                ? t === 'GİRİŞ' ? 'bg-green-500 text-white border-green-500' : t === 'ÇIKIŞ' ? 'bg-red-500 text-white border-red-500' : 'bg-blue-500 text-white border-blue-500'
                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700')}>
                                        {t === 'GİRİŞ' ? <ArrowDownCircle size={14} /> : t === 'ÇIKIŞ' ? <ArrowUpCircle size={14} /> : <RefreshCw size={14} />}
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ürün *</label>
                                    <div className="relative">
                                        <select value={movementForm.productId}
                                            onChange={e => {
                                                const p = products.find(x => x.id === e.target.value);
                                                setMovementForm(prev => ({ ...prev, productId: e.target.value, productName: p?.name || '', unitPrice: p?.purchasePrice || 0 }));
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none appearance-none">
                                            <option value="">Ürün seçin...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <FField label="Tarih *" value={movementForm.date} onChange={v => mf('date', v)} type="date" />
                                <FField label={movementForm.type === 'SAYIM' ? 'Sayım Miktarı *' : 'Miktar *'} value={String(movementForm.quantity)} onChange={v => mf('quantity', parseFloat(v) || 0)} type="number" />
                                <FField label="Birim Fiyat (₺)" value={String(movementForm.unitPrice)} onChange={v => mf('unitPrice', parseFloat(v) || 0)} type="number" />
                            </div>
                            <FField label="Açıklama" value={movementForm.description || ''} onChange={v => mf('description', v)} placeholder="Tedarikçi alımı, satış, sayım notu..." />
                        </div>
                        <div className="flex justify-end gap-3 p-6 pt-0">
                            <button onClick={() => setMovementModal(false)} className="px-5 py-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold transition-colors">İptal</button>
                            <button onClick={saveMovement} disabled={movementSaving || !movementForm.productId || movementForm.quantity <= 0}
                                className="px-6 py-2.5 bg-[#cea14a] hover:bg-[#b8903f] disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-[#cea14a]/30 transition-all">
                                {movementSaving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {productDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-slate-800 p-8 text-center">
                        <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-500" /></div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ürün silinsin mi?</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Bu işlem geri alınamaz.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setProductDeleteConfirm(null)} className="flex-1 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Vazgeç</button>
                            <button onClick={() => deleteProduct(productDeleteConfirm)} className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/30 transition-colors">Sil</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
    return (
        <div className={cn('rounded-2xl p-5 border shadow-sm', alert ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/50' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-700/50')}>
            <p className={cn('text-xs font-semibold uppercase tracking-wider mb-1', alert ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-slate-400')}>{label}</p>
            <p className={cn('text-2xl font-bold', alert ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white')}>{value}</p>
        </div>
    );
}

function FField({ label, value, onChange, placeholder, type = 'text', className }: {
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
