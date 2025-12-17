import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './InstallPrompt.css';

const InstallPrompt = () => {
    const { t } = useLanguage();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed recently
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const daysSinceDismissed = (new Date() - dismissedDate) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return;
            }
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for app installed
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
    };

    if (isInstalled || !showPrompt) {
        return null;
    }

    return (
        <div className="install-prompt">
            <div className="install-prompt-content">
                <span className="install-icon">📱</span>
                <div className="install-text">
                    <strong>{t('pwa.installTitle')}</strong>
                    <p>{t('pwa.installMessage')}</p>
                </div>
                <div className="install-actions">
                    <button className="btn btn-secondary btn-sm" onClick={handleDismiss}>
                        {t('pwa.later')}
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleInstall}>
                        {t('pwa.install')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
