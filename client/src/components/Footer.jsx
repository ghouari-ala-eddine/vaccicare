import { useLanguage } from '../contexts/LanguageContext';
import './Footer.css';

const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer className="app-footer">
            <div className="footer-glow"></div>
            <div className="footer-content">
                <div className="footer-brand">
                    <span className="footer-logo">💉</span>
                    <span className="footer-app-name">VacciCare</span>
                </div>
                <p className="footer-slogan">« Protégez-vous par la vaccination »</p>
                <div className="footer-divider"></div>
                <p className="footer-copyright">
                    © 2025 <span className="author-name">Ghouari Ala Eddine</span>. All Rights Reserved.
                </p>
                <div className="footer-decoration">
                    <span className="decoration-dot"></span>
                    <span className="decoration-dot"></span>
                    <span className="decoration-dot"></span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
