import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Phone, Key, ChevronRight, User as UserIcon, Mail } from 'lucide-react';
import { User } from '../types';
import { requestOTP, verifyOTP, completeOnboarding, fetchWebsiteConfig } from '../src/api';
import { getOptimizedUrl } from '../src/utils/cloudinary';

interface AuthPageProps {
  setUser: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ setUser }) => {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Onboarding
  const navigate = useNavigate();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(30);
  const [resendActive, setResendActive] = useState(false);
  const [webImageConfig, setWebImageConfig] = useState<{ desktopImage: string, mobileImage: string } | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await fetchWebsiteConfig('web_image');
        if (config) setWebImageConfig(config);
      } catch (err) {
        console.error("Failed to load banner config", err);
      }
    };
    loadConfig();
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!phone || phone.length < 10) {
        setError('Please enter a valid phone number');
        return;
      }
      setLoading(true);
      try {
        await requestOTP(phone);
        setStep(2);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      const otpString = otp.join('');
      if (otpString.length < 6) {
        setError('Please enter the complete 6-digit OTP');
        return;
      }
      setLoading(true);
      try {
        const response = await verifyOTP(phone, otpString);
        const { user, isNewUser } = response;
        
        // Map _id to id for frontend compatibility
        const mappedUser = { ...user, id: user._id || user.id };
        
        if (isNewUser) {
          setTempUser(mappedUser);
          setStep(3);
        } else {
          setUser(mappedUser);
          navigate('/');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Verification failed. Please check your OTP.');
      } finally {
        setLoading(false);
      }
    } else if (step === 3) {
      if (!name || !email) {
        setError('Please provide your name and email to continue.');
        return;
      }
      if (!tempUser) return;

      setLoading(true);
      try {
        const updatedUser = await completeOnboarding(tempUser.id, name, email);
        const mappedUser = { ...updatedUser, id: updatedUser._id || updatedUser.id };
        setUser(mappedUser);
        navigate('/');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to complete profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (step !== 2) return;
    if (resendActive) return;
    if (resendSeconds <= 0) {
      setResendActive(true);
      return;
    }
    const timer = setTimeout(() => {
      setResendSeconds((s) => s - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [step, resendSeconds, resendActive]);

  const handleResend = async () => {
    if (!resendActive) return;
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await requestOTP(phone);
      setResendSeconds(30);
      setResendActive(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-heading relative overflow-hidden">
      
      {/* Promotional Banner Background */}
      {webImageConfig && (webImageConfig.desktopImage || webImageConfig.mobileImage) ? (
        <picture className="absolute inset-0 z-0">
          <source media="(max-width: 767px)" srcSet={getOptimizedUrl(webImageConfig.mobileImage || webImageConfig.desktopImage)} />
          <img
            src={getOptimizedUrl(webImageConfig.desktopImage || webImageConfig.mobileImage)}
            alt="Authentication Background"
            className="w-full h-full object-cover"
          />
          {/* Subtle overlay to ensure the login box remains readable */}
          <div className="absolute inset-0 bg-transparent"></div>
        </picture>
      ) : (
        /* Fallback Decorative background elements */
        <>
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#d3ebda] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </>
      )}

      <div className="max-w-md w-full relative z-10">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#d3ebda] to-pink rounded-3xl blur opacity-30 animate-pulse"></div>
        
        <div className="relative bg-white/30 backdrop-blur-xl border border-white/50 p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col items-center mb-12">
            <div className="bg-[#d3ebda] p-4 rounded-2xl mb-6 shadow-sm">
              <ShieldCheck className="w-10 h-10 text-[#03401b]" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-center text-[#03401b]">
              {step === 1 ? 'Login / Join' : step === 2 ? 'Verify Identity' : 'Complete Profile'}
            </h1>
            <p className="text-red-600 text-[10px] mt-2 font-black uppercase tracking-[0.3em]">
              {step === 3 ? 'Finalizing Details' : 'Secure Authentication'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-500 text-xs font-bold text-center rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#03401b] font-black">Credential Source</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  <input 
                    type="tel" 
                    name="phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="Phone Number" 
                    className="w-full bg-white/80 backdrop-blur-md border border-red-500 text-[#03401b] font-bold px-12 py-4 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all text-sm" 
                  />
                </div>
              </div>
            ) : step === 2 ? (
              <div className="space-y-6">
                <p className="text-center text-xs text-zinc-500 font-medium">We've dispatched a secure 6-digit code to {phone}. Enter it below.</p>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, i) => (
                    <input 
                      key={i}
                      id={`otp-${i}`}
                      type="text" 
                      maxLength={1} 
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="w-12 h-14 bg-white/80 backdrop-blur-md border border-red-500 text-center text-xl font-black focus:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:outline-none rounded-lg text-[#03401b]" 
                    />
                  ))}
                </div>
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!resendActive || loading}
                    className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${
                      resendActive
                        ? 'border-pink text-pink hover:bg-pink/5'
                        : 'border-zinc-200 text-zinc-400'
                    } disabled:opacity-60`}
                  >
                    {resendActive ? 'Resend OTP' : `Resend in ${resendSeconds}s`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#03401b] font-black">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name" 
                      className="w-full bg-white/80 backdrop-blur-md border border-red-500 text-[#03401b] font-bold px-12 py-4 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all text-sm" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#03401b] font-black">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com" 
                      className="w-full bg-white/80 backdrop-blur-md border border-red-500 text-[#03401b] font-bold px-12 py-4 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all text-sm" 
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#03401b] text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-zinc-800 focus:ring-4 focus:ring-[#03401b]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : (step === 1 ? 'Get OTP' : step === 2 ? 'Verify & Continue' : 'Create Account')}</span>
              {!loading && <ChevronRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            {step === 2 && (
              <button 
                onClick={() => setStep(1)}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-pink transition-colors"
              >
                Change Phone Number
              </button>
            )}
            {step === 1 && (
              <p className="text-[10px] font-black uppercase tracking-widest text-black">
                A unique profile will be established for new members
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
