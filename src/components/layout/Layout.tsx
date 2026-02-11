import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import QuickAdd from '../QuickAdd';
import ToastContainer from '../ToastContainer';
import { useSettings } from '../../contexts/SettingsContext';
import logo from '../../assets/logo.jpg';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { t } = useSettings();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="layout-container">
            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="mobile-logo">
                    <img src={logo} alt="FinanceFlow Logo" className="w-8 h-8 rounded-lg" />
                    <span className="mobile-logo-title">{t('app.name')}</span>
                </div>
                <button
                    className="menu-toggle"
                    onClick={toggleSidebar}
                    aria-label="Toggle menu"
                >
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Sidebar Overlay (Backdrop) */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            {/* Main content area */}
            <main className="main-content">
                <div className="content-wrapper">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation on Mobile */}
            <BottomNav />

            {/* Floating quick add button - Always visible now as requested */}
            <div>
                <QuickAdd />
            </div>

            {/* Toast notifications */}
            <ToastContainer />
        </div>
    );
}

