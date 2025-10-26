import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function AuthPage() {
  const { setUser, setToken } = useAuth();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'User is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'min 8 chars';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }

      setMessage({ 
        type: "success", 
        text: 'Login successful!'
      });

      setUser(data.user);
      setToken(data.token);
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        navigate("/dashboard");
      }, 800);

    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Mirov Logo SVG
  const LogoSVG = (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#2563EB" />
      <path d="M2 17L12 22L22 17" fill="#3B82F6" opacity="0.7" />
      <path d="M2 12L12 17L22 12" fill="#2563EB" opacity="0.85" />
    </svg>
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-8 px-6 lg:px-12 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            {LogoSVG}
            <span className="text-xl font-bold text-gray-900">Mirov</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Get Started Now
            </h1>
            <p className="text-gray-600">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your username"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  Remember me
                </span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot password?
              </a>
            </div>

            {/* Error/Success Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 rounded-lg text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-12">
            2025 Mirov, All right Reserved
          </p>
        </motion.div>
      </div>

      {/* Right Side - Dashboard Preview */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-xl flex flex-col justify-start pt-0"
        >
          {/* Header Text - Single line */}
          <div className="mb-3 text-right pr-4">
            <p className="text-blue-200 text-sm">
              The simplest way to manage your workspace
            </p>
          </div>

          {/* Dashboard Preview Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-transform duration-300">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-3xl font-bold text-gray-900">Morning Team!</h3>
                <p className="text-sm text-gray-500">Last edited 2 hours ago</p>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full" />
                <div className="w-8 h-8 bg-blue-500 rounded-full" />
                <div className="w-8 h-8 bg-cyan-500 rounded-full" />
              </div>
            </div>

            {/* Notes Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-3xl font-bold text-gray-900">Notes</h4>
                <button className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                  +
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  readOnly
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Notes Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Note 1 - Yellow */}
                <div className="bg-yellow-100 rounded-xl p-4 relative group hover:shadow-lg transition-shadow">
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <span className="text-yellow-400 text-sm">★</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mb-8 line-clamp-3">
                    beginning of screenless design: UI jobs to be taken over...
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">May 21, 2020</span>
                    <button className="w-6 h-6 bg-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Note 2 - Coral */}
                <div className="bg-red-200 rounded-xl p-4 relative group hover:shadow-lg transition-shadow">
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <span className="text-yellow-400 text-sm">★</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mb-8 line-clamp-3">
                    13 Things You Should Give Up If You Want To Be a Successful...
                  </p>
                  <span className="text-xs text-gray-600">May 25, 2020</span>
                </div>

                {/* Note 3 - Green */}
                <div className="bg-green-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-gray-800 mb-8 line-clamp-3">
                    The Psychology Principles Every UI/UX Designer Needs to Know
                  </p>
                  <span className="text-xs text-gray-600">June 5, 2020</span>
                </div>

                {/* Note 4 - Purple */}
                <div className="bg-purple-200 rounded-xl p-4 relative group hover:shadow-lg transition-shadow">
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <span className="text-yellow-400 text-sm">★</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mb-2">
                    10 UI & UX Lessons
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}