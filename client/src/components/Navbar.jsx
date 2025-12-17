import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAuthenticated, isParent, isDoctor, isAdmin } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <span className="navbar-logo">💉</span>
                    <span className="navbar-title">{t('appName')}</span>
                </Link>

                {isAuthenticated && (
                    <>
                        <div className="navbar-menu">
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

                        <div className="navbar-user">
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
