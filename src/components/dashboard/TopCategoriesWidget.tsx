interface TopCategoriesWidgetProps {
    t: (key: any) => any;
    formatCurrency: (amount: number) => string;
    totalExpenses: number;
    topCategories: { name: string; amount: number; color: string; icon: string }[];
}

export default function TopCategoriesWidget({ t, formatCurrency, totalExpenses, topCategories }: TopCategoriesWidgetProps) {
    return (
        <div className="glass-card p-4 md:p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">{t('reports.category_breakdown')}</h3>
            </div>
            <div className="space-y-4">
                {topCategories.length > 0 ? topCategories.map(cat => (
                    <div key={cat.name} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${cat.color}20` }}>
                            {cat.icon}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="font-medium">{cat.name}</p>
                                <p className="text-sm text-[var(--text-muted)]">{formatCurrency(cat.amount)}</p>
                            </div>
                            <div className="progress-bar mt-2">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${Math.min(100, (cat.amount / Math.max(1, totalExpenses)) * 100)}%`, background: cat.color }}
                                />
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8 text-[var(--text-muted)]">{t('reports.no_data_category')}</div>
                )}
            </div>
        </div>
    );
}
