import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { childrenAPI } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import './Children.css';

const ChildrenList = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const { t, language } = useLanguage();

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            const data = await childrenAPI.getAll();
            setChildren(data);
        } catch (error) {
            console.error('Error fetching children:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (childId, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (deleteConfirm === childId) {
            try {
                await childrenAPI.delete(childId);
                setChildren(children.filter(c => c._id !== childId));
                setDeleteConfirm(null);
            } catch (error) {
                console.error('Error deleting child:', error);
                alert(t('messages.error'));
            }
        } else {
            setDeleteConfirm(childId);
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    const calculateAge = (birthDate) => {
        const birth = new Date(birthDate);
        const today = new Date();
        const months = (today.getFullYear() - birth.getFullYear()) * 12 +
            (today.getMonth() - birth.getMonth());

        if (months < 12) {
            return `${months} ${t('children.months')}`;
        }
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return remainingMonths > 0
            ? `${years} ${t('children.years')} ${remainingMonths} ${t('children.months')}`
            : `${years} ${t('children.years')}`;
    };

    const formatDate = (date) => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(date).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p>{t('loading')}</p>
            </div>
        );
    }

    return (
        <div className="children-page container">
            <div className="page-header">
                <div>
                    <h1>👶 {t('children.title')}</h1>
                    <p className="text-muted">{t('profile.subtitle')}</p>
                </div>
                <Link to="/children/add" className="btn btn-primary">
                    + {t('children.addChild')}
                </Link>
            </div>

            {children.length === 0 ? (
                <div className="empty-state-large">
                    <span className="empty-icon">👶</span>
                    <h2>{t('children.noChildren')}</h2>
                    <p>{t('dashboard.addFirstChild')}</p>
                    <Link to="/children/add" className="btn btn-primary btn-lg">
                        + {t('children.addChild')}
                    </Link>
                </div>
            ) : (
                <div className="children-grid">
                    {children.map(child => (
                        <div key={child._id} className="child-card-large">
                            <Link to={`/children/${child._id}`} className="child-card-link">
                                <div className="child-header">
                                    <div className="child-avatar-large">
                                        {child.gender === 'male' ? '👦' : '👧'}
                                    </div>
                                    <span className="badge badge-success">{t('patients.upToDate')}</span>
                                </div>
                                <div className="child-body">
                                    <h3>{child.name}</h3>
                                    <div className="child-meta">
                                        <p>
                                            <span className="meta-icon">🎂</span>
                                            {formatDate(child.birthDate)}
                                        </p>
                                        <p>
                                            <span className="meta-icon">📅</span>
                                            {calculateAge(child.birthDate)}
                                        </p>
                                        {child.bloodType && (
                                            <p>
                                                <span className="meta-icon">🩸</span>
                                                {t('children.bloodType')} {child.bloodType}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                            <div className="child-footer">
                                <Link to={`/children/${child._id}`} className="view-link">
                                    {t('details')} →
                                </Link>
                                <button
                                    className={`btn-delete ${deleteConfirm === child._id ? 'confirm' : ''}`}
                                    onClick={(e) => handleDelete(child._id, e)}
                                    title={t('delete')}
                                >
                                    {deleteConfirm === child._id ? `⚠️ ${t('confirm')}` : '🗑️'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChildrenList;
