import { useState, useEffect } from 'react';
import { announcementsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import './AnnouncementBanner.css';

const AnnouncementBanner = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState([]);
    const { t } = useLanguage();
    const { user } = useAuth();

    // Generate a unique storage key per user
    const getStorageKey = () => {
        if (user?._id) {
            return `dismissedAnnouncements_${user._id}`;
        }
        return 'dismissedAnnouncements_guest';
    };

    useEffect(() => {
        if (user) {
            fetchAnnouncements();
        }
    }, [user]);

    const fetchAnnouncements = async () => {
        try {
            const data = await announcementsAPI.getActive();
            // Filter out dismissed announcements for THIS user (from localStorage with user ID)
            const storageKey = getStorageKey();
            const dismissedIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const filtered = data.filter(a => !dismissedIds.includes(a._id));
            setAnnouncements(filtered);
            setDismissed(dismissedIds);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        }
    };

    const handleDismiss = (id) => {
        const newDismissed = [...dismissed, id];
        setDismissed(newDismissed);
        // Store dismissed IDs with user-specific key
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(newDismissed));
        setAnnouncements(announcements.filter(a => a._id !== id));
        // Reset index if needed
        if (currentIndex >= announcements.length - 1) {
            setCurrentIndex(0);
        }
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    };

    const getTypeIcon = (type) => {
        const icons = {
            info: '📢',
            warning: '⚠️',
            alert: '🚨',
            success: '✅'
        };
        return icons[type] || '📢';
    };

    const getTypeClass = (type) => {
        const classes = {
            info: 'banner-info',
            warning: 'banner-warning',
            alert: 'banner-alert',
            success: 'banner-success'
        };
        return classes[type] || 'banner-info';
    };

    if (announcements.length === 0) return null;

    const current = announcements[currentIndex];
    if (!current) return null;

    return (
        <div className={`announcement-banner ${getTypeClass(current.type)} ${current.isPinned ? 'pinned' : ''}`}>
            <div className="banner-content">
                <span className="banner-icon">{getTypeIcon(current.type)}</span>
                <div className="banner-text">
                    <strong>{current.title}</strong>
                    <span className="banner-message">{current.message}</span>
                </div>
            </div>
            <div className="banner-actions">
                {announcements.length > 1 && (
                    <div className="banner-nav">
                        <button className="nav-btn" onClick={handlePrev}>‹</button>
                        <span className="nav-count">{currentIndex + 1}/{announcements.length}</span>
                        <button className="nav-btn" onClick={handleNext}>›</button>
                    </div>
                )}
                <button
                    className="dismiss-btn"
                    onClick={() => handleDismiss(current._id)}
                    title={t('close')}
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default AnnouncementBanner;
