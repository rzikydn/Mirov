import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, AtSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BmsrBg from '../assets/BMSR.svg';
import Char3 from '../assets/Char3svgh.svg';
import bsmrLogo from '../assets/bsmr-logo.svg';

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
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail) {
      setFormData(prev => ({ 
        ...prev, 
        email: savedEmail,
        password: savedPassword || ''
      }));
      setRememberMe(true);
    }

    const handlePopState = () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        navigate('/dashboard', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
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

      const userData = data.data?.user || data.user;
      const tokenData = data.data?.token || data.token;

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
        localStorage.setItem('rememberedPassword', formData.password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }

      setUser(userData);
      setToken(tokenData);

      localStorage.setItem("token", tokenData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("lastActivity", Date.now().toString());

      setShowSuccessToast(true);

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setMessage({ type: "error", text: errorMessage });
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-start lg:justify-between px-0 lg:px-6 md:px-16 lg:pl-6 lg:pr-28 bg-[#0066FF] lg:bg-transparent lg:bg-cover lg:bg-center lg:bg-no-repeat"
      style={isMobile ? {} : { backgroundImage: `url(${BmsrBg})` }}
    >
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-fit max-w-[340px] gap-6 bg-[#E8F8F0] border border-[#A2E0C1] rounded-xl px-4 py-2.5 shadow-lg shadow-black/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center shadow-sm">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <span className="text-[#065F46] font-jakarta font-medium text-[14px]">
                Login successful!
              </span>
            </div>
            <button 
              onClick={() => setShowSuccessToast(false)}
              className="text-[#047857] hover:text-[#065F46] transition-colors p-1 rounded-full hover:bg-[#D1FAE5]/60"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile Header Banner: Top illustration area */}
      {isMobile && (
        <div className="w-full pt-10 pb-6 flex flex-col items-center justify-center" />
      )}

      {/* Left Side: Character Illustration */}
      <div className="hidden lg:flex w-[62%] items-center justify-start overflow-visible">
        <img 
          src={Char3} 
          alt="Illustration" 
          className="max-h-[90vh] w-full object-contain select-none pointer-events-none transform lg:translate-y-2 lg:-translate-x-14"
        />
      </div>

      {/* Right Side: Form wrapped in a white card container on mobile */}
      <div className="w-full lg:max-w-[500px] flex flex-col justify-center bg-white lg:bg-transparent rounded-t-[40px] px-6 lg:px-0 pt-8 pb-12 lg:pb-0 flex-1 transform lg:-translate-y-8">
        <div className="w-full max-w-[500px] mx-auto flex flex-col justify-center">
        {/* Header Texts */}
        <div className="text-left lg:text-right mb-6">
          {/* Logo */}
          <div className="flex justify-start lg:justify-end mb-1.5">
            <img 
              src={bsmrLogo} 
              alt="BSMR Logo" 
              className="h-10 w-auto select-none pointer-events-none" 
            />
          </div>
          <h1 className="font-montserrat text-2xl lg:text-[36px] font-extrabold text-[#0066FF] tracking-tight leading-none">Welcome</h1>
          <p className="font-lora text-xl lg:text-2xl text-[#FF725E] mt-1 lg:mt-0.5 font-medium italic leading-none">Lets Get Started Now!</p>
          <p className="font-jakarta text-[13px] text-gray-500 mt-4 font-normal leading-relaxed max-w-[440px] ml-0 lg:ml-auto">
            Securely sign in to track real time operational workflows, monitor systemic database, and manage institutional risk management certification programs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Input */}
          <div className="relative">
            <input
              type="text"
              name="mirov-username"
              autoComplete="off"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder=" "
              className={`peer w-full pl-4 pr-12 py-3.5 border rounded-xl bg-white focus:bg-white focus:ring-1 focus:ring-[#FF725E] focus:border-[#FF725E] transition-all outline-none text-gray-800 text-sm ${
                errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
              }`}
            />
            <label
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-sm bg-white px-1.5 transition-all duration-200 pointer-events-none
                         peer-focus:top-0 peer-focus:text-xs peer-focus:text-[#FF725E]
                         peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs
                         ${errors.email ? 'peer-focus:text-red-500 text-red-500' : 'text-gray-400'}`}
            >
              User
            </label>
            <span className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none peer-focus:text-[#FF725E] ${
              errors.email ? 'text-red-400' : 'text-gray-400'
            }`}>
              <AtSign className="w-5 h-5" />
            </span>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 pl-1">{errors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type="text"
              name="mirov-password"
              autoComplete="off"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder=" "
              className={`peer w-full pl-4 pr-12 py-3.5 border rounded-xl bg-white focus:bg-white focus:ring-1 focus:ring-[#FF725E] focus:border-[#FF725E] transition-all outline-none text-gray-800 text-sm ${
                errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
              }`}
              style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' } as React.CSSProperties}
            />
            <label
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-sm bg-white px-1.5 transition-all duration-200 pointer-events-none
                         peer-focus:top-0 peer-focus:text-xs peer-focus:text-[#FF725E]
                         peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs
                         ${errors.password ? 'peer-focus:text-red-500 text-red-500' : 'text-gray-400'}`}
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors focus:outline-none peer-focus:text-[#FF725E] ${
                errors.password ? 'text-red-400' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {showPassword ? <Eye className="w-5 h-5 text-[#FF725E]" /> : <Lock className="w-5 h-5" />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 pl-1">{errors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-start pl-1 mt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#0066FF] focus:ring-[#0066FF] focus:ring-opacity-20 accent-[#0066FF] cursor-pointer"
              />
              <span className="text-xs text-gray-500 font-jakarta group-hover:text-gray-700 transition-colors">
                Remember Me
              </span>
            </label>
          </div>

          {/* Alert Message */}
          {message && message.type === 'error' && (
            <div
              className="p-3.5 rounded-xl text-sm border bg-red-50 text-red-700 border-red-200"
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF725E] hover:bg-[#e8604c] text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-[#FF725E]/20 hover:shadow-[#FF725E]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
        </div>
      </div>
    </div>
  );
}