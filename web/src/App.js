import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ClientLoginPage from './pages/ClientLoginPage';
import ClientRegisterPage from './pages/ClientRegisterPage';
import VendorDashboard from './pages/VendorDashboard';
import ClientDashboardPage from './pages/ClientDashboardPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import RoutesPage from './pages/RoutesPage';
import RouteDetailPage from './pages/RouteDetailPage';
import StatsPage from './pages/StatsPage';
import PaidWeeksPage from './pages/PaidWeeksPage';
import ManageAccountPage from './pages/ManageAccountPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import VendorDetailPage from './pages/VendorDetailPage';
import PublicMapPage from './pages/PublicMapPage';
import PrivateRoute from './components/PrivateRoute';
import LanguageSelector from './components/LanguageSelector';

// App
function App() {
  return (
    <>
      <LanguageSelector />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />
        <Route path="/client/login" element={<ClientLoginPage />} />
        <Route path="/client/register" element={<ClientRegisterPage />} />
        <Route path="/client" element={<ClientDashboardPage />} />
        <Route
          path="/vendor"
          element={
            <PrivateRoute>
              <VendorDashboard />
            </PrivateRoute>
          }
        />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/:id" element={<RouteDetailPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/paid" element={<PaidWeeksPage />} />
        <Route path="/manage" element={<ManageAccountPage />} />
        <Route path="/settings" element={<AccountSettingsPage />} />
        <Route path="/vendor/:id" element={<VendorDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<PublicMapPage />} />
      </Routes>
    </>
  );
}

export default App;
