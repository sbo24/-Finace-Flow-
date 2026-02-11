// ===========================================
// Componente de Logros y Badges
// Muestra los badges y el progreso del usuario
// ===========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    getAllBadgesWithProgress,
    getUserLevel,
    getActiveChallenges,
    checkAndUnlockBadges,
    type Badge,
    type Challenge,
    type UserLevel
} from '../services/gamificationService';
import { Award, Trophy, Zap, Target, Lock, ChevronRight } from 'lucide-react';

export default function AchievementsPanel() {
    const { currentUser } = useAuth();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [level, setLevel] = useState<UserLevel | null>(null);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadData();
        }
    }, [currentUser]);

    const loadData = () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            // Verificar badges nuevos
            checkAndUnlockBadges(currentUser.id);

            // Cargar datos
            const allBadges = getAllBadgesWithProgress(currentUser.id);
            const userLevel = getUserLevel(currentUser.id);
            const activeChallenges = getActiveChallenges(currentUser.id);

            setBadges(allBadges);
            setLevel(userLevel);
            setChallenges(activeChallenges);
        } finally {
            setLoading(false);
        }
    };

    const unlockedBadges = badges.filter(b => b.unlockedAt);
    const lockedBadges = badges.filter(b => !b.unlockedAt);

    if (loading) {
        return (
            <div className="glass-card p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Nivel del usuario */}
            {level && (
                <div className="glass-card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-3xl">
                            {level.icon}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-[var(--text-primary)]">
                                    Nivel {level.level}
                                </span>
                                <span className="text-lg text-[var(--text-secondary)]">
                                    {level.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Zap className="w-4 h-4 text-[var(--warning)]" />
                                <span className="text-sm text-[var(--text-secondary)]">
                                    {level.xp} XP
                                </span>
                                {level.xpToNext > 0 && (
                                    <span className="text-sm text-[var(--text-muted)]">
                                        • {level.xpToNext} XP para el siguiente nivel
                                    </span>
                                )}
                            </div>
                            {/* Barra de progreso */}
                            {level.xpToNext > 0 && (
                                <div className="mt-3">
                                    <div className="progress-bar h-2">
                                        <div
                                            className="progress-fill-success h-full"
                                            style={{
                                                width: `${Math.min(100, ((level.xp - (level.xp - level.xpToNext)) / level.xpToNext) * 100)}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Retos activos */}
            {challenges.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-[var(--primary)]" />
                        Retos Activos
                    </h3>
                    <div className="space-y-4">
                        {challenges.map(challenge => (
                            <div
                                key={challenge.id}
                                className={`p-4 rounded-lg border ${challenge.completed
                                        ? 'border-[var(--success)] bg-[var(--success)]/10'
                                        : 'border-[var(--border)]'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{challenge.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-[var(--text-primary)]">
                                                {challenge.name}
                                            </h4>
                                            {challenge.completed && (
                                                <span className="badge badge-success">✓ Completado</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                                            {challenge.description}
                                        </p>
                                        {!challenge.completed && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-[var(--text-muted)]">Progreso</span>
                                                    <span className="text-[var(--text-primary)]">
                                                        {challenge.current}{challenge.unit} / {challenge.goal}{challenge.unit}
                                                    </span>
                                                </div>
                                                <div className="progress-bar h-2">
                                                    <div
                                                        className="progress-fill-success h-full"
                                                        style={{
                                                            width: `${Math.min(100, (challenge.current / challenge.goal) * 100)}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Badges desbloqueados */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-[var(--warning)]" />
                    Badges Desbloqueados ({unlockedBadges.length}/{badges.length})
                </h3>

                {unlockedBadges.length === 0 ? (
                    <div className="text-center py-6">
                        <Award className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
                        <p className="text-[var(--text-secondary)]">
                            Aún no tienes badges. ¡Sigue usando la app!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {unlockedBadges.map(badge => (
                            <div
                                key={badge.id}
                                className="text-center group cursor-pointer"
                                title={badge.description}
                            >
                                <div
                                    className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl mb-2 transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: `${badge.color}20`, border: `2px solid ${badge.color}` }}
                                >
                                    {badge.icon}
                                </div>
                                <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                                    {badge.name}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Badges bloqueados */}
            {lockedBadges.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                        <Lock className="w-5 h-5 text-[var(--text-muted)]" />
                        Por Desbloquear
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {lockedBadges.slice(0, 6).map(badge => (
                            <div
                                key={badge.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)]/50"
                            >
                                <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-lg opacity-50">
                                    {badge.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                        {badge.name}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)] truncate">
                                        {badge.description}
                                    </p>
                                    {badge.progress !== undefined && badge.progress > 0 && (
                                        <div className="mt-1">
                                            <div className="progress-bar h-1">
                                                <div
                                                    className="progress-fill-warning h-full"
                                                    style={{ width: `${badge.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
