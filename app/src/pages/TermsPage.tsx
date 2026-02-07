import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

export default function TermsPage() {
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
            <h1 className="text-[32px] font-medium text-[var(--text)] mb-3 tracking-tight">Terms of Service</h1>
            <p className="text-[14px] text-[var(--text-tertiary)]">Last updated: February 2026</p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">1. Acceptance of Terms</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                By accessing or using Relay, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">2. Description of Service</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                Relay provides a platform for building, training, and deploying AI agents. 
                We reserve the right to modify, suspend, or discontinue the service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">3. User Accounts</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                You are responsible for maintaining the confidentiality of your account 
                credentials and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">4. Acceptable Use</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-4">
                You agree not to use the service for:
              </p>
              <ul className="space-y-3">
                {['Any illegal activities', 'Harassment or abuse', 'Distribution of malware', 'Unauthorized access to systems', 'Activities that violate others\' rights'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-[var(--text-secondary)]">
                    <span className="h-5 w-5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">5. Payment Terms</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                Certain features require payment. You agree to pay all fees associated with 
                your selected plan. All payments are non-refundable unless otherwise stated.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">6. Intellectual Property</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                Relay retains all rights to our platform and technology. You retain ownership 
                of the content and data you create using our service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">7. Limitation of Liability</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                Relay shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">8. Contact</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@relay.ai" className="link">legal@relay.ai</a>.
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
