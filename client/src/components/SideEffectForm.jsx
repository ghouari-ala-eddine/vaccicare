import { useState } from 'react';
import { sideEffectsAPI } from '../services/api';
import './SideEffectForm.css';

const SYMPTOMS_OPTIONS = [
    { value: 'fever', label: '🌡️ Fièvre' },
    { value: 'swelling', label: '💪 Gonflement au site d\'injection' },
    { value: 'redness', label: '🔴 Rougeur' },
    { value: 'pain', label: '😣 Douleur' },
    { value: 'fatigue', label: '😴 Fatigue' },
    { value: 'headache', label: '🤕 Maux de tête' },
    { value: 'nausea', label: '🤢 Nausées' },
    { value: 'vomiting', label: '🤮 Vomissements' },
    { value: 'rash', label: '🔵 Éruption cutanée' },
    { value: 'allergic', label: '⚠️ Réaction allergique' },
    { value: 'other', label: '❓ Autre' }
];

const SideEffectForm = ({ child, vaccination, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        symptoms: [],
        severity: 'mild',
        description: '',
        onsetDate: new Date().toISOString().split('T')[0],
        duration: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSymptomToggle = (symptom) => {
        setFormData(prev => ({
            ...prev,
            symptoms: prev.symptoms.includes(symptom)
                ? prev.symptoms.filter(s => s !== symptom)
                : [...prev.symptoms, symptom]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.symptoms.length === 0) {
            setError('Veuillez sélectionner au moins un symptôme');
            return;
        }

        setLoading(true);
        try {
            await sideEffectsAPI.report({
                childId: child._id,
                vaccinationId: vaccination._id,
                vaccineId: vaccination.vaccine._id,
                ...formData
            });
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.message || 'Erreur lors du signalement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="side-effect-modal">
                <div className="modal-header">
                    <h2>⚠️ Signaler un effet secondaire</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-info">
                    <p><strong>Enfant:</strong> {child.name}</p>
                    <p><strong>Vaccin:</strong> {vaccination.vaccine.name} (Dose {vaccination.doseNumber})</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="form-group">
                        <label>Symptômes observés *</label>
                        <div className="symptoms-grid">
                            {SYMPTOMS_OPTIONS.map(symptom => (
                                <button
                                    key={symptom.value}
                                    type="button"
                                    className={`symptom-btn ${formData.symptoms.includes(symptom.value) ? 'selected' : ''}`}
                                    onClick={() => handleSymptomToggle(symptom.value)}
                                >
                                    {symptom.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Gravité *</label>
                            <div className="severity-options">
                                <button
                                    type="button"
                                    className={`severity-btn mild ${formData.severity === 'mild' ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, severity: 'mild' })}
                                >
                                    😊 Légère
                                </button>
                                <button
                                    type="button"
                                    className={`severity-btn moderate ${formData.severity === 'moderate' ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, severity: 'moderate' })}
                                >
                                    😐 Modérée
                                </button>
                                <button
                                    type="button"
                                    className={`severity-btn severe ${formData.severity === 'severe' ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, severity: 'severe' })}
                                >
                                    😰 Sévère
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Date d'apparition *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.onsetDate}
                                onChange={(e) => setFormData({ ...formData, onsetDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Durée (optionnel)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="ex: 2 jours, quelques heures"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description détaillée (optionnel)</label>
                        <textarea
                            className="form-input"
                            rows="3"
                            placeholder="Décrivez les symptômes en détail..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="btn btn-warning" disabled={loading}>
                            {loading ? 'Envoi...' : '⚠️ Signaler'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SideEffectForm;
