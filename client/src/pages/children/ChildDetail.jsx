import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { childrenAPI, vaccinationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import VaccinationCertificate from '../../components/VaccinationCertificate';
import SideEffectForm from '../../components/SideEffectForm';
import DoctorNotes from '../../components/DoctorNotes';
import LabResults from '../../components/LabResults';
import './Children.css';

const ChildDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDoctor, isAdmin, isParent } = useAuth();
    const { t, language } = useLanguage();
    const [child, setChild] = useState(null);
    const [vaccinations, setVaccinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCertificate, setShowCertificate] = useState(false);
    const [showSideEffectForm, setShowSideEffectForm] = useState(null);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await childrenAPI.getOne(id);
                setChild(data.child);
                setVaccinations(data.vaccinations || []);
            } catch (error) {
                console.error('Error fetching child:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm(t('children.confirmDelete'))) {
            try {
                await childrenAPI.delete(id);
                navigate('/children');
            } catch (error) {
                console.error('Error deleting child:', error);
                alert(t('messages.error'));
            }
        }
    };

    const handleMarkAsCompleted = async (vaccinationId) => {
        setUpdating(vaccinationId);
        try {
            await vaccinationsAPI.update(vaccinationId, {
                status: 'completed',
                administeredDate: new Date().toISOString()
            });
            const data = await childrenAPI.getOne(id);
            setVaccinations(data.vaccinations || []);
        } catch (error) {
            console.error('Error updating vaccination:', error);
            alert(t('messages.error') + ': ' + error.message);
        } finally {
            setUpdating(null);
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

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: { class: 'badge-primary', text: t('vaccinations.scheduled'), icon: '📅' },
            completed: { class: 'badge-success', text: t('vaccinations.completed'), icon: '✅' },
            delayed: { class: 'badge-danger', text: t('vaccinations.delayed'), icon: '⚠️' },
            missed: { class: 'badge-gray', text: t('dashboard.delayed'), icon: '❌' }
        };
        return badges[status] || { class: 'badge-gray', text: status, icon: '❓' };
    };

    const groupVaccinationsByVaccine = () => {
        const grouped = {};
        vaccinations.forEach(vax => {
            const vaccineName = vax.vaccine?.name || 'Unknown';
            if (!grouped[vaccineName]) {
                grouped[vaccineName] = [];
            }
            grouped[vaccineName].push(vax);
        });
        return grouped;
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p>{t('loading')}</p>
            </div>
        );
    }

    if (!child) {
        return (
            <div className="container">
                <div className="empty-state-large">
                    <span className="empty-icon">❌</span>
                    <h2>{t('messages.noDataAvailable')}</h2>
                    <p>{t('messages.error')}</p>
                    <Link to="/children" className="btn btn-primary">
                        {t('back')}
                    </Link>
                </div>
            </div>
        );
    }

    const groupedVaccinations = groupVaccinationsByVaccine();

    return (
        <div className="child-detail-page container">
            <div className="page-breadcrumb">
                <Link to="/children">← {t('back')} {t('children.title')}</Link>
            </div>

            <div className="child-profile card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {child.gender === 'male' ? '👦' : '👧'}
                    </div>
                    <div className="profile-info">
                        <h1>{child.name}</h1>
                        <p className="profile-age">{calculateAge(child.birthDate)}</p>
                        <p className="text-muted">{formatDate(child.birthDate)}</p>
                    </div>
                    <div className="profile-actions">
                        <Link to={`/appointments/new?child=${child._id}`} className="btn btn-primary">
                            📅 {t('children.makeAppointment')}
                        </Link>
                        <button
                            className="btn btn-success"
                            onClick={() => setShowCertificate(true)}
                        >
                            📄 {t('children.certificate')}
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleDelete}
                        >
                            🗑️ {t('delete')}
                        </button>
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="profile-stat">
                        <span className="stat-num">{vaccinations.length}</span>
                        <span className="stat-label">{t('dashboard.scheduledVaccinations')}</span>
                    </div>
                    <div className="profile-stat success">
                        <span className="stat-num">{vaccinations.filter(v => v.status === 'completed').length}</span>
                        <span className="stat-label">{t('dashboard.done')}</span>
                    </div>
                    <div className="profile-stat danger">
                        <span className="stat-num">{vaccinations.filter(v => v.status === 'delayed').length}</span>
                        <span className="stat-label">{t('dashboard.delayed')}</span>
                    </div>
                </div>

                {child.bloodType || child.allergies ? (
                    <div className="profile-medical">
                        <h3>🏥 {t('children.childInfo')}</h3>
                        <div className="medical-grid">
                            {child.bloodType && (
                                <div className="medical-item">
                                    <span className="medical-label">{t('children.bloodType')}</span>
                                    <span className="medical-value">{child.bloodType}</span>
                                </div>
                            )}
                            {child.allergies && (
                                <div className="medical-item">
                                    <span className="medical-label">{t('children.allergies')}</span>
                                    <span className="medical-value">{child.allergies}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="vaccination-section card">
                <h2>💉 {t('children.vaccineSchedule')}</h2>

                {/* Doctor Notice */}
                {isDoctor && (
                    <div className="doctor-notice">
                        <span>👨‍⚕️</span>
                        <p>{t('vaccinations.markCompleted')}</p>
                    </div>
                )}

                {vaccinations.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">💉</span>
                        <p>{t('dashboard.noData')}</p>
                    </div>
                ) : (
                    <div className="vaccination-timeline">
                        {Object.entries(groupedVaccinations).map(([vaccineName, doses]) => (
                            <div key={vaccineName} className="vaccine-group card">
                                <div className="vaccine-header">
                                    <h3>💉 {vaccineName}</h3>
                                    <span className="dose-count">
                                        {doses.filter(d => d.status === 'completed').length}/{doses.length} {t('vaccinations.dose')}
                                    </span>
                                </div>
                                <div className="doses-list">
                                    {doses.sort((a, b) => a.doseNumber - b.doseNumber).map(dose => (
                                        <div key={dose._id} className={`dose-item ${dose.status}`}>
                                            <div className="dose-number">
                                                {t('vaccinations.dose')} {dose.doseNumber}
                                            </div>
                                            <div className="dose-info">
                                                <span className="dose-date">
                                                    {dose.status === 'completed' && dose.administeredDate
                                                        ? `${t('vaccinations.administeredOn')} ${formatDate(dose.administeredDate)}`
                                                        : `${t('vaccinations.scheduledFor')} ${formatDate(dose.scheduledDate)}`
                                                    }
                                                </span>
                                                {dose.doctor && (
                                                    <span className="dose-doctor">Dr. {dose.doctor.name}</span>
                                                )}
                                            </div>
                                            <div className="dose-actions">
                                                {/* Parent can report side effect on completed vaccination */}
                                                {isParent && dose.status === 'completed' && (
                                                    <button
                                                        className="btn btn-warning btn-sm"
                                                        onClick={() => setShowSideEffectForm(dose)}
                                                    >
                                                        ⚠️ {t('vaccinations.reportSideEffect')}
                                                    </button>
                                                )}
                                                {/* Doctor can mark as completed */}
                                                {isDoctor && dose.status !== 'completed' && (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleMarkAsCompleted(dose._id)}
                                                        disabled={updating === dose._id}
                                                    >
                                                        {updating === dose._id ? '...' : `✓ ${t('vaccinations.markCompleted')}`}
                                                    </button>
                                                )}
                                                <span className={`badge ${getStatusBadge(dose.status).class}`}>
                                                    {getStatusBadge(dose.status).icon} {getStatusBadge(dose.status).text}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Doctor Notes Section - Only visible to doctors and admins */}
            {(isDoctor || isAdmin) && (
                <DoctorNotes childId={id} />
            )}

            {/* Lab Results Section - Visible to all */}
            <LabResults childId={id} />

            {/* Vaccination Certificate Modal */}
            {showCertificate && (
                <VaccinationCertificate
                    child={child}
                    vaccinations={vaccinations}
                    onClose={() => setShowCertificate(false)}
                />
            )}

            {/* Side Effect Report Modal */}
            {showSideEffectForm && (
                <SideEffectForm
                    child={child}
                    vaccination={showSideEffectForm}
                    onClose={() => setShowSideEffectForm(null)}
                    onSuccess={() => {
                        alert(t('sideEffects.reportSuccess'));
                    }}
                />
            )}
        </div>
    );
};

export default ChildDetail;
