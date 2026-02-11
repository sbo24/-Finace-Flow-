import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export default function Register() {
    const { t } = useSettings();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError(t('auth.password_mismatch'));
            return;
        }

        if (password.length < 6) {
            setError(t('auth.password_too_short'));
            return;
        }

        setLoading(true);

        try {
            await register(email, password, displayName);
            navigate('/dashboard');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : t('auth.register_error');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 md:p-8 relative overflow-hidden bg-[var(--bg-primary)]">
            {/* Background System - Subtle & Spacious */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-[var(--secondary)] opacity-[0.02] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[60vw] h-[60vw] bg-[var(--primary)] opacity-[0.02] rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-7xl flex flex-col md:flex-row-reverse gap-0 overflow-hidden relative z-10 animate-enter rounded-3xl md:rounded-[2.5rem] border border-white/10 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.5)] bg-[var(--bg-secondary)]/40 backdrop-blur-xl">

                {/* Information Side (Centered & Airy) */}
                <div className="hidden md:flex flex-1 p-12 lg:p-20 flex-col justify-center items-center text-center relative border-l border-white/5">
                    <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                        <div className="flex items-center gap-4 mb-16">
                            <div className="w-10 h-10 bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] rounded-xl flex items-center justify-center shadow-glow">
                                <span className="text-xl">🧩</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight italic text-white/90">FinanceFlow</span>
                        </div>

                        <div className="mb-12">
                            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-6 text-white tracking-tight">
                                Empiece hoy su libertad financiera.
                            </h2>
                            <p className="text-[var(--text-secondary)] text-lg leading-relaxed opacity-50 font-light mx-auto">
                                Únase a una red de usuarios que gestionan sus recursos con previsión analítica y rigor profesional.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 w-full">
                            {[
                                'Presupuestos Inteligentes',
                                'Metas de Ahorro Visuales',
                                'Reportes Dinámicos'
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 flex items-center justify-center border border-[var(--success)]/20 group-hover:scale-110 transition-transform">
                                        <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                                    </div>
                                    <span className="text-[var(--text-secondary)] font-medium text-sm tracking-wide text-center">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Form Side (Mobile Optimized) */}
                <div className="flex-1 p-6 sm:p-10 md:p-16 lg:p-24 bg-[var(--bg-card)]/40 flex flex-col justify-center items-center">
                    <div className="max-w-md mx-auto w-full flex flex-col items-center">
                        {/* Mobile Logo */}
                        <div className="mb-8 md:hidden text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] rounded-2xl flex items-center justify-center shadow-glow">
                                    <span className="text-2xl">🧩</span>
                                </div>
                                <span className="text-2xl font-bold tracking-tight italic text-white">FinanceFlow</span>
                            </div>
                        </div>

                        <div className="text-center mb-10">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-white tracking-tight">{t('auth.register')}</h1>
                            <p className="text-[var(--text-secondary)] text-base sm:text-lg font-light opacity-50">{t('auth.register_tagline')}</p>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-100/80 text-sm w-full text-center">
                                <p className="font-medium leading-relaxed">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 w-full">
                            <div className="space-y-2 md:space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] text-center block">{t('auth.name')}</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--icon-muted)]" />
                                    <input
                                        type="text"
                                        className="w-full bg-white/[0.03] border border-white/10 !pl-14 py-4 md:py-4.5 text-white text-center focus:border-[var(--primary)]/50 focus:bg-white/[0.06] transition-all rounded-2xl tracking-wide placeholder:text-white/20 outline-none"
                                        placeholder={t('auth.your_name')}
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] text-center block">{t('auth.email')}</label>
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

                            <div className="grid grid-cols-1 gap-5 md:gap-6">
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] text-center block">{t('auth.password')}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--icon-muted)]" />
                                        <input
                                            type="password"
                                            className="w-full bg-white/[0.03] border border-white/10 !pl-14 py-4 md:py-4.5 text-white text-center focus:border-[var(--primary)]/50 focus:bg-white/[0.06] transition-all rounded-2xl tracking-[0.3em] placeholder:tracking-normal placeholder:text-white/20 outline-none"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] text-center block">{t('auth.confirm_password')}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--icon-muted)]" />
                                        <input
                                            type="password"
                                            className="w-full bg-white/[0.03] border border-white/10 !pl-14 py-4 md:py-4.5 text-white text-center focus:border-[var(--primary)]/50 focus:bg-white/[0.06] transition-all rounded-2xl tracking-[0.3em] placeholder:tracking-normal placeholder:text-white/20 outline-none"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4.5 md:py-5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-lg font-bold shadow-xl shadow-primary/10 transition-all flex items-center justify-center gap-3 rounded-2xl mt-6 md:mt-8 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <span>{t('auth.register')}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center mt-10 md:mt-12 text-white/50 text-base font-light">
                            {t('auth.has_account')}{' '}
                            <Link to="/login" className="text-[var(--primary)] hover:underline font-bold transition-all ml-1">
                                {t('auth.login')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
