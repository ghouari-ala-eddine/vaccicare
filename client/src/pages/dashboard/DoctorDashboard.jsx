import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { vaccinationsAPI, appointmentsAPI } from '../../services/api';
import './Dashboard.css';

const DoctorDashboard = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [stats, setStats] = useState(null);
    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [delayedVaccinations, setDelayedVaccinations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, pending, today, delayed] = await Promise.all([
                    vaccinationsAPI.getStats(),
                    appointmentsAPI.getPending(),
                    appointmentsAPI.getToday(),
                    vaccinationsAPI.getDelayed()
                ]);
                setStats(statsData);
                setPendingAppointments(pending.slice(0, 5));
                setTodayAppointments(today);
                setDelayedVaccinations(delayed.slice(0, 5));
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatDate = (date) => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(date).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short'
        });
    };

    const formatFullDate = () => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date().toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleAppointmentAction = async (id, status) => {
        try {
            await appointmentsAPI.update(id, { status });
            const updated = await appointmentsAPI.getPending();
            setPendingAppointments(updated.slice(0, 5));
        } catch (error) {
            console.error('Error updating appointment:', error);
        }
    };

    const getDaysText = (days) => {
        if (language === 'ar') {
            return `${days} يوم`;
        }
        return `${days} jours`;
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
                    <h1>👨‍⚕️ {t('dashboard.welcome')}, Dr. {user?.name}</h1>
                    <p className="text-muted">{t('dashboard.doctorWelcome')}</p>
                </div>
                <div className="header-actions">
                    <span className="today-date">📅 {formatFullDate()}</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon">👶</div>
                    <div className="stat-content">
                        <h3>{stats?.totalChildren || 0}</h3>
                        <p>{t('dashboard.totalPatients')}</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">💉</div>
                    <div className="stat-content">
                        <h3>{stats?.completedThisMonth || 0}</h3>
                        <p>{t('dashboard.completedVaccinations')}</p>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon">⏰</div>
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

            {/* Completion Rate */}
            <div className="completion-card card">
                <h3>📊 {t('dashboard.vaccinationRate')}</h3>
                <div className="progress-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${stats?.completionRate || 0}%` }}
                        ></div>
                    </div>
                    <span className="progress-value">{stats?.completionRate || 0}%</span>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Today's Appointments */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>📅 {t('dashboard.todayAppointments')}</h2>
                        <span className="badge badge-primary">{todayAppointments.length}</span>
                    </div>

                    {todayAppointments.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📅</span>
                            <p>{t('dashboard.noAppointments')}</p>
                        </div>
                    ) : (
                        <div className="appointments-list">
                            {todayAppointments.map(apt => (
                                <div key={apt._id} className="appointment-card doctor-view">
                                    <div className="appointment-time">
                                        <span className="time">{apt.scheduledTime}</span>
                                    </div>
                                    <div className="appointment-info">
                                        <h4>{apt.child?.name}</h4>
                                        <p>{t('children.parent')}: {apt.parent?.name}</p>
                                        <p className="text-muted">📞 {apt.parent?.phone || 'N/A'}</p>
                                    </div>
                                    <Link
                                        to={`/vaccinations/administer?child=${apt.child?._id}`}
                                        className="btn btn-success btn-sm"
                                    >
                                        {t('vaccinations.markCompleted')}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pending Appointments */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>⏳ {t('dashboard.pendingAppointments')}</h2>
                        <span className="badge badge-warning">{pendingAppointments.length}</span>
                    </div>

                    {pendingAppointments.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">✅</span>
                            <p>{t('dashboard.noAppointments')}</p>
                        </div>
                    ) : (
                        <div className="pending-list">
                            {pendingAppointments.map(apt => (
                                <div key={apt._id} className="pending-card">
                                    <div className="pending-info">
                                        <h4>{apt.child?.name}</h4>
                                        <p>{t('appointments.date')}: {formatDate(apt.scheduledDate)} - {apt.scheduledTime}</p>
                                        <p className="text-muted">{t('children.parent')}: {apt.parent?.name}</p>
                                    </div>
                                    <div className="pending-actions">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleAppointmentAction(apt._id, 'confirmed')}
                                        >
                                            ✓ {t('confirm')}
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleAppointmentAction(apt._id, 'rejected')}
                                        >
                                            ✗ {t('cancel')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delayed Vaccinations */}
                <div className="dashboard-section full-width">
                    <div className="section-header">
                        <h2>⚠️ {t('dashboard.delayedVaccinations')}</h2>
                        <Link to="/vaccinations/delayed" className="btn btn-secondary btn-sm">
                            {t('dashboard.seeAll')}
                        </Link>
                    </div>

                    {delayedVaccinations.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">✅</span>
                            <p>{t('dashboard.noData')}</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('appointments.child')}</th>
                                        <th>{t('vaccinations.vaccine')}</th>
                                        <th>{t('appointments.date')}</th>
                                        <th>{t('dashboard.delayed')}</th>
                                        <th>{t('children.parent')}</th>
                                        <th>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {delayedVaccinations.map(vax => (
                                        <tr key={vax._id}>
                                            <td>
                                                <strong>{vax.child?.name}</strong>
                                            </td>
                                            <td>{vax.vaccine?.name}</td>
                                            <td>{formatDate(vax.scheduledDate)}</td>
                                            <td>
                                                <span className="badge badge-danger">
                                                    {getDaysText(Math.floor((new Date() - new Date(vax.scheduledDate)) / (1000 * 60 * 60 * 24)))}
                                                </span>
                                            </td>
                                            <td>
                                                {vax.child?.parent?.phone || 'N/A'}
                                            </td>
                                            <td>
                                                <button className="btn btn-primary btn-sm">
                                                    📞 {t('actions')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
