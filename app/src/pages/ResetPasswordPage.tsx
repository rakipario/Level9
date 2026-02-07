import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, Loader2, Lock } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'invalid'>('form');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
      } else {
        setError(data.error || 'Failed to reset password');
        if (data.error?.includes('invalid') || data.error?.includes('expired')) {
          setStatus('invalid');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-subtle)] to-white pointer-events-none" />
        
        <header className="p-6 relative">
          <div className="container-wide flex items-center justify-between">
            <Link to="/" className="text-[16px] font-medium tracking-tight">
              Relay
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-12 px-6 relative">
          <div className="w-full max-w-[420px] text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-[24px] font-medium text-[var(--text)] mb-3">
              Invalid or expired link
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)] mb-8">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password" className="btn-primary w-full justify-center py-4">
              Request new reset link
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-subtle)] to-white pointer-events-none" />
        
        <header className="p-6 relative">
          <div className="container-wide flex items-center justify-between">
            <Link to="/" className="text-[16px] font-medium tracking-tight">
              Relay
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-12 px-6 relative">
          <div className="w-full max-w-[420px] text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-[24px] font-medium text-[var(--text)] mb-3">
              Password reset successful
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)] mb-8">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Link to="/login" className="btn-primary w-full justify-center py-4">
              Sign in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-subtle)] to-white pointer-events-none" />
      
      <header className="p-6 relative">
        <div className="container-wide flex items-center justify-between">
          <Link to="/" className="text-[16px] font-medium tracking-tight">
            Relay
          </Link>
          <Link to="/login" className="flex items-center gap-1.5 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-6 relative">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <h1 className="text-[28px] font-medium text-[var(--text)] mb-2 tracking-tight">
              Create new password
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)]">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="input pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="input pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <p className="text-[13px] text-[var(--text-tertiary)]">
              At least 8 characters
            </p>

            {error && (
              <div className="p-4 bg-red-50 rounded-full text-red-600 text-[14px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="btn-primary w-full justify-center py-4 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Reset password'
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-6 text-center text-[14px] text-[var(--text-tertiary)] relative">
        <div className="flex items-center justify-center gap-6">
          <Link to="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-[var(--text)] transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
