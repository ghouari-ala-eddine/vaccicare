import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { authAPI } from '../../services/api';
import './Auth.css';

const Verify2FA = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { login: authLogin } = useAuth();
    const { t } = useLanguage();

    const { userId, email } = location.state || {};

    useEffect(() => {
        // Redirect if no userId
        if (!userId) {
            navigate('/login');
            return;
        }
        // Focus first input
        inputRefs.current[0]?.focus();
    }, [userId, navigate]);

    useEffect(() => {
        // Countdown timer
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only digits

        const newCode = [...code];
        newCode[index] = value.slice(-1); // Only last digit
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newCode = [...code];
        for (let i = 0; i < pastedData.length; i++) {
            newCode[i] = pastedData[i];
        }
        setCode(newCode);
        inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError(t('messages.enterCompleteCode') || 'Veuillez entrer le code complet');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.verify2FA(userId, fullCode);
            authLogin(response);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || t('messages.invalidCode') || 'Code incorrect');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await authAPI.resend2FA(userId);
            setCountdown(60); // 60 seconds cooldown
            setError('');
        } catch (err) {
            setError(err.message || t('messages.sendError') || 'Erreur lors de l\'envoi');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <span className="auth-icon">🔐</span>
                    <h1>{t('auth.verificationCode')}</h1>
                    <p className="text-muted">
                        {t('auth.codeSent')}<br />
                        <strong>{email}</strong>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="code-inputs">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleChange(index, e.target.value)}
                                onKeyDown={e => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="code-input"
                                disabled={loading}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading || code.join('').length !== 6}
                    >
                        {loading ? t('loading') : `✓ ${t('auth.verify')}`}
                    </button>
                </form>

                <div className="resend-section">
                    <p className="text-muted">{t('auth.noCodeReceived')}</p>
                    {countdown > 0 ? (
                        <p className="countdown">{t('auth.resendIn')} {countdown}s</p>
                    ) : (
                        <button
                            className="btn btn-link"
                            onClick={handleResend}
                            disabled={resending}
                        >
                            {resending ? t('loading') : `📧 ${t('auth.resendCode')}`}
                        </button>
                    )}
                </div>

                <div className="auth-footer">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate('/login')}
                    >
                        ← {t('back')} {t('auth.login')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Verify2FA;
