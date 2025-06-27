import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import VendorDashboard from './pages/VendorDashboard';
import PublicMapPage from './pages/PublicMapPage';
import PrivateRoute from './components/PrivateRoute';
import LanguageSelector from './components/LanguageSelector';

function App() {
  return (
    <>
      <LanguageSelector />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/vendor"
          element={
            <PrivateRoute>
              <VendorDashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<PublicMapPage />} />
      </Routes>
    </>
  );
}

export default App;
