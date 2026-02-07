import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const verifyEmail = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to verify email');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  const resendEmail = async () => {
    setResendLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        setResendSuccess(true);
      }
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-subtle)] to-white pointer-events-none" />

      <header className="p-6 relative">
        <div className="container-wide flex items-center justify-between">
          <Link to="/" className="text-[16px] font-medium tracking-tight">
            Relay
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-6 relative">
        <div className="w-full max-w-[420px] text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mb-6">
                <Loader2 className="h-8 w-8 text-[var(--accent)] animate-spin" />
              </div>
              <h1 className="text-[24px] font-medium text-[var(--text)] mb-2">
                Verifying your email
              </h1>
              <p className="text-[15px] text-[var(--text-secondary)]">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-[24px] font-medium text-[var(--text)] mb-2">
                Email verified!
              </h1>
              <p className="text-[15px] text-[var(--text-secondary)] mb-8">
                {message}
              </p>
              <Link to="/select-plan" className="btn-primary w-full justify-center py-4">
                Continue to select your plan
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-[24px] font-medium text-[var(--text)] mb-2">
                Verification failed
              </h1>
              <p className="text-[15px] text-[var(--text-secondary)] mb-8">
                {message}
              </p>

              {!resendSuccess ? (
                <button
                  onClick={resendEmail}
                  disabled={resendLoading}
                  className="btn-secondary w-full justify-center py-4 mb-4"
                >
                  {resendLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Resend verification email
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 bg-green-50 rounded-full text-green-600 text-[14px] mb-4">
                  Verification email resent!
                </div>
              )}

              <Link to="/signup" className="link text-[14px]">
                Back to sign up
              </Link>
            </div>
          )}
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
