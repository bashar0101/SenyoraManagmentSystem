import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import api from '../api/axios.js';

const SCANNER_ID = 'qr-scanner-container';
const FILE_READER_ID = 'qr-file-reader';

const QRScanner = () => {
  const [mode, setMode] = useState('camera');
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [lastAction, setLastAction] = useState(null);
  const [uploading, setUploading] = useState(false);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setMessage('');
    setMessageType('');
    const config = { fps: 10, qrbox: { width: 200, height: 200 } };
    const onSuccess = async (decodedText) => {
      await stopScanner();
      await handleScan(decodedText);
    };

    html5QrCodeRef.current = new Html5Qrcode(SCANNER_ID);

    try {
      await html5QrCodeRef.current.start({ facingMode: 'environment' }, config, onSuccess, () => {});
      setScanning(true);
    } catch {
      try {
        await html5QrCodeRef.current.start({ facingMode: 'user' }, config, onSuccess, () => {});
        setScanning(true);
      } catch (err) {
        try { html5QrCodeRef.current.clear(); } catch {}
        html5QrCodeRef.current = null;
        setMessage(err.message?.includes('permission')
          ? t('qrScanner.permissionDenied')
          : `${t('qrScanner.permissionDenied')}: ${err.message || ''}`
        );
        setMessageType('error');
        setScanning(false);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    setMessage('');
    setMessageType('');
    try {
      const scanner = new Html5Qrcode(FILE_READER_ID);
      const decodedText = await scanner.scanFile(file, false);
      await handleScan(decodedText);
    } catch {
      setMessage(t('qrScanner.readError'));
      setMessageType('error');
    } finally {
      setUploading(false);
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
      setMessage(err.response?.data?.message || 'Scan failed. Please try again.');
      setMessageType('error');
    }
  };

  const switchMode = async (newMode) => {
    if (scanning) await stopScanner();
    setMessage('');
    setMessageType('');
    setLastAction(null);
    setMode(newMode);
  };

  useEffect(() => { return () => { stopScanner(); }; }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-1">{t('qrScanner.title')}</h2>
        <p className="text-sm text-gray-500 text-center mb-5">{t('qrScanner.subtitle')}</p>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
          <button
            onClick={() => switchMode('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'camera' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('qrScanner.camera')}
          </button>
          <button
            onClick={() => switchMode('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'upload' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {t('qrScanner.upload')}
          </button>
        </div>

        {/* Result message */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg text-center text-sm ${
            messageType === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="text-2xl mb-1">
              {messageType === 'success' ? (lastAction === 'check-in' ? '🟢' : '🔵') : '❌'}
            </div>
            <p className="font-medium">{message}</p>
            {lastAction && (
              <p className="text-xs mt-1 opacity-75">
                {lastAction === 'check-in' ? t('qrScanner.checkInNote') : t('qrScanner.checkOutNote')}
              </p>
            )}
          </div>
        )}

        {/* Camera mode */}
        {mode === 'camera' && (
          <>
            <div className="relative w-full rounded-xl overflow-hidden bg-gray-900" style={{ minHeight: '260px' }}>
              <div id={SCANNER_ID} className="w-full" />
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-xl">
                  <div className="text-5xl mb-3">📷</div>
                  <p className="text-sm text-gray-500">{t('qrScanner.cameraPreview')}</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              {!scanning ? (
                <button onClick={startScanner} className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors">
                  {t('qrScanner.startScanning')}
                </button>
              ) : (
                <button onClick={stopScanner} className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 active:bg-gray-800 transition-colors">
                  {t('qrScanner.stopScanning')}
                </button>
              )}
            </div>
          </>
        )}

        {/* Upload mode */}
        {mode === 'upload' && (
          <>
            <div id={FILE_READER_ID} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3 text-blue-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm font-medium">{t('qrScanner.readingQr')}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm font-medium text-gray-600">{t('qrScanner.tapToChoose')}</p>
                  <p className="text-xs text-gray-400">{t('qrScanner.uploadHint')}</p>
                </div>
              )}
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 w-full">
        <h3 className="text-sm font-semibold text-green-800 mb-2">{t('qrScanner.instructions')}</h3>
        {mode === 'camera' ? (
          <ul className="text-xs text-green-700 space-y-1">
            <li>1. {t('qrScanner.cameraStep1')}</li>
            <li>2. {t('qrScanner.cameraStep2')}</li>
            <li>3. {t('qrScanner.cameraStep3')}</li>
            <li>4. {t('qrScanner.cameraStep4')}</li>
          </ul>
        ) : (
          <ul className="text-xs text-green-700 space-y-1">
            <li>1. {t('qrScanner.uploadStep1')}</li>
            <li>2. {t('qrScanner.uploadStep2')}</li>
            <li>3. {t('qrScanner.uploadStep3')}</li>
            <li>4. {t('qrScanner.uploadStep4')}</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
