import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAuthenticated, isParent, isDoctor, isAdmin } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMobileMenuOpen(false);
    };

    const closeMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand" onClick={closeMenu}>
                    <span className="navbar-logo">💉</span>
                    <span className="navbar-title">{t('appName')}</span>
                </Link>

                {isAuthenticated && (
                    <>
                        {/* Mobile Menu Toggle */}
                        <button
                            className="mobile-menu-toggle"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                        </button>

                        {/* Desktop Menu */}
                        <div className="navbar-menu desktop-only">
                            <Link to="/dashboard" className="navbar-link">
                                📊 {t('nav.dashboard')}
                            </Link>

                            {isParent && (
                                <>
                                    <Link to="/children" className="navbar-link">
                                        👶 {t('nav.children')}
                                    </Link>
                                    <Link to="/appointments" className="navbar-link">
                                        📅 {t('nav.appointments')}
                                    </Link>
                                    <Link to="/chat" className="navbar-link">
                                        💬 {t('nav.chat')}
                                    </Link>
                                </>
                            )}

                            {isDoctor && (
                                <>
                                    <Link to="/patients" className="navbar-link">
                                        👶 {t('nav.patients')}
                                    </Link>
                                    <Link to="/schedule" className="navbar-link">
                                        🗓️ {t('nav.schedule')}
                                    </Link>
                                    <Link to="/appointments" className="navbar-link">
                                        📅 {t('nav.appointments')}
                                    </Link>
                                    <Link to="/chat" className="navbar-link">
                                        💬 {t('nav.chat')}
                                    </Link>
                                </>
                            )}

                            {isAdmin && (
                                <>
                                    <Link to="/admin/users" className="navbar-link">
                                        👥 {t('nav.users')}
                                    </Link>
                                    <Link to="/admin/announcements" className="navbar-link">
                                        📢 {t('nav.announcements')}
                                    </Link>
                                    <Link to="/patients" className="navbar-link">
                                        👶 {t('nav.patients')}
                                    </Link>
                                </>
                            )}

                            <Link to="/notifications" className="navbar-link">
                                🔔 {t('nav.notifications')}
                            </Link>
                        </div>

                        {/* Desktop User Section */}
                        <div className="navbar-user desktop-only">
                            <LanguageSwitcher />
                            <div className="user-info">
                                <span className="user-name">{user?.name}</span>
                                <span className="user-role badge badge-primary">
                                    {user?.role === 'parent' ? t('auth.parent') :
                                        user?.role === 'doctor' ? t('auth.doctor') : t('auth.admin')}
                                </span>
                            </div>
                            <Link to="/profile" className="btn btn-secondary btn-sm">
                                👤 {t('nav.profile')}
                            </Link>
                            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                                {t('nav.logout')}
                            </button>
                        </div>

                        {/* Mobile Menu Overlay */}
                        {isMobileMenuOpen && (
                            <div className="mobile-menu-overlay" onClick={closeMenu}></div>
                        )}

                        {/* Mobile Menu */}
                        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                            <div className="mobile-menu-header">
                                <div className="mobile-user-info">
                                    <span className="user-avatar">👤</span>
                                    <div>
                                        <span className="user-name">{user?.name}</span>
                                        <span className="user-role badge badge-primary">
                                            {user?.role === 'parent' ? t('auth.parent') :
                                                user?.role === 'doctor' ? t('auth.doctor') : t('auth.admin')}
                                        </span>
                                    </div>
                                </div>
                                <LanguageSwitcher />
                            </div>

                            <div className="mobile-menu-links">
                                <Link to="/dashboard" className="mobile-link" onClick={closeMenu}>
                                    📊 {t('nav.dashboard')}
                                </Link>

                                {isParent && (
                                    <>
                                        <Link to="/children" className="mobile-link" onClick={closeMenu}>
                                            👶 {t('nav.children')}
                                        </Link>
                                        <Link to="/appointments" className="mobile-link" onClick={closeMenu}>
                                            📅 {t('nav.appointments')}
                                        </Link>
                                        <Link to="/chat" className="mobile-link" onClick={closeMenu}>
                                            💬 {t('nav.chat')}
                                        </Link>
                                    </>
                                )}

                                {isDoctor && (
                                    <>
                                        <Link to="/patients" className="mobile-link" onClick={closeMenu}>
                                            👶 {t('nav.patients')}
                                        </Link>
                                        <Link to="/schedule" className="mobile-link" onClick={closeMenu}>
                                            🗓️ {t('nav.schedule')}
                                        </Link>
                                        <Link to="/appointments" className="mobile-link" onClick={closeMenu}>
                                            📅 {t('nav.appointments')}
                                        </Link>
                                        <Link to="/chat" className="mobile-link" onClick={closeMenu}>
                                            💬 {t('nav.chat')}
                                        </Link>
                                    </>
                                )}

                                {isAdmin && (
                                    <>
                                        <Link to="/admin/users" className="mobile-link" onClick={closeMenu}>
                                            👥 {t('nav.users')}
                                        </Link>
                                        <Link to="/admin/announcements" className="mobile-link" onClick={closeMenu}>
                                            📢 {t('nav.announcements')}
                                        </Link>
                                        <Link to="/patients" className="mobile-link" onClick={closeMenu}>
                                            👶 {t('nav.patients')}
                                        </Link>
                                    </>
                                )}

                                <Link to="/notifications" className="mobile-link" onClick={closeMenu}>
                                    🔔 {t('nav.notifications')}
                                </Link>

                                <Link to="/profile" className="mobile-link" onClick={closeMenu}>
                                    👤 {t('nav.profile')}
                                </Link>

                                <button onClick={handleLogout} className="mobile-link logout-btn">
                                    🚪 {t('nav.logout')}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {!isAuthenticated && (
                    <div className="navbar-auth">
                        <LanguageSwitcher />
                        <Link to="/login" className="btn btn-secondary btn-sm">
                            {t('auth.login')}
                        </Link>
                        <Link to="/register" className="btn btn-primary btn-sm">
                            {t('auth.register')}
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
