import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios.js';

const QRDisplay = () => {
  const [qrToken, setQrToken] = useState('');
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);
  const { t } = useTranslation();

  const fetchToken = async () => {
    try {
      const response = await api.get('/api/qr/current');
      setQrToken(response.data.token);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError(t('qrDisplay.fetchError'));
      console.error('QR fetch error:', err);
    }
  };

  useEffect(() => {
    fetchToken();
    intervalRef.current = setInterval(fetchToken, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-2">{t('qrDisplay.title')}</h2>
        <p className="text-sm text-gray-500 text-center mb-6">{t('qrDisplay.subtitle')}</p>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={fetchToken} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
              {t('qrDisplay.retry')}
            </button>
          </div>
        ) : qrToken ? (
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white border-4 border-blue-600 rounded-xl shadow-md">
              <QRCodeSVG value={qrToken} size={220} level="H" includeMargin={false} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">{t('qrDisplay.autoRefresh')}</span>
            </div>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-1">
                {t('qrDisplay.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">{t('qrDisplay.howItWorks')}</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>1. {t('qrDisplay.step1')}</li>
          <li>2. {t('qrDisplay.step2')}</li>
          <li>3. {t('qrDisplay.step3')}</li>
          <li>4. {t('qrDisplay.step4')}</li>
        </ul>
      </div>
    </div>
  );
};

export default QRDisplay;
