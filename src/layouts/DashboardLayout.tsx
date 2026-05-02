import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    TrendingUp,
    TrendingDown,
    Briefcase,
    Menu,
    X,
    LogOut,
    ArrowRightLeft,
    Sun,
    Moon,
    Building2,
    Users,
    Landmark,
    Package,
    BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';

// Theme Hook
function useTheme() {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return { theme, toggleTheme };
}

function useCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser') || '{}')
    } catch {
        return {}
    }
}

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
    const navigate = useNavigate();
    const user = useCurrentUser();

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/login');
    };

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'ANA SAYFA' },
        { to: '/faturalar', icon: FileText, label: 'FATURALAR' },
        { to: '/gelir-icmal', icon: TrendingUp, label: 'GELİR İCMAL' },
        { to: '/gider-icmal', icon: TrendingDown, label: 'GİDER İCMAL' },
        { to: '/gelen-isler', icon: Briefcase, label: 'GELEN İŞLER' },
        { to: '/giden-isler', icon: ArrowRightLeft, label: 'GİDEN İŞLER' },
        { to: '/firmalar', icon: Building2, label: 'FİRMALAR' },
        { to: '/cariler', icon: Users, label: 'CARİ HESAPLAR' },
        { to: '/banka-kasa', icon: Landmark, label: 'BANKA & KASA' },
        { to: '/urunler', icon: Package, label: 'STOK & ÜRÜNLER' },
        { to: '/raporlar', icon: BarChart3, label: 'RAPORLAR' },
    ];

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity lg:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={toggle}
            />

            <aside
                className={cn(
                    "fixed top-4 left-4 bottom-4 z-50 w-72 bg-white/90 dark:bg-slate-900/90 glass rounded-3xl flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 shadow-2xl shadow-blue-900/5 dark:shadow-black/20 border border-white/20 dark:border-slate-800",
                    isOpen ? "translate-x-0" : "-translate-x-[110%]"
                )}
            >
                <div className="h-24 flex items-center px-8 border-b border-gray-100/50 dark:border-slate-800/50">
                    <div>
                        <span className="text-2xl font-bold text-[#cea14a] tracking-tight drop-shadow-sm">YTU FINANCE</span>
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-widest uppercase mt-1">ERP SYSTEM</p>
                    </div>
                    <button onClick={toggle} className="lg:hidden ml-auto text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }: { isActive: boolean }) => cn(
                                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-[#cea14a] text-white shadow-lg shadow-[#cea14a]/30"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-800 hover:text-[#cea14a] dark:hover:text-[#cea14a] hover:shadow-md"
                            )}
                        >
                            {({ isActive }: { isActive: boolean }) => (
                                <>
                                    <item.icon size={22} className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                                    <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                                    {!isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity dark:from-white/5" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6 mt-auto">
                    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-[#cea14a]/10 flex items-center justify-center text-[#cea14a] font-bold border border-[#cea14a]/20">
                                {(user.username || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{user.username || 'Kullanıcı'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        >
                            <LogOut size={14} />
                            Güvenli Çıkış
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const currentUser = useCurrentUser();

    return (
        <div className="flex min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
            <div className="hidden lg:block w-[19rem]" /> {/* Spacer for fixed sidebar */}
            <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 glass dark:glass-dark mx-4 lg:mx-8 mt-4 rounded-2xl mb-6 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl lg:hidden transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white hidden sm:block">Hoş Geldiniz, {currentUser.username || 'Kullanıcı'} 👋</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-slate-800 rounded-xl transition-all hover:text-[#cea14a] dark:hover:text-[#cea14a]"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                    </div>
                </header>

                <main className="flex-1 px-4 lg:px-8 pb-8 animate-fade-in text-gray-900 dark:text-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
