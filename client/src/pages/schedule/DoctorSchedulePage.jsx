import { useState, useEffect } from 'react';
import { scheduleAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import './Schedule.css';

const DoctorSchedulePage = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showAddSlots, setShowAddSlots] = useState(false);
    const [newSlots, setNewSlots] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const data = await scheduleAPI.getMySchedule();
            setSchedules(data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = () => {
        setNewSlots([...newSlots, { startTime: '09:00', endTime: '09:30' }]);
    };

    const handleRemoveSlot = (index) => {
        setNewSlots(newSlots.filter((_, i) => i !== index));
    };

    const handleSlotChange = (index, field, value) => {
        const updated = [...newSlots];
        updated[index][field] = value;
        setNewSlots(updated);
    };

    const handleSaveSchedule = async () => {
        if (newSlots.length === 0) {
            alert(t('schedule.noSlots'));
            return;
        }

        setSaving(true);
        try {
            await scheduleAPI.createOrUpdate({
                date: selectedDate,
                slots: newSlots,
                isAvailable: true
            });
            fetchSchedules();
            setNewSlots([]);
            setShowAddSlots(false);
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert(t('messages.error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSchedule = async (id) => {
        if (window.confirm(t('schedule.confirmDelete'))) {
            try {
                await scheduleAPI.delete(id);
                fetchSchedules();
            } catch (error) {
                console.error('Error deleting schedule:', error);
                alert(error.message || t('messages.error'));
            }
        }
    };

    const handleCancelBooking = async (scheduleId, slotId) => {
        if (window.confirm(t('schedule.confirmCancelBooking'))) {
            try {
                await scheduleAPI.cancelBooking(scheduleId, slotId);
                fetchSchedules();
            } catch (error) {
                console.error('Error canceling booking:', error);
            }
        }
    };

    const formatDate = (date) => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(date).toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const generateTimeOptions = () => {
        const options = [];
        for (let h = 8; h <= 18; h++) {
            for (let m = 0; m < 60; m += 30) {
                const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                options.push(time);
            }
        }
        return options;
    };

    const timeOptions = generateTimeOptions();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p>{t('loading')}</p>
            </div>
        );
    }

    return (
        <div className="schedule-page">
            <div className="page-header">
                <h1>🗓️ {t('schedule.mySchedule')}</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddSlots(true)}
                >
                    + {t('schedule.addSlots')}
                </button>
            </div>

            {/* Add Slots Form */}
            {showAddSlots && (
                <div className="add-slots-card card">
                    <h3>{t('schedule.setAvailability')}</h3>

                    <div className="form-group">
                        <label className="form-label">{t('schedule.date')}</label>
                        <input
                            type="date"
                            className="form-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="slots-editor">
                        <div className="slots-header">
                            <h4>{t('schedule.timeSlots')}</h4>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={handleAddSlot}
                            >
                                + {t('schedule.addSlot')}
                            </button>
                        </div>

                        {newSlots.length === 0 ? (
                            <p className="no-slots-hint">{t('schedule.clickToAddSlots')}</p>
                        ) : (
                            <div className="slots-list-edit">
                                {newSlots.map((slot, index) => (
                                    <div key={index} className="slot-row">
                                        <select
                                            className="form-input form-select"
                                            value={slot.startTime}
                                            onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                                        >
                                            {timeOptions.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                        <span className="slot-separator">→</span>
                                        <select
                                            className="form-input form-select"
                                            value={slot.endTime}
                                            onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                                        >
                                            {timeOptions.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleRemoveSlot(index)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="quick-add-slots">
                            <span>{t('schedule.quickAdd')}:</span>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setNewSlots([
                                    { startTime: '09:00', endTime: '09:30' },
                                    { startTime: '09:30', endTime: '10:00' },
                                    { startTime: '10:00', endTime: '10:30' },
                                    { startTime: '10:30', endTime: '11:00' },
                                    { startTime: '11:00', endTime: '11:30' },
                                    { startTime: '11:30', endTime: '12:00' }
                                ])}
                            >
                                🌅 {t('schedule.morning')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setNewSlots([
                                    { startTime: '14:00', endTime: '14:30' },
                                    { startTime: '14:30', endTime: '15:00' },
                                    { startTime: '15:00', endTime: '15:30' },
                                    { startTime: '15:30', endTime: '16:00' },
                                    { startTime: '16:00', endTime: '16:30' },
                                    { startTime: '16:30', endTime: '17:00' }
                                ])}
                            >
                                🌤️ {t('schedule.afternoon')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setNewSlots([
                                    { startTime: '09:00', endTime: '09:30' },
                                    { startTime: '09:30', endTime: '10:00' },
                                    { startTime: '10:00', endTime: '10:30' },
                                    { startTime: '10:30', endTime: '11:00' },
                                    { startTime: '11:00', endTime: '11:30' },
                                    { startTime: '11:30', endTime: '12:00' },
                                    { startTime: '14:00', endTime: '14:30' },
                                    { startTime: '14:30', endTime: '15:00' },
                                    { startTime: '15:00', endTime: '15:30' },
                                    { startTime: '15:30', endTime: '16:00' },
                                    { startTime: '16:00', endTime: '16:30' },
                                    { startTime: '16:30', endTime: '17:00' }
                                ])}
                            >
                                📅 {t('schedule.fullDay')}
                            </button>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                                setShowAddSlots(false);
                                setNewSlots([]);
                            }}
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSaveSchedule}
                            disabled={saving || newSlots.length === 0}
                        >
                            {saving ? '...' : t('save')}
                        </button>
                    </div>
                </div>
            )}

            {/* Schedules List */}
            {schedules.length === 0 ? (
                <div className="empty-state">
                    <span>🗓️</span>
                    <h3>{t('schedule.noSchedules')}</h3>
                    <p>{t('schedule.noSchedulesHint')}</p>
                </div>
            ) : (
                <div className="schedules-list">
                    {schedules.map(schedule => (
                        <div key={schedule._id} className="schedule-card">
                            <div className="schedule-header">
                                <h3>📅 {formatDate(schedule.date)}</h3>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteSchedule(schedule._id)}
                                >
                                    🗑️ {t('delete')}
                                </button>
                            </div>

                            <div className="slots-grid">
                                {schedule.slots.map(slot => (
                                    <div
                                        key={slot._id}
                                        className={`slot-item ${slot.isBooked ? 'booked' : 'available'}`}
                                    >
                                        <span className="slot-time">
                                            {slot.startTime} - {slot.endTime}
                                        </span>
                                        {slot.isBooked ? (
                                            <div className="slot-booking">
                                                <span className="booked-by">
                                                    👤 {slot.bookedBy?.name || t('schedule.booked')}
                                                </span>
                                                <button
                                                    className="btn btn-secondary btn-xs"
                                                    onClick={() => handleCancelBooking(schedule._id, slot._id)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="available-badge">
                                                ✓ {t('schedule.available')}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="schedule-stats">
                                <span className="stat available">
                                    ✓ {schedule.slots.filter(s => !s.isBooked).length} {t('schedule.available')}
                                </span>
                                <span className="stat booked">
                                    📋 {schedule.slots.filter(s => s.isBooked).length} {t('schedule.booked')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorSchedulePage;
