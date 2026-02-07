import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid email or password');
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
          <Link to="/" className="flex items-center gap-1.5 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-6 relative">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-10">
            <h1 className="text-[28px] font-medium text-[var(--text)] mb-2 tracking-tight">
              Welcome back
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)]">
              Sign in to your account
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
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

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
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

            <div className="flex items-center justify-between text-[14px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-full border-[var(--border)] w-4 h-4 accent-[var(--accent)]" 
                />
                <span className="text-[var(--text-secondary)]">Remember me</span>
              </label>
              <Link to="/forgot-password" className="link text-[14px]">Forgot password?</Link>
            </div>

            {error && (
              <div className="p-4 bg-red-50 rounded-full text-red-600 text-[14px]">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full justify-center py-4 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-[14px] text-[var(--text-secondary)]">
              Don't have an account?{' '}
              <Link to="/signup" className="link font-medium">Sign up</Link>
            </p>
          </div>
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
