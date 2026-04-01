import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/axios.js';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [lastAction, setLastAction] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const scannerDivId = 'qr-scanner-container';

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setMessage('');
    setMessageType('');

    try {
      html5QrCodeRef.current = new Html5Qrcode(scannerDivId);

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          await stopScanner();
          await handleScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors (scanning in progress)
        }
      );

      setScanning(true);
    } catch (err) {
      setMessage(`Camera error: ${err.message || 'Could not access camera. Please allow camera permission.'}`);
      setMessageType('error');
      setScanning(false);
    }
  };

  const handleScan = async (token) => {
    try {
      const response = await api.post('/api/qr/scan', { token });
      const { message: msg, action } = response.data;
      setMessage(msg);
      setMessageType('success');
      setLastAction(action);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Scan failed. Please try again.';
      setMessage(errorMsg);
      setMessageType('error');
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Scan QR Code</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Point your camera at the QR code displayed on the manager's screen
        </p>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg text-center ${
              messageType === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            <div className="text-2xl mb-1">
              {messageType === 'success' ? (lastAction === 'check-in' ? '🟢' : '🔵') : '❌'}
            </div>
            <p className="font-medium">{message}</p>
            {lastAction && (
              <p className="text-xs mt-1 opacity-75">
                {lastAction === 'check-in' ? 'Your attendance has been recorded' : 'Your work session has been completed'}
              </p>
            )}
          </div>
        )}

        <div
          id={scannerDivId}
          ref={scannerRef}
          className={`w-full rounded-xl overflow-hidden ${scanning ? 'border-2 border-blue-400' : 'bg-gray-100 h-48 flex items-center justify-center'}`}
        >
          {!scanning && (
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm">Camera preview will appear here</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          {!scanning ? (
            <button
              onClick={startScanner}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Stop Scanning
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm w-full">
        <h3 className="text-sm font-semibold text-green-800 mb-2">Instructions</h3>
        <ul className="text-xs text-green-700 space-y-1">
          <li>1. Click "Start Scanning" and allow camera access</li>
          <li>2. Point your camera at the manager's QR code</li>
          <li>3. Hold steady until the code is detected</li>
          <li>4. First scan checks you in, second checks you out</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;
