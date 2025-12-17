import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { authAPI } from '../../services/api';
import './Profile.css';

const ProfilePage = () => {
    const { user, login } = useAuth();
    const { t, language } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setMessage({ type: '', text: '' });
    };

    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const updatedUser = await authAPI.updateProfile({
                name: formData.name,
                phone: formData.phone,
                address: formData.address
            });

            const token = localStorage.getItem('token');
            login({ ...updatedUser, token });

            setMessage({ type: 'success', text: t('profile.profileUpdated') });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: t('messages.passwordMismatch') });
            setLoading(false);
            return;
        }

        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: t('messages.passwordTooShort') });
            setLoading(false);
            return;
        }

        try {
            await authAPI.updateProfile({
                password: formData.newPassword
            });

            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));

            setMessage({ type: 'success', text: t('profile.passwordUpdated') });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const getRoleDisplay = (role) => {
        const roles = {
            parent: { label: t('auth.parent'), icon: '👨‍👩‍👧', color: 'primary' },
            doctor: { label: t('auth.doctor'), icon: '👨‍⚕️', color: 'success' },
            admin: { label: t('auth.admin'), icon: '🔑', color: 'warning' }
        };
        return roles[role] || { label: role, icon: '👤', color: 'gray' };
    };

    const roleDisplay = getRoleDisplay(user?.role);

    // 2FA Toggle Component
    const TwoFactorSection = () => {
        const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFactorEnabled || false);
        const [toggling, setToggling] = useState(false);

        const handleToggle2FA = async () => {
            setToggling(true);
            try {
                const response = await authAPI.toggle2FA();
                setTwoFAEnabled(response.twoFactorEnabled);
                setMessage({
                    type: 'success',
                    text: response.message
                });
                const token = localStorage.getItem('token');
                login({ ...user, twoFactorEnabled: response.twoFactorEnabled, token });
            } catch (error) {
                setMessage({ type: 'error', text: error.message });
            } finally {
                setToggling(false);
            }
        };

        return (
            <div className="card profile-form twofa-section">
                <h3>🔐 {t('profile.twoFactor')}</h3>
                <p className="text-muted">{t('profile.twoFactorDesc')}</p>

                <div className="twofa-status">
                    <div className={`status-indicator ${twoFAEnabled ? 'enabled' : 'disabled'}`}>
                        {twoFAEnabled ? `✓ ${t('profile.enabled')}` : `✗ ${t('profile.disabled')}`}
                    </div>
                    <button
                        className={`btn ${twoFAEnabled ? 'btn-danger' : 'btn-success'}`}
                        onClick={handleToggle2FA}
                        disabled={toggling}
                    >
                        {toggling
                            ? t('loading')
                            : twoFAEnabled
                                ? `🔓 ${t('profile.disable2FA')}`
                                : `🔒 ${t('profile.enable2FA')}`
                        }
                    </button>
                </div>

                {!twoFAEnabled && (
                    <div className="twofa-info">
                        <p>⚠️ <strong>{t('profile.recommended')}</strong>: {t('profile.recommendedText')}</p>
                    </div>
                )}
            </div>
        );
    };

    const formatMemberDate = () => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(user?.createdAt || Date.now()).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    };

    return (
        <div className="profile-page container">
            <div className="page-header">
                <div>
                    <h1>👤 {t('profile.title')}</h1>
                    <p className="text-muted">{t('profile.subtitle')}</p>
                </div>
            </div>

            <div className="profile-layout">
                {/* Profile Card */}
                <div className="profile-card card">
                    <div className="profile-avatar-section">
                        <div className="avatar-large">{roleDisplay.icon}</div>
                        <h2>{user?.name}</h2>
                        <p className="text-muted">{user?.email}</p>
                        <span className={`badge badge-${roleDisplay.color}`}>
                            {roleDisplay.label}
                        </span>
                    </div>
                    <div className="profile-quick-info">
                        {user?.phone && (
                            <div className="quick-info-item">
                                <span className="info-icon">📞</span>
                                <span>{user.phone}</span>
                            </div>
                        )}
                        {user?.address && (
                            <div className="quick-info-item">
                                <span className="info-icon">📍</span>
                                <span>{user.address}</span>
                            </div>
                        )}
                        <div className="quick-info-item">
                            <span className="info-icon">📅</span>
                            <span>{t('profile.memberSince')} {formatMemberDate()}</span>
                        </div>
                    </div>
                </div>

                {/* Edit Forms */}
                <div className="profile-forms">
                    {/* Tabs */}
                    <div className="profile-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            📝 {t('profile.personalInfo')}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            🔒 {t('profile.security')}
                        </button>
                    </div>

                    {message.text && (
                        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
                            {message.type === 'success' ? '✓' : '⚠️'} {message.text}
                        </div>
                    )}

                    {/* Personal Info Form */}
                    {activeTab === 'info' && (
                        <form onSubmit={handleUpdateInfo} className="card profile-form">
                            <h3>📝 {t('profile.personalInfo')}</h3>

                            <div className="form-group">
                                <label className="form-label">{t('auth.name')}</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('auth.email')}</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={user?.email || ''}
                                    disabled
                                />
                                <small className="text-muted">{t('profile.emailNotEditable')}</small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('auth.phone')}</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    placeholder="0X XX XX XX XX"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('profile.address')}</label>
                                <textarea
                                    name="address"
                                    className="form-input"
                                    rows="2"
                                    placeholder={t('profile.address')}
                                    value={formData.address}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? t('loading') : `💾 ${t('profile.saveChanges')}`}
                            </button>
                        </form>
                    )}

                    {/* Password Form */}
                    {activeTab === 'security' && (
                        <div className="security-section">
                            <form onSubmit={handleUpdatePassword} className="card profile-form">
                                <h3>🔒 {t('profile.changePassword')}</h3>

                                <div className="form-group">
                                    <label className="form-label">{t('profile.newPassword')}</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('profile.confirmPassword')}</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? t('loading') : `🔐 ${t('profile.changePassword')}`}
                                </button>
                            </form>

                            {/* 2FA Section */}
                            <TwoFactorSection />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
