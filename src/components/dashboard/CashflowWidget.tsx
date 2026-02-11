import { Activity } from 'lucide-react';
import { ComposedChart, Area, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface CashflowWidgetProps {
    t: (key: any) => any;
    formatCurrency: (amount: number) => string;
    cashflowData: { name: string; balance: number; income: number; expenses: number }[];
}

export default function CashflowWidget({ t, formatCurrency, cashflowData }: CashflowWidgetProps) {
    return (
        <div className="glass-card p-4 sm:p-6 md:p-8 h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[var(--primary)]" />
                    {t('dashboard.cashflow_title')}
                </h3>
                <select className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[var(--primary)] text-[var(--text-secondary)] w-full sm:w-auto">
                    <option>{t('dashboard.period_this_month')}</option>
                    <option>{t('dashboard.period_last_3')}</option>
                    <option>{t('dashboard.period_ytd')}</option>
                </select>
            </div>
            <div className="h-[250px] md:h-[300px] w-full" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={cashflowData}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="var(--text-muted)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => formatCurrency(value)}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="var(--text-muted)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                            formatter={(value: any, name: any) => {
                                const label = name === 'balance' ? t('dashboard.balance') : name === 'income' ? t('dashboard.income') : t('dashboard.expenses');
                                return [formatCurrency(Number(value) || 0), label];
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="balance"
                            name="balance"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                        />
                        <Bar
                            yAxisId="right"
                            dataKey="income"
                            name="income"
                            fill="var(--success)"
                            radius={[4, 4, 0, 0]}
                            opacity={0.8}
                        />
                        <Bar
                            yAxisId="right"
                            dataKey="expenses"
                            name="expenses"
                            fill="var(--danger)"
                            radius={[4, 4, 0, 0]}
                            opacity={0.8}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
