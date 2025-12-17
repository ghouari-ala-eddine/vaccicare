import { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import './Users.css';

const UsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const { t, language } = useLanguage();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await usersAPI.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (userId) => {
        try {
            await usersAPI.toggleActive(userId);
            fetchUsers();
        } catch (error) {
            console.error('Error toggling user:', error);
            alert(t('messages.error') + ': ' + error.message);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await usersAPI.update(userId, { role: newRole });
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Error updating role:', error);
            alert(t('messages.error') + ': ' + error.message);
        }
    };

    const formatDate = (date) => {
        const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';
        return new Date(date).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getRoleBadge = (role) => {
        const roles = {
            parent: { class: 'badge-primary', text: `👨‍👩‍👧 ${t('auth.parent')}` },
            doctor: { class: 'badge-success', text: `👨‍⚕️ ${t('auth.doctor')}` },
            admin: { class: 'badge-warning', text: `🔑 ${t('auth.admin')}` }
        };
        return roles[role] || { class: 'badge-gray', text: role };
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearch;
        if (filter === 'active') return matchesSearch && user.isActive;
        if (filter === 'inactive') return matchesSearch && !user.isActive;
        if (filter === 'parent' || filter === 'doctor' || filter === 'admin') {
            return matchesSearch && user.role === filter;
        }
        return matchesSearch;
    });

    const stats = {
        total: users.length,
        parents: users.filter(u => u.role === 'parent').length,
        doctors: users.filter(u => u.role === 'doctor').length,
        admins: users.filter(u => u.role === 'admin').length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length
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
        <div className="users-page container">
            <div className="page-header">
                <div>
                    <h1>👥 {t('users.title')}</h1>
                    <p className="text-muted">{t('users.subtitle')}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="users-stats">
                <div className="stat-card primary">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3>{stats.total}</h3>
                        <p>{t('users.totalUsers')}</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">👨‍👩‍👧</div>
                    <div className="stat-content">
                        <h3>{stats.parents}</h3>
                        <p>{t('users.parents')}</p>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon">👨‍⚕️</div>
                    <div className="stat-content">
                        <h3>{stats.doctors}</h3>
                        <p>{t('users.doctors')}</p>
                    </div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon">🚫</div>
                    <div className="stat-content">
                        <h3>{stats.inactive}</h3>
                        <p>{t('users.inactive')}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="users-filters card">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="form-input"
                        placeholder={t('users.searchUsers')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        {t('all')}
                    </button>
                    <button
                        className={`filter-btn ${filter === 'parent' ? 'active' : ''}`}
                        onClick={() => setFilter('parent')}
                    >
                        {t('users.parents')}
                    </button>
                    <button
                        className={`filter-btn ${filter === 'doctor' ? 'active' : ''}`}
                        onClick={() => setFilter('doctor')}
                    >
                        {t('users.doctors')}
                    </button>
                    <button
                        className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
                        onClick={() => setFilter('inactive')}
                    >
                        {t('users.inactive')}
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="users-table-container card">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>{t('auth.name')}</th>
                            <th>{t('auth.email')}</th>
                            <th>{t('users.role')}</th>
                            <th>{t('users.status')}</th>
                            <th>{t('users.registeredOn')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user._id} className={!user.isActive ? 'inactive-row' : ''}>
                                <td>
                                    <div className="user-cell">
                                        <span className="user-avatar">
                                            {user.role === 'doctor' ? '👨‍⚕️' : user.role === 'admin' ? '🔑' : '👤'}
                                        </span>
                                        <div className="user-info">
                                            <strong>{user.name}</strong>
                                            {user.phone && <small>📞 {user.phone}</small>}
                                        </div>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    {editingUser === user._id ? (
                                        <select
                                            className="role-select"
                                            defaultValue={user.role}
                                            onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                                            onBlur={() => setEditingUser(null)}
                                            autoFocus
                                        >
                                            <option value="parent">{t('auth.parent')}</option>
                                            <option value="doctor">{t('auth.doctor')}</option>
                                            <option value="admin">{t('auth.admin')}</option>
                                        </select>
                                    ) : (
                                        <span
                                            className={`badge ${getRoleBadge(user.role).class} clickable`}
                                            onClick={() => setEditingUser(user._id)}
                                            title={t('users.changeRole')}
                                        >
                                            {getRoleBadge(user.role).text}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    {user.isActive ? (
                                        <span className="badge badge-success">✓ {t('users.active')}</span>
                                    ) : (
                                        <span className="badge badge-danger">✗ {t('users.inactive')}</span>
                                    )}
                                </td>
                                <td>{formatDate(user.createdAt)}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                                            onClick={() => handleToggleActive(user._id)}
                                            title={user.isActive ? t('users.deactivate') : t('users.activate')}
                                        >
                                            {user.isActive ? `🚫 ${t('users.deactivate')}` : `✓ ${t('users.activate')}`}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="users-legend card">
                <h3>💡 {t('users.quickTips')}</h3>
                <ul>
                    <li>{t('users.tipRoles')}</li>
                    <li>{t('users.tipStatus')}</li>
                </ul>
            </div>
        </div>
    );
};

export default UsersManagement;
