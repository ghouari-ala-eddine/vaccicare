import { useState, useEffect } from 'react';
import { notesAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import './DoctorNotes.css';

const DoctorNotes = ({ childId }) => {
    const { t, language } = useLanguage();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [formData, setFormData] = useState({
        content: '',
        category: 'general'
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, [childId]);

    const fetchNotes = async () => {
        try {
            const data = await notesAPI.getByChild(childId);
            setNotes(data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.content.trim()) return;

        setSaving(true);
        try {
            if (editingNote) {
                await notesAPI.update(editingNote._id, formData);
            } else {
                await notesAPI.create({
                    childId,
                    ...formData
                });
            }
            fetchNotes();
            resetForm();
        } catch (error) {
            console.error('Error saving note:', error);
            alert(t('messages.error'));
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (note) => {
        setEditingNote(note);
        setFormData({
            content: note.content,
            category: note.category
        });
        setShowAddForm(true);
    };

    const handleDelete = async (noteId) => {
        if (window.confirm(t('notes.confirmDelete'))) {
            try {
                await notesAPI.delete(noteId);
                fetchNotes();
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({ content: '', category: 'general' });
        setEditingNote(null);
        setShowAddForm(false);
    };

    const formatDate = (date) => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(date).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryIcon = (category) => {
        const icons = {
            general: '📋',
            vaccination: '💉',
            allergy: '⚠️',
            treatment: '💊',
            followup: '🔄',
            other: '📝'
        };
        return icons[category] || '📋';
    };

    if (loading) {
        return (
            <div className="doctor-notes-loading">
                <div className="spinner-small"></div>
            </div>
        );
    }

    return (
        <div className="doctor-notes-section">
            <div className="section-header">
                <h3>📋 {t('notes.title')}</h3>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddForm(true)}
                >
                    + {t('notes.add')}
                </button>
            </div>

            <p className="notes-privacy-info">
                🔒 {t('notes.privacyInfo')}
            </p>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="note-form card">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">{t('notes.category')}</label>
                            <select
                                className="form-input form-select"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="general">{t('notes.categories.general')}</option>
                                <option value="vaccination">{t('notes.categories.vaccination')}</option>
                                <option value="allergy">{t('notes.categories.allergy')}</option>
                                <option value="treatment">{t('notes.categories.treatment')}</option>
                                <option value="followup">{t('notes.categories.followup')}</option>
                                <option value="other">{t('notes.categories.other')}</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('notes.content')} *</label>
                            <textarea
                                className="form-input"
                                rows="4"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder={t('notes.contentPlaceholder')}
                                required
                            ></textarea>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                {t('cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? '...' : (editingNote ? t('save') : t('notes.add'))}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Notes List */}
            {notes.length === 0 ? (
                <div className="no-notes">
                    <span>📋</span>
                    <p>{t('notes.noNotes')}</p>
                </div>
            ) : (
                <div className="notes-list">
                    {notes.map(note => (
                        <div key={note._id} className="note-card">
                            <div className="note-header">
                                <span className="note-category">
                                    {getCategoryIcon(note.category)} {t(`notes.categories.${note.category}`)}
                                </span>
                                <span className="note-date">{formatDate(note.createdAt)}</span>
                            </div>
                            <div className="note-content">
                                {note.content}
                            </div>
                            <div className="note-footer">
                                <span className="note-author">
                                    👨‍⚕️ Dr. {note.doctor?.name}
                                </span>
                                <div className="note-actions">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleEdit(note)}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(note._id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorNotes;
