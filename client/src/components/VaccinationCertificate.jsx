import { useState, useRef } from 'react';
import './Certificate.css';

const VaccinationCertificate = ({ child, vaccinations, onClose }) => {
    const certificateRef = useRef(null);
    const [printing, setPrinting] = useState(false);

    const completedVaccinations = vaccinations.filter(v => v.status === 'completed');
    const today = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const calculateAge = (birthDate) => {
        const birth = new Date(birthDate);
        const today = new Date();
        const months = (today.getFullYear() - birth.getFullYear()) * 12 +
            (today.getMonth() - birth.getMonth());
        if (months < 12) return `${months} mois`;
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return remainingMonths > 0 ? `${years} an(s) et ${remainingMonths} mois` : `${years} an(s)`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handlePrint = () => {
        setPrinting(true);
        setTimeout(() => {
            window.print();
            setPrinting(false);
        }, 100);
    };

    return (
        <div className="certificate-overlay">
            <div className="certificate-container">
                <div className="certificate-actions no-print">
                    <button className="btn btn-primary" onClick={handlePrint} disabled={printing}>
                        🖨️ {printing ? 'Impression...' : 'Imprimer'}
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        ✕ Fermer
                    </button>
                </div>

                <div ref={certificateRef} className="certificate" id="certificate">
                    {/* Header */}
                    <div className="certificate-header">
                        <div className="certificate-logo">💉</div>
                        <h1>Carnet de Vaccination</h1>
                        <p className="certificate-subtitle">Système de Gestion des Vaccinations - VacciCare</p>
                    </div>

                    {/* Child Info */}
                    <div className="certificate-child-info">
                        <div className="child-photo">
                            {child.gender === 'male' ? '👦' : '👧'}
                        </div>
                        <div className="child-details">
                            <h2>{child.name}</h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Date de naissance:</span>
                                    <span className="info-value">{formatDate(child.birthDate)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Âge:</span>
                                    <span className="info-value">{calculateAge(child.birthDate)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Sexe:</span>
                                    <span className="info-value">{child.gender === 'male' ? 'Masculin' : 'Féminin'}</span>
                                </div>
                                {child.bloodType && (
                                    <div className="info-item">
                                        <span className="info-label">Groupe sanguin:</span>
                                        <span className="info-value">{child.bloodType}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Vaccination History */}
                    <div className="certificate-vaccinations">
                        <h3>📋 Historique des Vaccinations</h3>

                        {completedVaccinations.length === 0 ? (
                            <p className="no-vaccinations">Aucune vaccination enregistrée</p>
                        ) : (
                            <table className="vaccinations-table">
                                <thead>
                                    <tr>
                                        <th>Vaccin</th>
                                        <th>Dose</th>
                                        <th>Date d'administration</th>
                                        <th>Médecin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {completedVaccinations.map((vax, index) => (
                                        <tr key={index}>
                                            <td><strong>{vax.vaccine?.name || 'N/A'}</strong></td>
                                            <td>Dose {vax.doseNumber}</td>
                                            <td>{vax.administeredDate ? formatDate(vax.administeredDate) : formatDate(vax.scheduledDate)}</td>
                                            <td>{vax.doctor?.name ? `Dr. ${vax.doctor.name}` : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="certificate-summary">
                        <div className="summary-item">
                            <span className="summary-value">{completedVaccinations.length}</span>
                            <span className="summary-label">Vaccinations effectuées</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-value">{vaccinations.filter(v => v.status === 'scheduled').length}</span>
                            <span className="summary-label">Vaccinations planifiées</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-value">{vaccinations.filter(v => v.status === 'delayed').length}</span>
                            <span className="summary-label">En retard</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="certificate-footer">
                        <p>Document généré le {today}</p>
                        <p className="certificate-note">
                            Ce document est un extrait du carnet de vaccination électronique.
                            Pour toute information complémentaire, veuillez contacter votre médecin.
                        </p>
                        <div className="certificate-stamp">
                            <span>VacciCare</span>
                            <span>✓ Certifié</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VaccinationCertificate;
