import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { vaccinationsAPI, vaccinesAPI, childrenAPI } from '../../services/api';
import './Dashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [stats, setStats] = useState(null);
    const [vaccines, setVaccines] = useState([]);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddVaccine, setShowAddVaccine] = useState(false);
    const [activeTab, setActiveTab] = useState('children');
    const [newVaccine, setNewVaccine] = useState({
        name: '',
        description: '',
        recommendedAges: '',
        totalDoses: 1,
        isMandatory: true
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, vaccinesData, childrenData] = await Promise.all([
                    vaccinationsAPI.getStats(),
                    vaccinesAPI.getAll(),
                    childrenAPI.getAll()
                ]);
                setStats(statsData);
                setVaccines(vaccinesData);
                setChildren(childrenData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSeedVaccines = async () => {
        try {
            await vaccinesAPI.seed();
            const vaccinesData = await vaccinesAPI.getAll();
            setVaccines(vaccinesData);
            alert(t('messages.success'));
        } catch (error) {
            console.error('Error seeding vaccines:', error);
            alert(t('messages.error') + ': ' + error.message);
        }
    };

    const handleAddVaccine = async (e) => {
        e.preventDefault();
        try {
            const vaccineData = {
                ...newVaccine,
                recommendedAges: newVaccine.recommendedAges.split(',').map(a => parseInt(a.trim()))
            };
            await vaccinesAPI.create(vaccineData);
            const vaccinesData = await vaccinesAPI.getAll();
            setVaccines(vaccinesData);
            setShowAddVaccine(false);
            setNewVaccine({ name: '', description: '', recommendedAges: '', totalDoses: 1, isMandatory: true });
        } catch (error) {
            console.error('Error adding vaccine:', error);
        }
    };

    const handleDeleteChild = async (childId) => {
        if (window.confirm(t('children.confirmDelete'))) {
            try {
                await childrenAPI.delete(childId);
                setChildren(children.filter(c => c._id !== childId));
            } catch (error) {
                console.error('Error deleting child:', error);
                alert(t('messages.error'));
            }
        }
    };

    const formatDate = (date) => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(date).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const calculateAge = (birthDate) => {
        const birth = new Date(birthDate);
        const today = new Date();
        const months = (today.getFullYear() - birth.getFullYear()) * 12 +
            (today.getMonth() - birth.getMonth());
        if (months < 12) return `${months} ${t('children.months')}`;
        const years = Math.floor(months / 12);
        return `${years} ${t('children.years')}`;
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
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>🔑 {t('dashboard.adminWelcome')}</h1>
                    <p className="text-muted">{t('dashboard.welcome')}, {user?.name}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon">👶</div>
                    <div className="stat-content">
                        <h3>{children.length}</h3>
                        <p>{t('dashboard.children')}</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">💉</div>
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
                        <p>{t('dashboard.delayedVaccinations')}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'children' ? 'active' : ''}`}
                    onClick={() => setActiveTab('children')}
                >
                    👶 {t('nav.children')} ({children.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'vaccines' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vaccines')}
                >
                    💉 {t('vaccinations.title')} ({vaccines.length})
                </button>
            </div>

            {/* Children Management */}
            {activeTab === 'children' && (
                <div className="dashboard-section full-width">
                    <div className="section-header">
                        <h2>👶 {t('children.title')}</h2>
                        <span className="text-muted">{children.length} {t('dashboard.children')}</span>
                    </div>

                    {children.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">👶</span>
                            <p>{t('children.noChildren')}</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('appointments.child')}</th>
                                        <th>{t('children.birthDate')}</th>
                                        <th>{t('children.age')}</th>
                                        <th>{t('children.parent')}</th>
                                        <th>{t('children.bloodType')}</th>
                                        <th>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {children.map(child => (
                                        <tr key={child._id}>
                                            <td>
                                                <div className="child-cell">
                                                    <span className="child-icon">
                                                        {child.gender === 'male' ? '👦' : '👧'}
                                                    </span>
                                                    <strong>{child.name}</strong>
                                                </div>
                                            </td>
                                            <td>{formatDate(child.birthDate)}</td>
                                            <td>{calculateAge(child.birthDate)}</td>
                                            <td>{child.parent?.name || 'N/A'}</td>
                                            <td>
                                                {child.bloodType ? (
                                                    <span className="badge badge-primary">{child.bloodType}</span>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    <Link
                                                        to={`/children/${child._id}`}
                                                        className="btn btn-primary btn-sm"
                                                    >
                                                        👁 {t('view')}
                                                    </Link>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDeleteChild(child._id)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Vaccines Management */}
            {activeTab === 'vaccines' && (
                <div className="dashboard-section full-width">
                    <div className="section-header">
                        <h2>🧪 {t('vaccinations.title')}</h2>
                        <div className="header-actions">
                            <button className="btn btn-secondary btn-sm" onClick={handleSeedVaccines}>
                                🔄 {t('edit')}
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowAddVaccine(true)}>
                                + {t('add')}
                            </button>
                        </div>
                    </div>

                    {vaccines.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">💉</span>
                            <p>{t('messages.noDataAvailable')}</p>
                            <button className="btn btn-primary" onClick={handleSeedVaccines}>
                                {t('add')}
                            </button>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('auth.name')}</th>
                                        <th>{t('children.notes')}</th>
                                        <th>{t('vaccinations.recommendedAge')}</th>
                                        <th>{t('vaccinations.dose')}</th>
                                        <th>{t('vaccinations.status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vaccines.map(vaccine => (
                                        <tr key={vaccine._id}>
                                            <td><strong>{vaccine.name}</strong></td>
                                            <td>{vaccine.description}</td>
                                            <td>
                                                {vaccine.recommendedAges.map((age, i) => (
                                                    <span key={i} className="badge badge-primary" style={{ marginRight: '4px' }}>
                                                        {age === 0 ? (language === 'ar' ? 'عند الولادة' : 'Naissance') : `${age}m`}
                                                    </span>
                                                ))}
                                            </td>
                                            <td>{vaccine.totalDoses}</td>
                                            <td>
                                                <span className={`badge ${vaccine.isMandatory ? 'badge-success' : 'badge-gray'}`}>
                                                    {vaccine.isMandatory ? t('yes') : t('no')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Add Vaccine Modal */}
            {showAddVaccine && (
                <div className="modal-overlay" onClick={() => setShowAddVaccine(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">💉 {t('add')} {t('vaccinations.vaccine')}</h2>
                            <button className="modal-close" onClick={() => setShowAddVaccine(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddVaccine}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">{t('auth.name')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newVaccine.name}
                                        onChange={e => setNewVaccine({ ...newVaccine, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('children.notes')}</label>
                                    <textarea
                                        className="form-input"
                                        rows="2"
                                        value={newVaccine.description}
                                        onChange={e => setNewVaccine({ ...newVaccine, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('vaccinations.recommendedAge')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: 2, 4, 12"
                                        value={newVaccine.recommendedAges}
                                        onChange={e => setNewVaccine({ ...newVaccine, recommendedAges: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">{t('vaccinations.dose')}</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            min="1"
                                            value={newVaccine.totalDoses}
                                            onChange={e => setNewVaccine({ ...newVaccine, totalDoses: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('vaccinations.status')}</label>
                                        <select
                                            className="form-input form-select"
                                            value={newVaccine.isMandatory}
                                            onChange={e => setNewVaccine({ ...newVaccine, isMandatory: e.target.value === 'true' })}
                                        >
                                            <option value="true">{t('yes')}</option>
                                            <option value="false">{t('no')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddVaccine(false)}>
                                    {t('cancel')}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {t('add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
