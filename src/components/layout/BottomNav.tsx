import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ArrowUpDown,
    CreditCard,
    Settings
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function BottomNav() {
    const { t } = useSettings();

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
        { path: '/transactions', icon: ArrowUpDown, label: t('nav.transactions') },
        { path: '/accounts', icon: CreditCard, label: t('nav.accounts') },
        { path: '/settings', icon: Settings, label: t('nav.settings') },
    ];

    return (
        <nav className="bottom-nav lg:hidden">
            <div className="bottom-nav-container">
                {navItems.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`
                        }
                    >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
