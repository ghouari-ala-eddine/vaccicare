import { useState, useEffect } from 'react';
import { notificationsAPI } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import './Notifications.css';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { t, language } = useLanguage();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await notificationsAPI.getAll();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationsAPI.delete(id);
            fetchNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const formatDate = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now - notifDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (language === 'ar') {
            if (diffMins < 1) return 'الآن';
            if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
            if (diffHours < 24) return `منذ ${diffHours} ساعة`;
            if (diffDays < 7) return `منذ ${diffDays} يوم`;
        } else {
            if (diffMins < 1) return 'À l\'instant';
            if (diffMins < 60) return `Il y a ${diffMins} min`;
            if (diffHours < 24) return `Il y a ${diffHours}h`;
            if (diffDays < 7) return `Il y a ${diffDays} jour(s)`;
        }

        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return notifDate.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short'
        });
    };

    const getNotificationIcon = (type) => {
        const icons = {
            reminder: '⏰',
            confirmation: '✅',
            delay: '⚠️',
            alert: '🚨',
            info: '📢',
            cancellation: '❌'
        };
        return icons[type] || '🔔';
    };

    const getNotificationColor = (type) => {
        const colors = {
            reminder: 'primary',
            confirmation: 'success',
            delay: 'warning',
            alert: 'danger',
            info: 'primary',
            cancellation: 'danger'
        };
        return colors[type] || 'primary';
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
        <div className="notifications-page container">
            <div className="page-header">
                <div>
                    <h1>🔔 {t('notifications.title')}</h1>
                    <p className="text-muted">
                        {unreadCount > 0
                            ? `${unreadCount} ${t('notifications.new')}`
                            : t('notifications.noNotifications')}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-secondary" onClick={handleMarkAllAsRead}>
                        ✓ {t('notifications.markAllRead')}
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="empty-state-large">
                    <span className="empty-icon">🔔</span>
                    <h2>{t('notifications.noNotifications')}</h2>
                    <p>{t('dashboard.noNotifications')}</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map(notif => (
                        <div
                            key={notif._id}
                            className={`notification-card card ${notif.isRead ? 'read' : 'unread'} ${getNotificationColor(notif.type)}`}
                        >
                            <div className="notif-icon">
                                {getNotificationIcon(notif.type)}
                            </div>
                            <div className="notif-content">
                                <h3>{notif.title}</h3>
                                <p>{notif.message}</p>
                                {notif.relatedChild && (
                                    <span className="notif-child">👶 {notif.relatedChild.name}</span>
                                )}
                                <span className="notif-time">{formatDate(notif.createdAt)}</span>
                            </div>
                            <div className="notif-actions">
                                {!notif.isRead && (
                                    <button
                                        className="btn-icon"
                                        title={t('notifications.markAllRead')}
                                        onClick={() => handleMarkAsRead(notif._id)}
                                    >
                                        ✓
                                    </button>
                                )}
                                <button
                                    className="btn-icon danger"
                                    title={t('delete')}
                                    onClick={() => handleDelete(notif._id)}
                                >
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
