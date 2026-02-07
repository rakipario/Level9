import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-50/80 backdrop-blur-sm">
        <div className="container-wide">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <a href="#" className="text-sm font-semibold tracking-tight">
              Relay
            </a>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                How it works
              </a>
              <a href="#agents" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                Agents
              </a>
              <a href="#pricing" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                Pricing
              </a>
              <a href="#" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                Docs
              </a>
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-4">
              <a href="#" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                Log in
              </a>
              <a href="#" className="btn-primary text-sm py-2">
                Get started
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-neutral-600"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-neutral-50 md:hidden pt-14">
          <div className="flex flex-col p-6 gap-4">
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-lg text-neutral-900">
              How it works
            </a>
            <a href="#agents" onClick={() => setMobileOpen(false)} className="text-lg text-neutral-900">
              Agents
            </a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-lg text-neutral-900">
              Pricing
            </a>
            <a href="#" onClick={() => setMobileOpen(false)} className="text-lg text-neutral-900">
              Docs
            </a>
            <div className="pt-4 border-t border-neutral-200">
              <a href="#" className="btn-primary w-full justify-center">
                Get started
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
