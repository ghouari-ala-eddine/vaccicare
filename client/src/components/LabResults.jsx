import { useState, useEffect } from 'react';
import { labResultsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './LabResults.css';

const LabResults = ({ childId }) => {
    const { isDoctor, isAdmin } = useAuth();
    const { t, language } = useLanguage();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        testType: 'other',
        testDate: new Date().toISOString().split('T')[0],
        file: null
    });
    const [reviewData, setReviewData] = useState({
        status: 'pending',
        doctorComments: ''
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchResults();
    }, [childId]);

    const fetchResults = async () => {
        try {
            const data = await labResultsAPI.getByChild(childId);
            setResults(data);
        } catch (error) {
            console.error('Error fetching lab results:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert(t('labResults.fileTooLarge'));
                return;
            }

            // Read file as base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({
                    ...formData,
                    file: {
                        data: reader.result,
                        name: file.name,
                        type: file.type,
                        size: file.size
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.testDate || !formData.file) {
            alert(t('labResults.requiredFields'));
            return;
        }

        setUploading(true);
        try {
            await labResultsAPI.upload({
                childId,
                title: formData.title,
                description: formData.description,
                testType: formData.testType,
                testDate: formData.testDate,
                fileData: formData.file.data,
                fileName: formData.file.name,
                fileType: formData.file.type,
                fileSize: formData.file.size
            });
            fetchResults();
            resetForm();
        } catch (error) {
            console.error('Error uploading:', error);
            alert(t('messages.error'));
        } finally {
            setUploading(false);
        }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        try {
            await labResultsAPI.review(showReviewModal._id, reviewData);
            fetchResults();
            setShowReviewModal(null);
            setReviewData({ status: 'pending', doctorComments: '' });
        } catch (error) {
            console.error('Error reviewing:', error);
            alert(t('messages.error'));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('labResults.confirmDelete'))) {
            try {
                await labResultsAPI.delete(id);
                fetchResults();
                setSelectedResult(null);
            } catch (error) {
                console.error('Error deleting:', error);
            }
        }
    };

    const handleViewFile = async (result) => {
        try {
            const fullResult = await labResultsAPI.getOne(result._id);
            setSelectedResult(fullResult);
        } catch (error) {
            console.error('Error loading file:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            testType: 'other',
            testDate: new Date().toISOString().split('T')[0],
            file: null
        });
        setShowUploadForm(false);
    };

    const formatDate = (date) => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(date).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTestTypeIcon = (type) => {
        const icons = {
            blood: '🩸',
            urine: '🧪',
            xray: '📷',
            scan: '🔬',
            allergy: '⚠️',
            genetic: '🧬',
            other: '📋'
        };
        return icons[type] || '📋';
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'status-pending', label: t('labResults.status.pending') },
            reviewed: { class: 'status-reviewed', label: t('labResults.status.reviewed') },
            normal: { class: 'status-normal', label: t('labResults.status.normal') },
            abnormal: { class: 'status-abnormal', label: t('labResults.status.abnormal') }
        };
        return badges[status] || badges.pending;
    };

    if (loading) {
        return (
            <div className="lab-results-loading">
                <div className="spinner-small"></div>
            </div>
        );
    }

    return (
        <div className="lab-results-section">
            <div className="section-header">
                <h3>🔬 {t('labResults.title')}</h3>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowUploadForm(true)}
                >
                    + {t('labResults.upload')}
                </button>
            </div>

            {/* Upload Form */}
            {showUploadForm && (
                <div className="lab-upload-form card">
                    <form onSubmit={handleUpload}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">{t('labResults.testTitle')} *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={t('labResults.titlePlaceholder')}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('labResults.testDate')} *</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.testDate}
                                    onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">{t('labResults.testType')}</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.testType}
                                    onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                                >
                                    <option value="blood">{t('labResults.types.blood')}</option>
                                    <option value="urine">{t('labResults.types.urine')}</option>
                                    <option value="xray">{t('labResults.types.xray')}</option>
                                    <option value="scan">{t('labResults.types.scan')}</option>
                                    <option value="allergy">{t('labResults.types.allergy')}</option>
                                    <option value="genetic">{t('labResults.types.genetic')}</option>
                                    <option value="other">{t('labResults.types.other')}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('labResults.file')} *</label>
                                <input
                                    type="file"
                                    className="form-input"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    required
                                />
                                <small className="form-hint">{t('labResults.fileHint')}</small>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('labResults.description')}</label>
                            <textarea
                                className="form-input"
                                rows="2"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t('labResults.descriptionPlaceholder')}
                            ></textarea>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                {t('cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={uploading}>
                                {uploading ? '...' : t('labResults.upload')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Results List */}
            {results.length === 0 ? (
                <div className="no-results">
                    <span>🔬</span>
                    <p>{t('labResults.noResults')}</p>
                </div>
            ) : (
                <div className="results-list">
                    {results.map(result => {
                        const statusBadge = getStatusBadge(result.status);
                        return (
                            <div key={result._id} className="result-card">
                                <div className="result-icon">
                                    {getTestTypeIcon(result.testType)}
                                </div>
                                <div className="result-info">
                                    <h4>{result.title}</h4>
                                    <div className="result-meta">
                                        <span>{t(`labResults.types.${result.testType}`)}</span>
                                        <span>•</span>
                                        <span>{formatDate(result.testDate)}</span>
                                    </div>
                                    {result.description && (
                                        <p className="result-description">{result.description}</p>
                                    )}
                                </div>
                                <div className="result-actions">
                                    <span className={`status-badge ${statusBadge.class}`}>
                                        {statusBadge.label}
                                    </span>
                                    <div className="action-buttons">
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleViewFile(result)}
                                        >
                                            👁️ {t('view')}
                                        </button>
                                        {(isDoctor || isAdmin) && (
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => {
                                                    setShowReviewModal(result);
                                                    setReviewData({
                                                        status: result.status,
                                                        doctorComments: result.doctorComments || ''
                                                    });
                                                }}
                                            >
                                                ✏️ {t('labResults.review')}
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(result._id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                {/* Doctor Comments - visible to everyone */}
                                {result.doctorComments && (
                                    <div className="result-doctor-comments">
                                        <strong>👨‍⚕️ {t('labResults.doctorComments')}:</strong>
                                        <p>{result.doctorComments}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* View File Modal */}
            {selectedResult && (
                <div className="modal-overlay" onClick={() => setSelectedResult(null)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">📄 {selectedResult.title}</h2>
                            <button className="modal-close" onClick={() => setSelectedResult(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {selectedResult.fileData && (
                                <div className="file-preview">
                                    {selectedResult.fileType?.includes('image') ? (
                                        <img src={selectedResult.fileData} alt={selectedResult.title} />
                                    ) : selectedResult.fileType?.includes('pdf') ? (
                                        <iframe
                                            src={selectedResult.fileData}
                                            title={selectedResult.title}
                                            width="100%"
                                            height="500px"
                                        />
                                    ) : (
                                        <a href={selectedResult.fileData} download={selectedResult.fileName}>
                                            📥 {t('labResults.download')}
                                        </a>
                                    )}
                                </div>
                            )}
                            {selectedResult.doctorComments && (
                                <div className="doctor-comments">
                                    <h4>👨‍⚕️ {t('labResults.doctorComments')}</h4>
                                    <p>{selectedResult.doctorComments}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">✏️ {t('labResults.reviewTitle')}</h2>
                            <button className="modal-close" onClick={() => setShowReviewModal(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleReview}>
                                <div className="form-group">
                                    <label className="form-label">{t('labResults.resultStatus')}</label>
                                    <select
                                        className="form-input form-select"
                                        value={reviewData.status}
                                        onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                                    >
                                        <option value="pending">{t('labResults.status.pending')}</option>
                                        <option value="reviewed">{t('labResults.status.reviewed')}</option>
                                        <option value="normal">{t('labResults.status.normal')}</option>
                                        <option value="abnormal">{t('labResults.status.abnormal')}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('labResults.doctorComments')}</label>
                                    <textarea
                                        className="form-input"
                                        rows="4"
                                        value={reviewData.doctorComments}
                                        onChange={(e) => setReviewData({ ...reviewData, doctorComments: e.target.value })}
                                        placeholder={t('labResults.commentsPlaceholder')}
                                    ></textarea>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowReviewModal(null)}>
                                        {t('cancel')}
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {t('save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabResults;
