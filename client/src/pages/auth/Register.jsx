import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { authAPI } from '../../services/api';
import Footer from '../../components/Footer';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'parent',
        specialty: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError(t('messages.passwordMismatch') || 'Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError(t('messages.passwordTooShort') || 'Le mot de passe doit contenir au moins 6 caractères');
            setLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...registerData } = formData;
            const data = await authAPI.register(registerData);
            login(data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container register-container">
                <div className="auth-header">
                    <div className="auth-logo">💉</div>
                    <h1>{t('auth.createAccount')}</h1>
                    <p>{t('auth.welcomeSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="alert alert-danger">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">{t('auth.role')}</label>
                        <div className="role-selector">
                            <button
                                type="button"
                                className={`role-btn ${formData.role === 'parent' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, role: 'parent' })}
                            >
                                👨‍👩‍👧 {t('auth.parent')}
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${formData.role === 'doctor' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, role: 'doctor' })}
                            >
                                👨‍⚕️ {t('auth.doctor')}
                            </button>
                            {/* Admin registration is blocked - only parent and doctor can register publicly */}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('auth.name')}</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            placeholder={t('auth.name')}
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('auth.email')}</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="votre@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
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
                    </div>

                    {formData.role === 'doctor' && (
                        <div className="form-group">
                            <label className="form-label">{t('profile.specialty') || 'Spécialité'}</label>
                            <input
                                type="text"
                                name="specialty"
                                className="form-input"
                                placeholder="Ex: Pédiatrie"
                                value={formData.specialty}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('auth.password')}</label>
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('auth.confirmPassword')}</label>
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
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: '20px', height: '20px' }}></span>
                                {t('loading')}
                            </>
                        ) : (
                            t('auth.registerButton')
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {t('auth.hasAccount')}{' '}
                        <Link to="/login" className="auth-link">
                            {t('auth.loginButton')}
                        </Link>
                    </p>
                </div>
            </div>

            <div className="auth-decoration">
                <div className="decoration-content">
                    <h2>{t('auth.welcomeBack')}</h2>
                    <p>{t('auth.welcomeSubtitle')}</p>
                    <div className="stats-preview">
                        <div className="stat-item">
                            <span className="stat-value">🏥</span>
                            <span className="stat-label">{t('dashboard.overview')}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">💉</span>
                            <span className="stat-label">{t('vaccinations.title')}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">👶</span>
                            <span className="stat-label">{t('children.title')}</span>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Register;
