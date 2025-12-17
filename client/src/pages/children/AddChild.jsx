import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { childrenAPI } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import './Children.css';

const AddChild = () => {
    const [formData, setFormData] = useState({
        name: '',
        birthDate: '',
        gender: 'male',
        bloodType: '',
        allergies: '',
        notes: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await childrenAPI.create(formData);
            const childId = result.child?._id || result._id;
            navigate(`/children/${childId}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-child-page container">
            <div className="page-header">
                <div>
                    <h1>👶 {t('children.addChild')}</h1>
                    <p className="text-muted">{t('children.childInfo')}</p>
                </div>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit} className="child-form card">
                    {error && (
                        <div className="alert alert-danger">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="form-section">
                        <h3>📋 {t('profile.personalInfo')}</h3>

                        <div className="form-group">
                            <label className="form-label">{t('children.fullName')} *</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder={t('children.name')}
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">{t('children.birthDate')} *</label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    className="form-input"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    max={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('children.gender')} *</label>
                                <div className="gender-selector">
                                    <button
                                        type="button"
                                        className={`gender-btn ${formData.gender === 'male' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, gender: 'male' })}
                                    >
                                        👦 {t('children.male')}
                                    </button>
                                    <button
                                        type="button"
                                        className={`gender-btn ${formData.gender === 'female' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, gender: 'female' })}
                                    >
                                        👧 {t('children.female')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>🏥 {t('children.childInfo')}</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">{t('children.bloodType')}</label>
                                <select
                                    name="bloodType"
                                    className="form-input form-select"
                                    value={formData.bloodType}
                                    onChange={handleChange}
                                >
                                    <option value="">{t('search')}...</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('children.allergies')}</label>
                                <input
                                    type="text"
                                    name="allergies"
                                    className="form-input"
                                    placeholder={t('children.allergies')}
                                    value={formData.allergies}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('children.notes')}</label>
                            <textarea
                                name="notes"
                                className="form-input"
                                rows="3"
                                placeholder={t('children.notes')}
                                value={formData.notes}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/children')}
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? t('loading') : `✓ ${t('save')}`}
                        </button>
                    </div>
                </form>

                <div className="info-panel">
                    <div className="info-card">
                        <h4>💡 {t('dashboard.quickTips')}</h4>
                        <p>{t('dashboard.tip1Text')}</p>
                    </div>
                    <div className="info-card">
                        <h4>📅 {t('vaccinations.title')}</h4>
                        <ul>
                            <li>BCG</li>
                            <li>Hépatite B</li>
                            <li>DTP-Hib-HepB</li>
                            <li>Polio</li>
                            <li>Rougeole-Rubéole</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddChild;
