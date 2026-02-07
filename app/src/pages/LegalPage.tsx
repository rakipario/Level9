import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

export default function LegalPage() {
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
            <h1 className="text-[32px] font-medium text-[var(--text)] mb-3 tracking-tight">Legal Notice</h1>
            <p className="text-[14px] text-[var(--text-tertiary)]">Last updated: February 2026</p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">Company Information</h2>
              <div className="bg-[var(--bg-subtle)] rounded-[24px] p-6">
                <div className="text-[15px] text-[var(--text-secondary)] leading-relaxed space-y-1">
                  <p className="text-[var(--text)] font-medium">Relay AI Inc.</p>
                  <p>123 Innovation Street</p>
                  <p>San Francisco, CA 94105</p>
                  <p>United States</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">Contact</h2>
              <div className="space-y-3">
                {[
                  { label: 'Email', value: 'contact@relay.ai' },
                  { label: 'Support', value: 'support@relay.ai' },
                  { label: 'Legal', value: 'legal@relay.ai' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-[15px]">
                    <span className="text-[var(--text-tertiary)] w-20">{item.label}</span>
                    <a href={`mailto:${item.value}`} className="link">{item.value}</a>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">Registration</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                Relay AI Inc. is a Delaware corporation registered in the United States.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">Tax Information</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                EIN: 12-3456789
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">Disclaimer</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                The information provided on this website is for general informational purposes only. 
                While we strive to keep the information accurate and up to date, we make no 
                representations or warranties of any kind about the completeness, accuracy, 
                reliability, or availability of the information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">Copyright</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                © 2026 Relay AI Inc. All rights reserved. All content on this website, including 
                text, graphics, logos, and software, is the property of Relay AI Inc. and is 
                protected by copyright and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-[var(--text)] mb-4">Trademarks</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                Relay and the Relay logo are trademarks of Relay AI Inc. All other trademarks 
                mentioned on this website are the property of their respective owners.
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
