import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ArrowUpDown,
    PiggyBank,
    Target,
    BarChart3,
    Brain,
    BookOpen,
    Settings,
    LogOut,
    CreditCard,
    Calendar
} from 'lucide-react';
import logo from '../../assets/logo.jpg';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { currentUser, logout } = useAuth();
    const { t, settings } = useSettings();
    const navigate = useNavigate();

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
        { path: '/accounts', icon: CreditCard, label: t('nav.accounts') },
        { path: '/transactions', icon: ArrowUpDown, label: t('nav.transactions') },
        { path: '/subscriptions', icon: Calendar, label: t('nav.subscriptions') },
        { path: '/fixed-expenses', icon: Calendar, label: t('nav.fixed_expenses') },
        { path: '/budgets', icon: PiggyBank, label: t('nav.budgets') },
        { path: '/savings', icon: Target, label: t('nav.savings') },
        { path: '/reports', icon: BarChart3, label: t('nav.reports') },
        { path: '/insights', icon: Brain, label: t('nav.insights') },
        { path: '/academy', icon: BookOpen, label: t('nav.academy') },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
        if (onClose) onClose();
    };

    const handleNavClick = () => {
        if (onClose) onClose();
    };

    return (
        <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
            {/* Logo Header */}
            <div className="sidebar-header">
                <div className="logo-container">
                    <img src={logo} alt="FinanceFlow Logo" className="w-10 h-10 rounded-xl shadow-glow" />
                    <div className="logo-text">
                        <span className="logo-title">{t('app.name')}</span>
                        <span className="logo-subtitle">{t('app.tagline')}</span>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section-label">
                    {t('nav.main_menu')}
                </div>
                {navItems.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'nav-item-active' : ''}`
                        }
                    >
                        <Icon className="nav-icon" />
                        <span className="nav-label">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer with Settings & User */}
            <div className="sidebar-footer">
                <NavLink
                    to="/settings"
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                        `nav-item ${isActive ? 'nav-item-active' : ''}`
                    }
                >
                    <Settings className="nav-icon" />
                    <span className="nav-label">{t('nav.settings')}</span>
                </NavLink>

                {/* User Profile Card */}
                <div className="user-card">
                    <div className="user-avatar" title={currentUser?.email || ''}>
                        {currentUser?.displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                        <p className="user-name">
                            {currentUser?.displayName || (settings.language === 'es' ? 'Usuario' : settings.language === 'fr' ? 'Utilisateur' : 'User')}
                        </p>
                        <p className="user-email">
                            {currentUser?.email}
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut className="nav-icon" />
                    <span>{t('nav.logout')}</span>
                </button>
            </div>
        </aside>
    );
}
