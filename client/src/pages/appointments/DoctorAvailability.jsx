import { useState, useEffect } from 'react';
import { scheduleAPI } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import './DoctorAvailability.css';

const DoctorAvailability = ({ onSelectSlot }) => {
    const { t, language } = useLanguage();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        fetchDoctors();
    }, [selectedDate]);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const data = await scheduleAPI.getAvailableDoctors(selectedDate);
            setDoctors(data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(date).toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    const handleSelectSlot = (doctor, schedule, slot) => {
        if (onSelectSlot) {
            onSelectSlot({
                doctor: doctor.doctor,
                schedule: schedule,
                slot: slot,
                date: selectedDate
            });
        }
    };

    // Generate next 7 days for date selection
    const getNextDays = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    };

    const nextDays = getNextDays();

    if (loading) {
        return (
            <div className="availability-loading">
                <div className="spinner-small"></div>
                <p>{t('loading')}</p>
            </div>
        );
    }

    return (
        <div className="doctor-availability">
            <h3>📅 {t('availability.title')}</h3>

            {/* Date Selector */}
            <div className="date-selector">
                {nextDays.map(date => (
                    <button
                        key={date}
                        className={`date-btn ${selectedDate === date ? 'active' : ''}`}
                        onClick={() => setSelectedDate(date)}
                    >
                        <span className="date-day">
                            {new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR', { weekday: 'short' })}
                        </span>
                        <span className="date-num">
                            {new Date(date).getDate()}
                        </span>
                    </button>
                ))}
            </div>

            <p className="selected-date-label">
                📆 {formatDate(selectedDate)}
            </p>

            {/* Doctors List */}
            <div className="doctors-availability-list">
                {doctors.length === 0 ? (
                    <div className="no-doctors">
                        <span>👨‍⚕️</span>
                        <p>{t('availability.noDoctors')}</p>
                    </div>
                ) : (
                    doctors.map(item => (
                        <div key={item.doctor._id} className="doctor-availability-card">
                            <div className="doctor-info">
                                <span className="doctor-avatar">👨‍⚕️</span>
                                <div className="doctor-details">
                                    <h4>Dr. {item.doctor.name}</h4>
                                    {item.doctor.specialty && (
                                        <span className="doctor-specialty">{item.doctor.specialty}</span>
                                    )}
                                </div>
                            </div>

                            {item.schedule ? (
                                <div className="availability-slots">
                                    {item.schedule.availableSlots.length > 0 ? (
                                        <>
                                            <p className="slots-label">
                                                ✅ {item.schedule.availableSlots.length} {t('availability.slotsAvailable')}
                                            </p>
                                            <div className="slots-grid">
                                                {item.schedule.availableSlots.map(slot => (
                                                    <button
                                                        key={slot._id}
                                                        className="slot-btn"
                                                        onClick={() => handleSelectSlot(item, item.schedule, slot)}
                                                    >
                                                        {slot.startTime} - {slot.endTime}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="no-slots">
                                            ❌ {t('availability.noSlots')}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="no-schedule">
                                    <span className="unavailable-badge">
                                        ⏸️ {t('availability.notAvailable')}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DoctorAvailability;
