import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { childrenAPI, appointmentsAPI, notificationsAPI, vaccinationsAPI } from '../../services/api';
import { CircularProgress, DonutChart, ProgressBar } from '../../components/Charts';
import './Dashboard.css';

const ParentDashboard = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [children, setChildren] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [childrenData, appointmentsData, notificationsData, statsData] = await Promise.all([
                    childrenAPI.getAll(),
                    appointmentsAPI.getAll(),
                    notificationsAPI.getAll(),
                    vaccinationsAPI.getStats().catch(() => null)
                ]);
                setChildren(childrenData);
                setAppointments(appointmentsData.filter(a => a.status !== 'cancelled').slice(0, 5));
                setNotifications(notificationsData.notifications?.slice(0, 5) || []);
                setStats(statsData);
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
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-warning', text: t('appointments.pending') },
            confirmed: { class: 'badge-success', text: t('appointments.confirmed') },
            completed: { class: 'badge-primary', text: t('appointments.completed') },
            rejected: { class: 'badge-danger', text: t('appointments.rejected') }
        };
        return badges[status] || { class: 'badge-gray', text: status };
    };

    // Calculate vaccination progress
    const totalVaccinations = (stats?.completed || 0) + (stats?.scheduled || 0) + (stats?.delayed || 0);
    const completionRate = totalVaccinations > 0
        ? Math.round((stats?.completed || 0) / totalVaccinations * 100)
        : 0;

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
                    <h1>👋 {t('dashboard.welcome')}, {user?.name}</h1>
                    <p className="text-muted">{t('auth.welcomeParent')}</p>
                </div>
                <Link to="/children/add" className="btn btn-primary">
                    + {t('dashboard.addChild')}
                </Link>
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
                        <p>{t('dashboard.delayedVaccinations')}</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-row">
                {/* Completion Rate */}
                <div className="chart-card card">
                    <h3>📊 {t('dashboard.vaccinationRate')}</h3>
                    <div className="chart-center">
                        <CircularProgress
                            percentage={completionRate}
                            size={140}
                            strokeWidth={12}
                            color={completionRate >= 75 ? 'success' : completionRate >= 50 ? 'warning' : 'primary'}
                            label={t('dashboard.completed')}
                        />
                    </div>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <span className="legend-dot" style={{ background: 'var(--success-500)' }}></span>
                            <span>{t('dashboard.done')}: {stats?.completed || 0}</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot" style={{ background: 'var(--primary-500)' }}></span>
                            <span>{t('dashboard.planned')}: {stats?.scheduled || 0}</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot" style={{ background: 'var(--danger-500)' }}></span>
                            <span>{t('dashboard.delayed')}: {stats?.delayed || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Vaccination Distribution */}
                <div className="chart-card card">
                    <h3>📈 {t('dashboard.vaccinationDistribution')}</h3>
                    {totalVaccinations > 0 ? (
                        <>
                            <div className="chart-center">
                                <DonutChart
                                    size={140}
                                    strokeWidth={25}
                                    segments={[
                                        { value: stats?.completed || 0, color: 'var(--success-500)' },
                                        { value: stats?.scheduled || 0, color: 'var(--primary-500)' },
                                        { value: stats?.delayed || 0, color: 'var(--danger-500)' }
                                    ]}
                                />
                            </div>
                            <div className="progress-stats">
                                <div className="progress-stat-item">
                                    <span>{t('dashboard.done')}</span>
                                    <ProgressBar
                                        value={stats?.completed || 0}
                                        max={totalVaccinations}
                                        color="success"
                                    />
                                </div>
                                <div className="progress-stat-item">
                                    <span>{t('dashboard.planned')}</span>
                                    <ProgressBar
                                        value={stats?.scheduled || 0}
                                        max={totalVaccinations}
                                        color="primary"
                                    />
                                </div>
                                <div className="progress-stat-item">
                                    <span>{t('dashboard.delayed')}</span>
                                    <ProgressBar
                                        value={stats?.delayed || 0}
                                        max={totalVaccinations}
                                        color="danger"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-chart">
                            <span className="empty-icon">📊</span>
                            <p>{t('dashboard.noData')}</p>
                            <small>{t('dashboard.addChildToSee')}</small>
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Children Section */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>👶 {t('dashboard.myChildren')}</h2>
                        <Link to="/children" className="btn btn-secondary btn-sm">
                            {t('dashboard.seeAll')}
                        </Link>
                    </div>

                    {children.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">👶</span>
                            <p>{t('dashboard.noChildrenYet')}</p>
                            <Link to="/children/add" className="btn btn-primary btn-sm">
                                {t('dashboard.addChild')}
                            </Link>
                        </div>
                    ) : (
                        <div className="children-list">
                            {children.map(child => (
                                <Link to={`/children/${child._id}`} key={child._id} className="child-card">
                                    <div className="child-avatar">
                                        {child.gender === 'male' ? '👦' : '👧'}
                                    </div>
                                    <div className="child-info">
                                        <h4>{child.name}</h4>
                                        <p>{formatDate(child.birthDate)}</p>
                                    </div>
                                    <div className="child-status">
                                        <span className="badge badge-success">{t('patients.upToDate')}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Appointments Section */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>📅 {t('dashboard.upcomingAppointments')}</h2>
                        <Link to="/appointments" className="btn btn-secondary btn-sm">
                            {t('dashboard.seeAll')}
                        </Link>
                    </div>

                    {appointments.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📅</span>
                            <p>{t('dashboard.noAppointments')}</p>
                            <Link to="/appointments/new" className="btn btn-primary btn-sm">
                                {t('dashboard.scheduleAppointment')}
                            </Link>
                        </div>
                    ) : (
                        <div className="appointments-list">
                            {appointments.map(apt => (
                                <div key={apt._id} className="appointment-card">
                                    <div className="appointment-date">
                                        <span className="date-day">
                                            {new Date(apt.scheduledDate).getDate()}
                                        </span>
                                        <span className="date-month">
                                            {new Date(apt.scheduledDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="appointment-info">
                                        <h4>{apt.child?.name}</h4>
                                        <p>{apt.scheduledTime} - {t('appointments.vaccination')}</p>
                                        {apt.doctor && apt.status === 'confirmed' && (
                                            <p className="apt-doctor-name">👨‍⚕️ Dr. {apt.doctor.name}</p>
                                        )}
                                    </div>
                                    <span className={`badge ${getStatusBadge(apt.status).class}`}>
                                        {getStatusBadge(apt.status).text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notifications Section */}
                <div className="dashboard-section full-width">
                    <div className="section-header">
                        <h2>🔔 {t('dashboard.recentNotifications')}</h2>
                        <Link to="/notifications" className="btn btn-secondary btn-sm">
                            {t('dashboard.seeAll')}
                        </Link>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">🔔</span>
                            <p>{t('dashboard.noNotifications')}</p>
                        </div>
                    ) : (
                        <div className="notifications-preview">
                            {notifications.map(notif => (
                                <div key={notif._id} className={`notification-item ${notif.isRead ? '' : 'unread'}`}>
                                    <div className="notification-icon">
                                        {notif.type === 'reminder' ? '⏰' :
                                            notif.type === 'confirmation' ? '✅' :
                                                notif.type === 'alert' ? '⚠️' : '📢'}
                                    </div>
                                    <div className="notification-content">
                                        <h4>{notif.title}</h4>
                                        <p>{notif.message}</p>
                                        <span className="notification-time">
                                            {formatDate(notif.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;
