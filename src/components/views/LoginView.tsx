import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

export function LoginView() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLoginIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginId(e.target.value);
    setError('');
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginId.trim() === '') {
      setError('Login ID is required.');
      return;
    }
    if (password.length < 3) {
      setError('Password is required.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Invalid OTP. Please enter a 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      await login(loginId, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-slate-900 flex items-center justify-center rounded-sm">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-serif font-bold text-slate-900 tracking-tight">
          DRISHTI System
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Secure Access Portal {step === 2 && ' - Two-Factor Authentication'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-sm sm:px-10">
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleStep1Submit}>
              <div>
                <label htmlFor="loginId" className="block text-sm font-medium text-slate-900">
                  Login ID
                </label>
                <div className="mt-1">
                  <input
                    id="loginId"
                    name="loginId"
                    type="text"
                    required
                    placeholder="e.g. user_nodal_1"
                    value={loginId}
                    onChange={handleLoginIdChange}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-900 focus:border-slate-900 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-900">
                  Secure Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-900 focus:border-slate-900 sm:text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-sm bg-red-50 p-4 border border-red-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleStep2Submit}>
              <div className="text-center mb-6">
                <KeyRound className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-sm text-slate-600">
                  Enter the 6-digit verification code sent to your registered secure device.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  (Simulation: enter any 6-digit code)
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="sr-only">
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value); setError(''); }}
                    className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-900 focus:border-slate-900 sm:text-lg text-center tracking-[0.5em] font-mono"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-sm bg-red-50 p-4 border border-red-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="w-1/3 flex justify-center py-2 px-4 border border-slate-300 rounded-sm shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-500 font-mono">
            Unauthorised access is strictly prohibited.
          </div>
        </div>
      </div>
    </div>
  );
}
