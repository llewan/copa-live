import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { initGA } from '@/lib/analytics';

const CookieConsent = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent === 'true') {
      initGA();
    } else if (consent === null) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    initGA();
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-gray-700 text-sm leading-relaxed">
            {t('cookie_consent.message', 'Utilizamos cookies para analizar el tráfico y mejorar su experiencia. ¿Acepta el uso de cookies de Google Analytics?')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            {t('cookie_consent.decline', 'Rechazar')}
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-sm"
          >
            {t('cookie_consent.accept', 'Aceptar')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
