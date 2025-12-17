import { useState, useEffect } from 'react';
import { announcementsAPI } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import './Announcements.css';

const AnnouncementsManagement = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        targetAudience: 'all',
        isPinned: false,
        expiresAt: ''
    });
    const { t, language } = useLanguage();

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const data = await announcementsAPI.getAll();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...formData,
                expiresAt: formData.expiresAt || null
            };

            if (editingAnnouncement) {
                await announcementsAPI.update(editingAnnouncement._id, submitData);
            } else {
                await announcementsAPI.create(submitData);
            }

            setShowModal(false);
            resetForm();
            fetchAnnouncements();
        } catch (error) {
            console.error('Error saving announcement:', error);
            alert(t('messages.error'));
        }
    };

    const handleEdit = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            message: announcement.message,
            type: announcement.type,
            priority: announcement.priority,
            targetAudience: announcement.targetAudience,
            isPinned: announcement.isPinned,
            expiresAt: announcement.expiresAt ? announcement.expiresAt.split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('announcements.confirmDelete'))) {
            try {
                await announcementsAPI.delete(id);
                fetchAnnouncements();
            } catch (error) {
                console.error('Error deleting announcement:', error);
            }
        }
    };

    const handleToggle = async (id) => {
        try {
            await announcementsAPI.toggle(id);
            fetchAnnouncements();
        } catch (error) {
            console.error('Error toggling announcement:', error);
        }
    };

    const resetForm = () => {
        setEditingAnnouncement(null);
        setFormData({
            title: '',
            message: '',
            type: 'info',
            priority: 'medium',
            targetAudience: 'all',
            isPinned: false,
            expiresAt: ''
        });
    };

    const formatDate = (date) => {
        if (!date) return '-';
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(date).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTypeBadge = (type) => {
        const types = {
            info: { class: 'badge-primary', text: '📢 Info', icon: '📢' },
            warning: { class: 'badge-warning', text: '⚠️ Warning', icon: '⚠️' },
            alert: { class: 'badge-danger', text: '🚨 Alert', icon: '🚨' },
            success: { class: 'badge-success', text: '✅ Success', icon: '✅' }
        };
        return types[type] || types.info;
    };

    const getPriorityBadge = (priority) => {
        const priorities = {
            low: { class: 'badge-gray', text: t('announcements.low') },
            medium: { class: 'badge-primary', text: t('announcements.medium') },
            high: { class: 'badge-warning', text: t('announcements.high') },
            urgent: { class: 'badge-danger', text: t('announcements.urgent') }
        };
        return priorities[priority] || priorities.medium;
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
        <div className="announcements-page container">
            <div className="page-header">
                <div>
                    <h1>📢 {t('announcements.title')}</h1>
                    <p className="text-muted">{t('announcements.subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    + {t('announcements.new')}
                </button>
            </div>

            {/* Stats */}
            <div className="announcements-stats">
                <div className="stat-card primary">
                    <div className="stat-icon">📢</div>
                    <div className="stat-content">
                        <h3>{announcements.length}</h3>
                        <p>{t('announcements.total')}</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{announcements.filter(a => a.isActive).length}</h3>
                        <p>{t('announcements.active')}</p>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon">📌</div>
                    <div className="stat-content">
                        <h3>{announcements.filter(a => a.isPinned).length}</h3>
                        <p>{t('announcements.pinned')}</p>
                    </div>
                </div>
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <div className="empty-state card">
                    <span className="empty-icon">📢</span>
                    <h3>{t('announcements.noAnnouncements')}</h3>
                    <p>{t('announcements.createFirst')}</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + {t('announcements.new')}
                    </button>
                </div>
            ) : (
                <div className="announcements-list">
                    {announcements.map(announcement => (
                        <div
                            key={announcement._id}
                            className={`announcement-card card ${!announcement.isActive ? 'inactive' : ''}`}
                        >
                            <div className="announcement-header">
                                <div className="announcement-badges">
                                    <span className={`badge ${getTypeBadge(announcement.type).class}`}>
                                        {getTypeBadge(announcement.type).icon}
                                    </span>
                                    <span className={`badge ${getPriorityBadge(announcement.priority).class}`}>
                                        {getPriorityBadge(announcement.priority).text}
                                    </span>
                                    {announcement.isPinned && (
                                        <span className="badge badge-primary">📌 {t('announcements.pinned')}</span>
                                    )}
                                    {!announcement.isActive && (
                                        <span className="badge badge-gray">{t('announcements.inactive')}</span>
                                    )}
                                </div>
                                <div className="announcement-meta">
                                    <span>{formatDate(announcement.createdAt)}</span>
                                    {announcement.author && <span>• {announcement.author.name}</span>}
                                </div>
                            </div>
                            <div className="announcement-body">
                                <h3>{announcement.title}</h3>
                                <p>{announcement.message}</p>
                                <div className="announcement-info">
                                    <span className="target-badge">
                                        👥 {t(`announcements.audience.${announcement.targetAudience}`)}
                                    </span>
                                    {announcement.expiresAt && (
                                        <span className="expires-badge">
                                            ⏰ {t('announcements.expiresOn')}: {formatDate(announcement.expiresAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="announcement-actions">
                                <button
                                    className={`btn btn-sm ${announcement.isActive ? 'btn-warning' : 'btn-success'}`}
                                    onClick={() => handleToggle(announcement._id)}
                                >
                                    {announcement.isActive ? `🔕 ${t('announcements.deactivate')}` : `🔔 ${t('announcements.activate')}`}
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleEdit(announcement)}
                                >
                                    ✏️ {t('edit')}
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(announcement._id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                📢 {editingAnnouncement ? t('announcements.edit') : t('announcements.new')}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">{t('announcements.titleLabel')} *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder={t('announcements.titlePlaceholder')}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('announcements.message')} *</label>
                                    <textarea
                                        className="form-input"
                                        rows="4"
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        placeholder={t('announcements.messagePlaceholder')}
                                        required
                                    ></textarea>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">{t('announcements.type')}</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="info">📢 Info</option>
                                            <option value="success">✅ {t('messages.success')}</option>
                                            <option value="warning">⚠️ {t('announcements.warning')}</option>
                                            <option value="alert">🚨 {t('announcements.alert')}</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('announcements.priority')}</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            <option value="low">{t('announcements.low')}</option>
                                            <option value="medium">{t('announcements.medium')}</option>
                                            <option value="high">{t('announcements.high')}</option>
                                            <option value="urgent">{t('announcements.urgent')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">{t('announcements.targetAudience')}</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.targetAudience}
                                            onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                                        >
                                            <option value="all">{t('announcements.audience.all')}</option>
                                            <option value="parents">{t('announcements.audience.parents')}</option>
                                            <option value="doctors">{t('announcements.audience.doctors')}</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('announcements.expiresAt')}</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.expiresAt}
                                            onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>

                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPinned}
                                            onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                                        />
                                        <span>📌 {t('announcements.pinToTop')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    {t('cancel')}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingAnnouncement ? t('save') : t('announcements.publish')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsManagement;
