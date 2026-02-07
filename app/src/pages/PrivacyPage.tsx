import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl z-10">
        <div className="container-wide py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-[15px] font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            Relay
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="py-16 px-6">
        <div className="container-site max-w-2xl">
          <div className="mb-12">
            <h1 className="text-[32px] font-medium text-[var(--text)] mb-3 tracking-tight">Privacy Policy</h1>
            <p className="text-[14px] text-[var(--text-tertiary)]">Last updated: February 2026</p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">1. Introduction</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                At Relay, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">2. Information We Collect</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="space-y-3">
                {['Account information (name, email, password)', 'Payment information', 'Agent configurations and training data', 'Usage data and analytics'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-[var(--text-secondary)]">
                    <span className="h-5 w-5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">3. How We Use Your Information</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="space-y-3">
                {['Provide and maintain our services', 'Process transactions', 'Improve our platform', 'Communicate with you', 'Ensure security and prevent fraud'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-[var(--text-secondary)]">
                    <span className="h-5 w-5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">4. Data Security</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                We implement appropriate technical and organizational measures to protect your data. 
                All data is encrypted in transit and at rest using industry-standard encryption.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">5. Your Rights</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                You have the right to access, correct, or delete your personal information. 
                You may also object to or restrict certain processing of your data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">6. Contact Us</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@relay.ai" className="link">privacy@relay.ai</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border)]">
        <div className="container-site text-center">
          <Link to="/" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
            ← Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
