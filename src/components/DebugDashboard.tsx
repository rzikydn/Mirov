import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DebugDashboard() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, canManageSchedules, hasRole, logout } = useAuth();
  const [localUser, setLocalUser] = useState<any>(null);
  const [localToken, setLocalToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    console.log('🔍 Debug Dashboard loaded');
    console.log('📦 localStorage user:', storedUser);
    console.log('📦 localStorage token:', storedToken);

    if (storedUser) {
      try {
        setLocalUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    setLocalToken(storedToken);

    if (!storedToken) {
      console.log('❌ No token found, redirecting to /auth');
      navigate('/auth');
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">🔍 Debug Dashboard</h1>

        <div className="space-y-6">
          {/* Auth Context State */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Auth Context State</h2>
            <div className="space-y-2 text-sm font-mono">
              <p><span className="font-bold">isAuthenticated:</span> {isAuthenticated ? '✅ true' : '❌ false'}</p>
              <p><span className="font-bold">user:</span> {user ? JSON.stringify(user, null, 2) : '❌ null'}</p>
              <p><span className="font-bold">token:</span> {token ? '✅ exists' : '❌ null'}</p>
            </div>
          </div>

          {/* LocalStorage State */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h2 className="text-xl font-semibold mb-3 text-blue-900">LocalStorage State</h2>
            <div className="space-y-2 text-sm font-mono">
              <p><span className="font-bold">user:</span></p>
              <pre className="bg-white p-2 rounded border text-xs overflow-auto">
                {localUser ? JSON.stringify(localUser, null, 2) : '❌ null'}
              </pre>
              <p><span className="font-bold">token:</span> {localToken ? '✅ exists' : '❌ null'}</p>
            </div>
          </div>

          {/* RBAC Functions */}
          {user && (
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h2 className="text-xl font-semibold mb-3 text-green-900">RBAC Functions Test</h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-bold">canManageSchedules():</span> {canManageSchedules() ? '✅ true' : '❌ false'}</p>
                <p><span className="font-bold">hasRole(['SUPERUSER']):</span> {hasRole(['SUPERUSER']) ? '✅ true' : '❌ false'}</p>
                <p><span className="font-bold">hasRole(['ADMIN']):</span> {hasRole(['ADMIN']) ? '✅ true' : '❌ false'}</p>
                <p><span className="font-bold">hasRole(['UMUM']):</span> {hasRole(['UMUM']) ? '✅ true' : '❌ false'}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Go to Real Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              Logout
            </button>
          </div>

          {/* Console Reminder */}
          <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <p className="text-yellow-900 text-sm">
              💡 <strong>Tip:</strong> Buka browser DevTools Console (F12) untuk melihat log detail
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
