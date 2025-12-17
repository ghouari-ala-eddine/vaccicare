import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { appointmentsAPI, childrenAPI, vaccinesAPI, authAPI } from '../../services/api';
import DoctorAvailability from './DoctorAvailability';
import './Appointments.css';

const AppointmentsList = () => {
    const { isParent, isDoctor } = useAuth();
    const { t, language } = useLanguage();
    const [searchParams] = useSearchParams();
    const [appointments, setAppointments] = useState([]);
    const [children, setChildren] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        childId: searchParams.get('child') || '',
        doctorId: '',
        scheduledDate: '',
        scheduledTime: '09:00',
        vaccines: [],
        notes: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appointmentsData, childrenData, vaccinesData, doctorsData] = await Promise.all([
                    appointmentsAPI.getAll(),
                    isParent ? childrenAPI.getAll() : Promise.resolve([]),
                    vaccinesAPI.getAll(),
                    authAPI.getDoctors()
                ]);
                setAppointments(appointmentsData);
                setChildren(childrenData);
                setVaccines(vaccinesData);
                setDoctors(doctorsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isParent]);

    const formatDate = (date) => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(date).toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-warning', text: t('appointments.pending') },
            confirmed: { class: 'badge-success', text: t('appointments.confirmed') },
            completed: { class: 'badge-primary', text: t('appointments.completed') },
            rejected: { class: 'badge-danger', text: t('appointments.rejected') },
            cancelled: { class: 'badge-gray', text: t('appointments.cancelled') }
        };
        return badges[status] || { class: 'badge-gray', text: status };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...formData,
                doctor: formData.doctorId || undefined
            };
            delete submitData.doctorId;

            await appointmentsAPI.create(submitData);
            setShowModal(false);
            const updatedAppointments = await appointmentsAPI.getAll();
            setAppointments(updatedAppointments);
            setFormData({
                childId: '',
                doctorId: '',
                scheduledDate: '',
                scheduledTime: '09:00',
                vaccines: [],
                notes: ''
            });
        } catch (error) {
            console.error('Error creating appointment:', error);
        }
    };

    const handleAction = async (id, status) => {
        try {
            await appointmentsAPI.update(id, { status });
            const updatedAppointments = await appointmentsAPI.getAll();
            setAppointments(updatedAppointments);
        } catch (error) {
            console.error('Error updating appointment:', error);
        }
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p>{t('loading')}</p>
            </div>
        );
    }

    const groupedAppointments = {
        upcoming: appointments.filter(a =>
            ['pending', 'confirmed'].includes(a.status) &&
            new Date(a.scheduledDate) >= new Date()
        ),
        past: appointments.filter(a =>
            ['completed', 'rejected', 'cancelled'].includes(a.status) ||
            new Date(a.scheduledDate) < new Date()
        )
    };

    return (
        <div className="appointments-page container">
            <div className="page-header">
                <div>
                    <h1>📅 {t('appointments.title')}</h1>
                    <p className="text-muted">
                        {isParent ? t('profile.subtitle') : t('patients.subtitle')}
                    </p>
                </div>
                {isParent && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + {t('appointments.new')}
                    </button>
                )}
            </div>

            {/* Available Doctors Section for Parents - With Schedule */}
            {isParent && (
                <DoctorAvailability
                    onSelectSlot={(selection) => {
                        setFormData({
                            ...formData,
                            doctorId: selection.doctor._id,
                            scheduledDate: selection.date,
                            scheduledTime: selection.slot.startTime
                        });
                        setShowModal(true);
                    }}
                />
            )}

            {/* Upcoming Appointments */}
            <div className="appointments-section">
                <h2>📆 {t('appointments.upcoming')} ({groupedAppointments.upcoming.length})</h2>

                {groupedAppointments.upcoming.length === 0 ? (
                    <div className="empty-state card">
                        <span className="empty-icon">📅</span>
                        <p>{t('appointments.noAppointments')}</p>
                        {isParent && (
                            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                                {t('dashboard.scheduleAppointment')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="appointments-grid">
                        {groupedAppointments.upcoming.map(apt => (
                            <div key={apt._id} className="appointment-card-full card">
                                <div className="apt-header">
                                    <div className="apt-date-block">
                                        <span className="apt-day">{new Date(apt.scheduledDate).getDate()}</span>
                                        <span className="apt-month">
                                            {new Date(apt.scheduledDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR', { month: 'short' })}
                                        </span>
                                    </div>
                                    <span className={`badge ${getStatusBadge(apt.status).class}`}>
                                        {getStatusBadge(apt.status).text}
                                    </span>
                                </div>
                                <div className="apt-body">
                                    <h3>{apt.child?.name}</h3>
                                    <p className="apt-time">🕐 {apt.scheduledTime}</p>
                                    <p className="apt-date-text">{formatDate(apt.scheduledDate)}</p>
                                    {!isParent && (
                                        <p className="apt-parent">👤 {t('children.parent')}: {apt.parent?.name}</p>
                                    )}
                                    {apt.doctor && (apt.status === 'confirmed' || apt.status === 'completed') && (
                                        <p className="apt-doctor">👨‍⚕️ Dr. {apt.doctor.name}</p>
                                    )}
                                    {apt.vaccines?.length > 0 && (
                                        <p className="apt-vaccines">
                                            💉 {apt.vaccines.map(v => v.name).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <div className="apt-actions">
                                    {isDoctor && apt.status === 'pending' && (
                                        <>
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => handleAction(apt._id, 'confirmed')}
                                            >
                                                ✓ {t('confirm')}
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleAction(apt._id, 'rejected')}
                                            >
                                                ✗ {t('cancel')}
                                            </button>
                                        </>
                                    )}
                                    {isDoctor && apt.status === 'confirmed' && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleAction(apt._id, 'completed')}
                                        >
                                            ✓ {t('vaccinations.markCompleted')}
                                        </button>
                                    )}
                                    {isParent && apt.status === 'pending' && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleAction(apt._id, 'cancelled')}
                                        >
                                            {t('cancel')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Past Appointments */}
            {groupedAppointments.past.length > 0 && (
                <div className="appointments-section">
                    <h2>📋 {t('appointments.history')} ({groupedAppointments.past.length})</h2>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>{t('appointments.date')}</th>
                                    <th>{t('appointments.child')}</th>
                                    <th>{t('appointments.time')}</th>
                                    <th>{t('vaccinations.doctor')}</th>
                                    <th>{t('appointments.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedAppointments.past.slice(0, 10).map(apt => (
                                    <tr key={apt._id}>
                                        <td>{formatDate(apt.scheduledDate)}</td>
                                        <td>{apt.child?.name}</td>
                                        <td>{apt.scheduledTime}</td>
                                        <td>{apt.doctor ? `Dr. ${apt.doctor.name}` : '-'}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(apt.status).class}`}>
                                                {getStatusBadge(apt.status).text}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* New Appointment Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">📅 {t('appointments.new')}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">{t('appointments.child')} *</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.childId}
                                        onChange={e => setFormData({ ...formData, childId: e.target.value })}
                                        required
                                    >
                                        <option value="">{t('appointments.selectChild')}</option>
                                        {children.map(child => (
                                            <option key={child._id} value={child._id}>{child.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('vaccinations.doctor')}</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.doctorId}
                                        onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
                                    >
                                        <option value="">{t('appointments.noDoctorSelected')}</option>
                                        {doctors.map(doctor => (
                                            <option key={doctor._id} value={doctor._id}>
                                                Dr. {doctor.name} {doctor.specialty ? `(${doctor.specialty})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">{t('appointments.date')} *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.scheduledDate}
                                            onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('appointments.time')} *</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.scheduledTime}
                                            onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                                        >
                                            {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                                                '14:00', '14:30', '15:00', '15:30', '16:00'].map(time => (
                                                    <option key={time} value={time}>{time}</option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('appointments.notes')}</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        placeholder={t('appointments.notes')}
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    {t('cancel')}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {t('appointments.confirmAppointment')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentsList;
