import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios.js';

const QRDisplay = () => {
  const [qrToken, setQrToken] = useState('');
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchToken = async () => {
    try {
      const response = await api.get('/api/qr/current');
      setQrToken(response.data.token);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError('Failed to fetch QR code. Please check your connection.');
      console.error('QR fetch error:', err);
    }
  };

  useEffect(() => {
    fetchToken();
    intervalRef.current = setInterval(fetchToken, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Live QR Code</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Employees should scan this code to check in or check out
        </p>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={fetchToken}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : qrToken ? (
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white border-4 border-blue-600 rounded-xl shadow-md">
              <QRCodeSVG
                value={qrToken}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">
                Auto-refreshes every 2 seconds
              </span>
            </div>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm w-full">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">How it works</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>1. Display this QR code on your screen</li>
          <li>2. Each employee scans the code from their device</li>
          <li>3. First scan = Check-in, second scan = Check-out</li>
          <li>4. Code refreshes automatically after each scan</li>
        </ul>
      </div>
    </div>
  );
};

export default QRDisplay;
