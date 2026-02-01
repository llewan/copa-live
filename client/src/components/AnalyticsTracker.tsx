import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '@/lib/analytics';

/**
 * Component that tracks page views automatically on route change.
 * Should be placed inside the Router provider.
 */
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

export default AnalyticsTracker;
