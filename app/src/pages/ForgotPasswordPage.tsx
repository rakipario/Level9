import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, CheckCircle, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
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
          <Link to="/login" className="flex items-center gap-1.5 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-6 relative">
        <div className="w-full max-w-[420px]">
          {!success ? (
            <>
              <div className="text-center mb-10">
                <div className="w-14 h-14 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <h1 className="text-[28px] font-medium text-[var(--text)] mb-2 tracking-tight">
                  Reset your password
                </h1>
                <p className="text-[15px] text-[var(--text-secondary)]">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="input"
                    required
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 rounded-full text-red-600 text-[14px]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="btn-primary w-full justify-center py-4 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-[14px] text-[var(--text-secondary)]">
                  Remember your password?{' '}
                  <Link to="/login" className="link font-medium">Sign in</Link>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-[24px] font-medium text-[var(--text)] mb-3">
                Check your email
              </h1>
              <p className="text-[15px] text-[var(--text-secondary)] mb-8">
                We've sent a password reset link to <strong>{email}</strong>.
                Click the link in the email to reset your password.
              </p>
              <div className="space-y-3">
                <Link to="/login" className="btn-primary w-full justify-center py-4">
                  Back to login
                </Link>
                <button
                  onClick={() => setSuccess(false)}
                  className="link text-[14px]"
                >
                  Didn't receive it? Try again
                </button>
              </div>
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
