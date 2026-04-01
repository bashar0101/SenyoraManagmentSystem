import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NotFound = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (role === 'manager') navigate('/manager');
    else if (role === 'employee') navigate('/employee');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
