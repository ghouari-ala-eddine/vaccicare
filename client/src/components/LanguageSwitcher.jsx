import { useLanguage } from '../contexts/LanguageContext';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { language, switchLanguage, languages } = useLanguage();

    return (
        <div className="language-switcher">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    className={`lang-btn ${language === lang.code ? 'active' : ''}`}
                    onClick={() => switchLanguage(lang.code)}
                    title={lang.name}
                >
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-code">{lang.code.toUpperCase()}</span>
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
