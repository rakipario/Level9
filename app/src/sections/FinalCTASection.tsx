import { ArrowRight, Check } from 'lucide-react';

const benefits = [
  'No credit card required',
  'Free forever plan',
  'Cancel anytime',
];

export default function FinalCTASection() {
  return (
    <section className="section bg-slate-900 text-white">
      <div className="container-main">
        <div className="max-w-3xl mx-auto text-center animate-on-scroll">
          <h2 className="text-3xl md:text-5xl font-semibold mb-6">
            Ready to automate your work?
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Join thousands of teams using Relay to build AI agents that work 24/7.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Building Free
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 border border-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              View Demo
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-400" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 pt-10 border-t border-slate-800">
        <div className="container-main">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <svg className="h-4 w-4 text-white" fill="white" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="text-lg font-semibold">Relay</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <p className="text-sm text-slate-500">
              © 2026 Relay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
}
