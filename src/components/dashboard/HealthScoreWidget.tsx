interface HealthScoreWidgetProps {
    t: (key: any) => any;
    healthScore: number;
}

export default function HealthScoreWidget({ t, healthScore }: HealthScoreWidgetProps) {
    return (
        <div className="glass-card p-4 md:p-6 text-center h-full relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="font-semibold text-[var(--text-muted)] uppercase tracking-wider text-sm mb-6">{t('dashboard.health_title')}</h3>
                <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="var(--bg-tertiary)" strokeWidth="12" fill="none" />
                        <circle cx="80" cy="80" r="70" stroke="var(--primary)" strokeWidth="12" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * healthScore) / 100} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold">{healthScore}</span>
                        <span className="text-xs text-[var(--text-muted)]">{t('dashboard.health_label')}</span>
                    </div>
                </div>
                <p className="text-sm text-[var(--text-muted)] px-4">
                    {t('dashboard.health_desc')}
                </p>
            </div>
        </div>
    );
}
