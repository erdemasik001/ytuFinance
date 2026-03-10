import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Add your login logic here
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Abstract Backgrounds */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#cea14a]/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            <div className="max-w-md w-full relative z-10 perspective-1000">
                < div className="glass p-8 sm:p-10 rounded-3xl shadow-2xl shadow-blue-900/5 backdrop-blur-xl border border-white/50 animate-slide-up bg-white/60">

                    {/* Logo Area */}
                    <div className="text-center mb-10">
                        <div className="h-16 w-16 bg-[#cea14a] rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#cea14a]/30 mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                            <span className="text-2xl font-bold text-white tracking-tighter">P</span>
                        </div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">
                            Tekrar Hoşgeldiniz
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm font-medium">Hesabınıza giriş yapın</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">E-Posta</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#cea14a] transition-colors" size={20} />
                                <input
                                    type="email"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#cea14a]/10 focus:border-[#cea14a]/50 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
                                    placeholder="ornek@planaks.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Şifre</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#cea14a] transition-colors" size={20} />
                                <input
                                    type="password"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#cea14a]/10 focus:border-[#cea14a]/50 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#cea14a] focus:ring-[#cea14a] transition-colors" />
                                <span className="text-gray-500 font-medium group-hover:text-gray-700 transition-colors">Beni Hatırla</span>
                            </label>
                            <a href="#" className="font-semibold text-[#cea14a] hover:text-[#b0883b] transition-colors">Şifremi Unuttum?</a>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#cea14a] hover:bg-[#b0883b] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#cea14a]/30 hover:shadow-xl hover:shadow-[#cea14a]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
                        >
                            <span>Giriş Yap</span>
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-400 font-medium">
                            Henüz hesabınız yok mu?{' '}
                            <a href="#" className="text-[#cea14a] font-bold hover:underline">
                                Başvuru Yapın
                            </a>
                        </p>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -z-10 top-1/2 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
                <div className="absolute -z-10 bottom-0 -left-12 w-32 h-32 bg-[#cea14a]/10 rounded-full blur-2xl animate-pulse delay-700" />
            </div>
        </div>
    );
}
