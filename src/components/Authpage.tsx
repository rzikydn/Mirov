import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
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

      setMessage({
        type: "success",
        text: 'Login successful!'
      });

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      setUser(userData);
      setToken(tokenData);

      localStorage.setItem("token", tokenData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("lastActivity", Date.now().toString());

      setTimeout(() => {
        navigate("/dashboard");
      }, 800);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setMessage({ type: "error", text: errorMessage });
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

  return (
    <div 
      className="min-h-screen w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-start lg:justify-between px-0 lg:px-6 md:px-16 lg:pl-6 lg:pr-28 bg-[#0066FF] lg:bg-transparent"
      style={isMobile ? {} : { backgroundImage: `url(${BmsrBg})` }}
    >
      {/* Mobile Header Banner: Top illustration area */}
      {isMobile && (
        <div className="w-full pt-10 pb-6 flex flex-col items-center justify-center" />
      )}

      {/* Left Side: Character Illustration */}
      <div className="hidden lg:flex w-[62%] items-center justify-start overflow-visible">
        <img 
          src={Char3} 
          alt="Illustration" 
          className="max-h-[90vh] w-full object-contain select-none pointer-events-none transform lg:-translate-y-4 lg:-translate-x-14"
        />
      </div>

      {/* Right Side: Form wrapped in a white card container on mobile */}
      <div className="w-full lg:max-w-[500px] flex flex-col justify-center bg-white lg:bg-transparent rounded-t-[40px] px-6 lg:px-0 pt-8 pb-12 lg:pb-0 flex-1">
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
          <h1 className="font-montserrat text-3xl lg:text-[42px] font-extrabold text-[#0066FF] tracking-tight leading-none">Welcome</h1>
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
                className="w-4 h-4 rounded border-gray-300 text-[#FF725E] focus:ring-[#FF725E] focus:ring-opacity-20 accent-[#FF725E] cursor-pointer"
              />
              <span className="text-xs text-gray-500 font-jakarta group-hover:text-gray-700 transition-colors">
                Remember Me
              </span>
            </label>
          </div>

          {/* Alert Message */}
          {message && (
            <div
              className={`p-3.5 rounded-xl text-sm border ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
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