const API_URL = '/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        },
        ...options
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        // Check if response is empty
        const text = await response.text();
        if (!text) {
            throw new Error('Le serveur ne répond pas. Vérifiez que MongoDB est en cours d\'exécution.');
        }

        const data = JSON.parse(text);

        if (!response.ok) {
            throw new Error(data.message || 'Une erreur est survenue');
        }

        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré.');
        }
        throw error;
    }
};

// Auth API
export const authAPI = {
    register: (userData) => apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),

    login: (credentials) => apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),

    getProfile: () => apiCall('/auth/me'),

    updateProfile: (data) => apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    getDoctors: () => apiCall('/auth/doctors'),

    // 2FA
    verify2FA: (userId, code) => apiCall('/auth/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({ userId, code })
    }),

    resend2FA: (userId) => apiCall('/auth/resend-2fa', {
        method: 'POST',
        body: JSON.stringify({ userId })
    }),

    toggle2FA: () => apiCall('/auth/toggle-2fa', {
        method: 'PUT'
    })
};

// Children API
export const childrenAPI = {
    getAll: () => apiCall('/children'),

    getOne: (id) => apiCall(`/children/${id}`),

    create: (data) => apiCall('/children', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    update: (id, data) => apiCall(`/children/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    delete: (id) => apiCall(`/children/${id}`, {
        method: 'DELETE'
    })
};

// Vaccines API
export const vaccinesAPI = {
    getAll: () => apiCall('/vaccines'),

    getOne: (id) => apiCall(`/vaccines/${id}`),

    create: (data) => apiCall('/vaccines', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    update: (id, data) => apiCall(`/vaccines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    delete: (id) => apiCall(`/vaccines/${id}`, {
        method: 'DELETE'
    }),

    seed: () => apiCall('/vaccines/seed', {
        method: 'POST'
    })
};

// Vaccinations API
export const vaccinationsAPI = {
    getByChild: (childId) => apiCall(`/vaccinations/child/${childId}`),

    update: (id, data) => apiCall(`/vaccinations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    getUpcoming: () => apiCall('/vaccinations/upcoming'),

    getDelayed: () => apiCall('/vaccinations/delayed'),

    getStats: () => apiCall('/vaccinations/stats')
};

// Appointments API
export const appointmentsAPI = {
    getAll: () => apiCall('/appointments'),

    getOne: (id) => apiCall(`/appointments/${id}`),

    create: (data) => apiCall('/appointments', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    update: (id, data) => apiCall(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    delete: (id) => apiCall(`/appointments/${id}`, {
        method: 'DELETE'
    }),

    getPending: () => apiCall('/appointments/pending'),

    getToday: () => apiCall('/appointments/today')
};

// Notifications API
export const notificationsAPI = {
    getAll: () => apiCall('/notifications'),

    markAsRead: (id) => apiCall(`/notifications/${id}/read`, {
        method: 'PUT'
    }),

    markAllAsRead: () => apiCall('/notifications/read-all', {
        method: 'PUT'
    }),

    delete: (id) => apiCall(`/notifications/${id}`, {
        method: 'DELETE'
    })
};

// Side Effects API
export const sideEffectsAPI = {
    getAll: (status) => apiCall(`/side-effects${status ? `?status=${status}` : ''}`),

    getByChild: (childId) => apiCall(`/side-effects/child/${childId}`),

    report: (data) => apiCall('/side-effects', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    review: (id, data) => apiCall(`/side-effects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
};

// Users API (Admin)
export const usersAPI = {
    getAll: () => apiCall('/auth/users'),

    update: (id, data) => apiCall(`/auth/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    toggleActive: (id) => apiCall(`/auth/users/${id}/toggle`, {
        method: 'PUT'
    })
};

// Announcements API
export const announcementsAPI = {
    getActive: () => apiCall('/announcements'),

    getAll: () => apiCall('/announcements/all'),

    create: (data) => apiCall('/announcements', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    update: (id, data) => apiCall(`/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    delete: (id) => apiCall(`/announcements/${id}`, {
        method: 'DELETE'
    }),

    toggle: (id) => apiCall(`/announcements/${id}/toggle`, {
        method: 'PATCH'
    })
};

// Chat API
export const chatAPI = {
    getConversations: () => apiCall('/chat/conversations'),

    getMessages: (conversationId, page = 1) =>
        apiCall(`/chat/conversations/${conversationId}/messages?page=${page}`),

    sendMessage: (conversationId, content) => apiCall(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
    }),

    startConversation: (recipientId) => apiCall('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipientId })
    }),

    getDoctors: () => apiCall('/chat/doctors'),

    getUnreadCount: () => apiCall('/chat/unread')
};

// Doctor Notes API
export const notesAPI = {
    getByChild: (childId) => apiCall(`/notes/child/${childId}`),

    create: (data) => apiCall('/notes', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    update: (id, data) => apiCall(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    delete: (id) => apiCall(`/notes/${id}`, {
        method: 'DELETE'
    })
};

// Lab Results API
export const labResultsAPI = {
    getByChild: (childId) => apiCall(`/lab-results/child/${childId}`),

    getOne: (id) => apiCall(`/lab-results/${id}`),

    upload: (data) => apiCall('/lab-results', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    review: (id, data) => apiCall(`/lab-results/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    delete: (id) => apiCall(`/lab-results/${id}`, {
        method: 'DELETE'
    })
};

// Doctor Schedule API
export const scheduleAPI = {
    getAvailableDoctors: (date) => apiCall(`/schedules/available${date ? `?date=${date}` : ''}`),

    getMySchedule: (startDate, endDate) => {
        let query = '';
        if (startDate) query += `?startDate=${startDate}`;
        if (endDate) query += `${query ? '&' : '?'}endDate=${endDate}`;
        return apiCall(`/schedules/my-schedule${query}`);
    },

    getDoctorSchedule: (doctorId, startDate, endDate) => {
        let query = '';
        if (startDate) query += `?startDate=${startDate}`;
        if (endDate) query += `${query ? '&' : '?'}endDate=${endDate}`;
        return apiCall(`/schedules/doctor/${doctorId}${query}`);
    },

    createOrUpdate: (data) => apiCall('/schedules', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    delete: (id) => apiCall(`/schedules/${id}`, {
        method: 'DELETE'
    }),

    bookSlot: (scheduleId, slotId) => apiCall(`/schedules/${scheduleId}/book/${slotId}`, {
        method: 'POST'
    }),

    cancelBooking: (scheduleId, slotId) => apiCall(`/schedules/${scheduleId}/book/${slotId}`, {
        method: 'DELETE'
    })
};

