import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { childrenAPI, vaccinationsAPI } from '../../services/api';
import './Patients.css';

const PatientsList = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [patients, setPatients] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patientsData, statsData] = await Promise.all([
                    childrenAPI.getAll(),
                    vaccinationsAPI.getStats()
                ]);
                setPatients(patientsData);
                setStats(statsData);
            } catch (error) {
                console.error('Error fetching patients:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const calculateAge = (birthDate) => {
        const birth = new Date(birthDate);
        const today = new Date();
        const months = (today.getFullYear() - birth.getFullYear()) * 12 +
            (today.getMonth() - birth.getMonth());
        if (months < 12) return `${months} ${t('children.months')}`;
        const years = Math.floor(months / 12);
        return `${years} ${t('children.years')}`;
    };

    const formatDate = (date) => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(date).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const filteredPatients = patients.filter(patient => {
        const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.parent?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearch;
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p>{t('loading')}</p>
            </div>
        );
    }

    return (
        <div className="patients-page container">
            <div className="page-header">
                <div>
                    <h1>👶 {t('patients.title')}</h1>
                    <p className="text-muted">{t('patients.subtitle')}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="patients-stats">
                <div className="stat-card primary">
                    <div className="stat-icon">👶</div>
                    <div className="stat-content">
                        <h3>{patients.length}</h3>
                        <p>{t('patients.totalPatients')}</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{stats?.completed || 0}</h3>
                        <p>{t('dashboard.completedVaccinations')}</p>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <h3>{stats?.scheduled || 0}</h3>
                        <p>{t('dashboard.scheduledVaccinations')}</p>
                    </div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <h3>{stats?.delayed || 0}</h3>
                        <p>{t('dashboard.delayed')}</p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="patients-filters card">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="form-input"
                        placeholder={t('patients.searchPatients')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        {t('all')} ({patients.length})
                    </button>
                </div>
            </div>

            {/* Patients Table */}
            {filteredPatients.length === 0 ? (
                <div className="empty-state card">
                    <span className="empty-icon">👶</span>
                    <p>{t('children.noChildren')}</p>
                    {searchTerm && <small>{t('search')}</small>}
                </div>
            ) : (
                <div className="patients-table-container card">
                    <table className="patients-table">
                        <thead>
                            <tr>
                                <th>{t('patients.patient')}</th>
                                <th>{t('children.age')}</th>
                                <th>{t('children.parent')}</th>
                                <th>{t('patients.parentContact')}</th>
                                <th>{t('children.bloodType')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.map(patient => (
                                <tr key={patient._id}>
                                    <td>
                                        <div className="patient-cell">
                                            <span className="patient-icon">
                                                {patient.gender === 'male' ? '👦' : '👧'}
                                            </span>
                                            <div className="patient-info">
                                                <strong>{patient.name}</strong>
                                                <small>{formatDate(patient.birthDate)}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{calculateAge(patient.birthDate)}</td>
                                    <td>{patient.parent?.name || 'N/A'}</td>
                                    <td>
                                        {patient.parent?.phone ? (
                                            <a href={`tel:${patient.parent.phone}`} className="phone-link">
                                                📞 {patient.parent.phone}
                                            </a>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                    <td>
                                        {patient.bloodType ? (
                                            <span className="badge badge-primary">{patient.bloodType}</span>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                    <td>
                                        <Link
                                            to={`/children/${patient._id}`}
                                            className="btn btn-primary btn-sm"
                                        >
                                            💉 {t('vaccinations.markCompleted')}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Quick Tips */}
            <div className="doctor-tips card">
                <h3>💡 {t('patients.quickActions')}</h3>
                <ul>
                    <li>{t('patients.tip1')}</li>
                    <li>{t('patients.tip2')}</li>
                    <li>{t('patients.tip3')}</li>
                </ul>
            </div>
        </div>
    );
};

export default PatientsList;
