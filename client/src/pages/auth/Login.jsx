import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { authAPI } from '../../services/api';
import Footer from '../../components/Footer';
import './Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
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

        try {
            const data = await authAPI.login(formData);

            // Check if 2FA is required
            if (data.requires2FA) {
                navigate('/verify-2fa', {
                    state: {
                        userId: data.userId,
                        email: data.email
                    }
                });
                return;
            }

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
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">💉</div>
                    <h1>{t('auth.welcomeBack')}</h1>
                    <p>{t('auth.welcomeSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="alert alert-danger">
                            ⚠️ {error}
                        </div>
                    )}

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
                            t('auth.loginButton')
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {t('auth.noAccount')}{' '}
                        <Link to="/register" className="auth-link">
                            {t('auth.createAccount')}
                        </Link>
                    </p>
                </div>
            </div>

            <div className="auth-decoration">
                <div className="decoration-content">
                    <h2>{t('appName')}</h2>
                    <p>{t('auth.welcomeSubtitle')}</p>
                    <ul className="feature-list">
                        <li>✓ {t('dashboard.vaccineProgress')}</li>
                        <li>✓ {t('notifications.title')}</li>
                        <li>✓ {t('appointments.title')}</li>
                        <li>✓ {t('vaccinations.title')}</li>
                    </ul>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Login;
