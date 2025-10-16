import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Shield, Zap, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


type AuthMode = 'login' | 'register';


interface FormData {
  name: string;
  email: string;
  password: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();


  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (authMode === 'register' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage(null);

  if (!validateForm()) return;

  setIsLoading(true);

  setTimeout(() => {
    setMessage({
      type: 'success',
      text: authMode === 'login'
        ? 'Login successful!'
        : 'Account created successfully!'
    });
    setIsLoading(false);

    // ✅ Arahkan ke dashboard setelah login sukses
    if (authMode === 'login') {
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    }
  }, 1500);
};


  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrors({});
    setMessage(null);
  };

  const LogoSVG = (
    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background tetap - tidak akan hilang */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 -z-10" />
      
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">

        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="hidden lg:block relative"
        >
          <div className="relative z-10">
            {/* Logo Desktop */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                {LogoSVG}
              </div>
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Mirov
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-5xl font-bold text-slate-800 mb-4 leading-tight "
            >
              Transform Your
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent playwrite-de-sas-light">
                Digital Experience
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg text-slate-600 mb-12 leading-relaxed"
            >
              Join thousands of users who trust Mirov for secure, innovative, and seamless solutions
            </motion.p>

            {/* Feature List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="space-y-6"
            >
              {[{ icon: Shield, text: 'Bank-level security & encryption' },
                { icon: Zap, text: 'Lightning-fast performance' },
                { icon: User, text: 'Intuitive & modern interface' }].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.15, duration: 0.5 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-slate-700 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Background Decorations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/30 via-cyan-400/20 to-blue-500/30 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-10 w-[900px] h-[900px] bg-gradient-to-tl from-cyan-400/20 via-blue-400/30 to-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute inset-0 bg-[linear-radient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 p-8 md:p-12 border border-white/60">



            {/* Mobile Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex lg:hidden items-center justify-center gap-3 mb-8"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                {LogoSVG}
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Mirov
              </span>
            </motion.div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 rounded-xl">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  authMode === 'login'
                    ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  authMode === 'register'
                    ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>

            {/* Form Header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-bold text-slate-800 mb-2">
                  {authMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
                </h2>
                <p className="text-slate-600">
                  {authMode === 'login'
                    ? 'Enter your credentials to access your account'
                    : 'Join us today and start your journey'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {authMode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="John Doe"
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all outline-none ${
                          errors.name
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-slate-200 focus:border-blue-500'
                        } bg-white/50 focus:bg-white`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1.5">{errors.name}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all outline-none ${
                      errors.email
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-slate-200 focus:border-blue-500'
                    } bg-white/50 focus:bg-white`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1.5">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all outline-none ${
                      errors.password
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-slate-200 focus:border-blue-500'
                    } bg-white/50 focus:bg-white`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1.5">{errors.password}</p>
                )}
              </div>

              {/* Message */}
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-xl ${
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
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : authMode === 'login' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </motion.button>

              {/* Forgot Password */}
              {authMode === 'login' && (
                <button
                  type="button"
                  className="w-full text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot your password?
                </button>
              )}
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-600">
              <p>
                By continuing, you agree to Mirov's{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}