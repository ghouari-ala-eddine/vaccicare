import { createContext, useContext, useState, useEffect } from 'react';
import fr from '../locales/fr';
import ar from '../locales/ar';

const translations = { fr, ar };

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'fr';
    });

    const [isRTL, setIsRTL] = useState(language === 'ar');

    useEffect(() => {
        // Save to localStorage
        localStorage.setItem('language', language);

        // Set RTL
        const rtl = language === 'ar';
        setIsRTL(rtl);

        // Update document direction and lang
        document.documentElement.dir = rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = language;

        // Add/remove RTL class on body
        if (rtl) {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }
    }, [language]);

    const t = (key) => {
        // Support nested keys like 'auth.login'
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to French
                value = translations['fr'];
                for (const fk of keys) {
                    if (value && typeof value === 'object' && fk in value) {
                        value = value[fk];
                    } else {
                        return key; // Return key if not found
                    }
                }
                break;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    const switchLanguage = (lang) => {
        if (lang in translations) {
            setLanguage(lang);
        }
    };

    const value = {
        language,
        isRTL,
        t,
        switchLanguage,
        languages: [
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'ar', name: 'العربية', flag: '🇸🇦' }
        ]
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export default LanguageContext;
