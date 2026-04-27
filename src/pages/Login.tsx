import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User, X, KeyRound } from 'lucide-react';

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'İşlem başarısız');
                return;
            }
            setSuccess(true);
        } catch {
            setError('Sunucuya bağlanılamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 animate-slide-up">
                <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors">
                    <X size={22} />
                </button>
                <div className="text-center mb-8">
                    <div className="h-14 w-14 bg-[#cea14a] rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#cea14a]/30 mb-5">
                        <KeyRound size={24} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Şifre Sıfırla</h2>
                    <p className="text-gray-500 mt-1 text-sm font-medium">E-posta ve yeni şifrenizi girin</p>
                </div>
                {success ? (
                    <div className="text-center py-6">
                        <div className="text-4xl mb-4">✓</div>
                        <p className="text-green-600 font-bold text-lg">Şifre güncellendi!</p>
                        <p className="text-gray-500 text-sm mt-2">Yeni şifrenizle giriş yapabilirsiniz.</p>
                        <button onClick={onClose} className="mt-6 w-full bg-[#cea14a] hover:bg-[#b0883b] text-white py-3 rounded-2xl font-bold transition-colors">
                            Giriş Sayfasına Dön
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">E-Posta</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#cea14a] transition-colors" size={20} />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#cea14a]/10 focus:border-[#cea14a]/50 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
                                    placeholder="ornek@ytufinance.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Yeni Şifre</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#cea14a] transition-colors" size={20} />
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#cea14a]/10 focus:border-[#cea14a]/50 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
                                    placeholder="••••••••" />
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
                        <button type="submit" disabled={loading}
                            className="w-full bg-[#cea14a] hover:bg-[#b0883b] disabled:opacity-60 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#cea14a]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group">
                            <span>{loading ? 'Güncelleniyor...' : 'Şifreyi Sıfırla'}</span>
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

function RegisterModal({ onClose }: { onClose: () => void }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Kayıt başarısız');
                return;
            }
            setSuccess(true);
        } catch {
            setError('Sunucuya bağlanılamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 animate-slide-up">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors"
                >
                    <X size={22} />
                </button>

                <div className="text-center mb-8">
                    <div className="h-14 w-14 bg-[#cea14a] rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#cea14a]/30 mb-5">
                        <span className="text-xl font-bold text-white tracking-tighter">Y</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Kayıt Ol</h2>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Yeni hesap oluşturun</p>
                </div>

                {success ? (
                    <div className="text-center py-6">
                        <div className="text-4xl mb-4">✓</div>
                        <p className="text-green-600 font-bold text-lg">Kayıt başarılı!</p>
                        <p className="text-gray-500 text-sm mt-2">Artık giriş yapabilirsiniz.</p>
                        <button
                            onClick={onClose}
                            className="mt-6 w-full bg-[#cea14a] hover:bg-[#b0883b] text-white py-3 rounded-2xl font-bold transition-colors"
                        >
                            Giriş Sayfasına Dön
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#cea14a] transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#cea14a]/10 focus:border-[#cea14a]/50 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
                                    placeholder="kullanici_adi"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">E-Posta</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#cea14a] transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#cea14a]/10 focus:border-[#cea14a]/50 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
                                    placeholder="ornek@ytufinance.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Şifre</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#cea14a] transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#cea14a]/10 focus:border-[#cea14a]/50 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#cea14a] hover:bg-[#b0883b] disabled:opacity-60 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#cea14a]/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group"
                        >
                            <span>{loading ? 'Kaydediliyor...' : 'Kayıt Ol'}</span>
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showForgot, setShowForgot] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Giriş başarısız');
                return;
            }
            localStorage.setItem('currentUser', JSON.stringify(data));
            navigate('/');
        } catch {
            setError('Sunucuya bağlanılamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Abstract Backgrounds */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#cea14a]/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            <div className="max-w-md w-full relative z-10 perspective-1000">
                <div className="glass p-8 sm:p-10 rounded-3xl shadow-2xl shadow-blue-900/5 backdrop-blur-xl border border-white/50 animate-slide-up bg-white/60">

                    {/* Logo Area */}
                    <div className="text-center mb-10">
                        <div className="h-16 w-16 bg-[#cea14a] rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#cea14a]/30 mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                            <span className="text-2xl font-bold text-white tracking-tighter">Y</span>
                        </div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">
                            Tekrar Hoşgeldiniz
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm font-medium">Hesabınıza giriş yapın</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">E-Posta</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#cea14a] transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#cea14a]/10 focus:border-[#cea14a]/50 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
                                    placeholder="ornek@ytufinance.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Şifre</label>
                                <button type="button" onClick={() => setShowForgot(true)} className="text-xs font-semibold text-[#cea14a] hover:text-[#b0883b] transition-colors">
                                    Şifremi Unuttum?
                                </button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#cea14a] transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#cea14a]/10 focus:border-[#cea14a]/50 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#cea14a] hover:bg-[#b0883b] disabled:opacity-60 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#cea14a]/30 hover:shadow-xl hover:shadow-[#cea14a]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
                        >
                            <span>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</span>
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-400 font-medium">
                            Henüz hesabınız yok mu?{' '}
                            <button
                                onClick={() => setShowRegister(true)}
                                className="text-[#cea14a] font-bold hover:underline"
                            >
                                Kayıt Olun
                            </button>
                        </p>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -z-10 top-1/2 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
                <div className="absolute -z-10 bottom-0 -left-12 w-32 h-32 bg-[#cea14a]/10 rounded-full blur-2xl animate-pulse delay-700" />
            </div>

            {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
            {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
        </div>
    );
}
