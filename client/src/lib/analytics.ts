import ReactGA from 'react-ga4';

// Replace with your actual Measurement ID from Google Analytics 4 property
// Format: G-XXXXXXXXXX
const MEASUREMENT_ID = 'G-XXXXXXXXXX';

let isInitialized = false;

/**
 * Initialize Google Analytics 4
 * This should only be called if the user has consented to cookies.
 */
export const initGA = () => {
  if (!isInitialized) {
    ReactGA.initialize(MEASUREMENT_ID);
    isInitialized = true;
    console.log('GA4 Initialized');
  }
};

/**
 * Log a page view
 * @param path The current path (e.g., /match/123)
 */
export const logPageView = (path: string) => {
  if (!isInitialized) return;
  
  ReactGA.send({ hitType: "pageview", page: path });
};

/**
 * Log a custom event
 * @param category The event category (e.g., "User", "Interaction")
 * @param action The specific action (e.g., "Login", "Click Match")
 * @param label Optional label for more detail
 * @param value Optional numeric value
 */
export const logEvent = (category: string, action: string, label?: string, value?: number) => {
  if (!isInitialized) return;

  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

/**
 * Check if GA is initialized
 */
export const isGAInitialized = () => isInitialized;
