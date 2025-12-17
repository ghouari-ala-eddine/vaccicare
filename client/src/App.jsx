import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Verify2FA from './pages/auth/Verify2FA';
import ParentDashboard from './pages/dashboard/ParentDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ChildrenList from './pages/children/ChildrenList';
import AddChild from './pages/children/AddChild';
import ChildDetail from './pages/children/ChildDetail';
import PatientsList from './pages/patients/PatientsList';
import AppointmentsList from './pages/appointments/AppointmentsList';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ProfilePage from './pages/profile/ProfilePage';
import UsersManagement from './pages/admin/UsersManagement';
import AnnouncementsManagement from './pages/announcements/AnnouncementsManagement';
import AnnouncementBanner from './components/AnnouncementBanner';
import InstallPrompt from './components/InstallPrompt';
import Footer from './components/Footer';
import ChatPage from './pages/chat/ChatPage';
import DoctorSchedulePage from './pages/schedule/DoctorSchedulePage';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Chargement...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (roles && !roles.includes(user?.role)) {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

// Dashboard Router (redirects based on role)
const DashboardRouter = () => {
    const { user } = useAuth();

    if (user?.role === 'admin') {
        return <AdminDashboard />;
    }

    if (user?.role === 'doctor') {
        return <DoctorDashboard />;
    }

    return <ParentDashboard />;
};

// Home Route (redirects based on auth status)
const HomeRoute = () => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return <Navigate to="/login" />;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Chargement...</p>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

// Layout with Navbar
const Layout = ({ children }) => {
    return (
        <>
            <Navbar />
            <main className="container">
                <AnnouncementBanner />
                {children}
            </main>
            <Footer />
            <InstallPrompt />
        </>
    );
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomeRoute />} />
            <Route path="/login" element={
                <PublicRoute>
                    <Login />
                </PublicRoute>
            } />
            <Route path="/register" element={
                <PublicRoute>
                    <Register />
                </PublicRoute>
            } />
            <Route path="/verify-2fa" element={<Verify2FA />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Layout>
                        <DashboardRouter />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Children Routes (Parents) */}
            <Route path="/children" element={
                <ProtectedRoute roles={['parent']}>
                    <Layout>
                        <ChildrenList />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/children/add" element={
                <ProtectedRoute roles={['parent']}>
                    <Layout>
                        <AddChild />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/children/:id" element={
                <ProtectedRoute roles={['parent', 'doctor', 'admin']}>
                    <Layout>
                        <ChildDetail />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Patients Route (Doctors) */}
            <Route path="/patients" element={
                <ProtectedRoute roles={['doctor', 'admin']}>
                    <Layout>
                        <PatientsList />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Appointments Routes */}
            <Route path="/appointments" element={
                <ProtectedRoute>
                    <Layout>
                        <AppointmentsList />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/appointments/new" element={
                <ProtectedRoute roles={['parent']}>
                    <Layout>
                        <AppointmentsList />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Notifications */}
            <Route path="/notifications" element={
                <ProtectedRoute>
                    <Layout>
                        <NotificationsPage />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Chat */}
            <Route path="/chat" element={
                <ProtectedRoute roles={['parent', 'doctor']}>
                    <Layout>
                        <ChatPage />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Doctor Schedule */}
            <Route path="/schedule" element={
                <ProtectedRoute roles={['doctor']}>
                    <Layout>
                        <DoctorSchedulePage />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Admin - Users Management */}
            <Route path="/admin/users" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <UsersManagement />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Admin - Announcements Management */}
            <Route path="/admin/announcements" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <AnnouncementsManagement />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Profile */}
            <Route path="/profile" element={
                <ProtectedRoute>
                    <Layout>
                        <ProfilePage />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <LanguageProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </LanguageProvider>
        </BrowserRouter>
    );
}

export default App;
