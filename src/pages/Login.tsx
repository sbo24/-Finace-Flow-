import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export default function Login() {
    const { t } = useSettings();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : t('auth.login_error');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setLoading(true);
        setError('');
        try {
            try {
                await register('demo@financeflow.com', 'demo123', 'Usuario Demo');
            } catch {
                // User already exists
            }
            await login('demo@financeflow.com', 'demo123');
            navigate('/dashboard');
        } catch (err) {
            setError(t('auth.demo_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 md:p-8 relative overflow-hidden bg-[var(--bg-primary)]">
            {/* Background System - Subtle & Spacious */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 text-center">
                <div className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vw] bg-[var(--primary)] opacity-[0.02] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-[var(--secondary)] opacity-[0.02] rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-7xl flex flex-col md:flex-row gap-0 overflow-hidden relative z-10 animate-enter rounded-3xl md:rounded-[2.5rem] border border-white/10 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.5)] bg-[var(--bg-secondary)]/40 backdrop-blur-xl">

                {/* Left Side - Information (Hidden on small screens, centered on large) */}
                <div className="hidden md:flex flex-1 p-12 lg:p-20 flex-col justify-center items-center text-center relative border-r border-white/5">
                    <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                        <div className="flex items-center gap-4 mb-12">
                            <img src={logo} alt="FinanceFlow Logo" className="w-12 h-12 rounded-xl shadow-glow" />
                            <span className="text-xl font-bold tracking-tight italic text-white/90">FinanceFlow</span>
                        </div>

                        <div className="mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-6 text-white tracking-tight">
                                Gestione su patrimonio con rigor profesional.
                            </h2>
                            <p className="text-[var(--text-secondary)] text-lg leading-relaxed opacity-50 font-light mx-auto">
                                Una arquitectura diseñada para ofrecer claridad absoluta sobre su liquidez, inversiones y objetivos a largo plazo.
                            </p>
                        </div>

                        <div className="space-y-6 w-full">
                            <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="w-6 h-6 text-[var(--primary)]" />
                                </div>
                                <div className="text-center">
                                    <h4 className="font-semibold text-white tracking-wide mb-1">{t('settings.data')}</h4>
                                    <p className="text-sm text-[var(--text-muted)] opacity-60">Almacenamiento local privado.</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-[var(--secondary)]/10 flex items-center justify-center border border-[var(--secondary)]/20 group-hover:scale-110 transition-transform">
                                    <Zap className="w-6 h-6 text-[var(--secondary)]" />
                                </div>
                                <div className="text-center">
                                    <h4 className="font-semibold text-white tracking-wide mb-1">{t('reports.insights')}</h4>
                                    <p className="text-sm text-[var(--text-muted)] opacity-60">Análisis predictivo de datos.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form (Mobile Optimized) */}
                <div className="flex-1 p-6 sm:p-10 md:p-16 lg:p-24 bg-[var(--bg-card)]/40 flex flex-col justify-center items-center">
                    <div className="max-w-md mx-auto w-full flex flex-col items-center">
                        {/* Mobile Logo */}
                        <div className="mb-8 md:hidden">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] rounded-2xl flex items-center justify-center shadow-glow">
                                    <span className="text-2xl">🧩</span>
                                </div>
                                <span className="text-2xl font-bold tracking-tight italic text-white">FinanceFlow</span>
                            </div>
                        </div>

                        <div className="text-center mb-10 md:mb-12">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-white tracking-tight">{t('auth.welcome')}</h1>
                            <p className="text-[var(--text-secondary)] text-base sm:text-lg font-light opacity-50">{t('auth.tagline')}</p>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-100/80 text-sm w-full text-center">
                                <p className="font-medium">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 w-full">
                            <div className="space-y-2 md:space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] text-center block">
                                    {t('auth.email')}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--icon-muted)]" />
                                    <input
                                        type="email"
                                        className="w-full bg-white/[0.03] border border-white/10 !pl-14 py-4 md:py-4.5 text-white text-center focus:border-[var(--primary)]/50 focus:bg-white/[0.06] transition-all rounded-2xl tracking-wide placeholder:text-white/20 outline-none"
                                        placeholder="usuario@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] text-center block">
                                    {t('auth.password')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--icon-muted)]" />
                                    <input
                                        type="password"
                                        className="w-full bg-white/[0.03] border border-white/10 !pl-14 py-4 md:py-4.5 text-white text-center focus:border-[var(--primary)]/50 focus:bg-white/[0.06] transition-all rounded-2xl tracking-[0.3em] placeholder:tracking-normal placeholder:text-white/20 outline-none"
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4.5 md:py-5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-lg font-bold shadow-xl shadow-primary/10 transition-all flex items-center justify-center gap-3 rounded-2xl mt-4 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <span>{t('auth.login')}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="relative my-10 md:my-12 w-full">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">
                                <span className="px-6 bg-[#0a0f1c]/0">O ACCEDER CON</span>
                            </div>
                        </div>

                        <button
                            onClick={handleDemoLogin}
                            disabled={loading}
                            className="w-full py-4 md:py-4.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white font-semibold flex items-center justify-center gap-3 transition-all rounded-2xl"
                        >
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span>{t('auth.demo_access')}</span>
                        </button>

                        <p className="text-center mt-10 md:mt-12 text-white/50 text-base font-light">
                            {t('auth.no_account')}{' '}
                            <Link to="/register" className="text-[var(--primary)] hover:underline font-bold transition-all ml-1">
                                {t('auth.register')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
