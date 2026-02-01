import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Dashboard from './pages/Dashboard';
import MatchDetail from './pages/MatchDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Preferences from './pages/Preferences';
import Layout from './components/Layout';
import { useAuthStore } from './store/authStore';
import { usePreferenceStore } from './store/preferenceStore';
import AnalyticsTracker from './components/AnalyticsTracker';
import CookieConsent from './components/CookieConsent';

const App = () => {
  const { user, checkAuth } = useAuthStore();
  const { preferences, loadPreferences } = usePreferenceStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Load preferences when user is authenticated
  useEffect(() => {
    if (user) {
      loadPreferences(user.id);
    }
  }, [user, loadPreferences]);

  // Sync language with preferences
  useEffect(() => {
    if (preferences.language && i18n.language !== preferences.language) {
      i18n.changeLanguage(preferences.language);
    }
  }, [preferences.language, i18n]);

  return (
    <HelmetProvider>
      <CookieConsent />
      <Router>
        <AnalyticsTracker />
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/preferences" element={<Preferences />} />
          </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}

export default App;
