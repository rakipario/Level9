export default function Footer() {
  return (
    <footer className="py-12 border-t border-neutral-200">
      <div className="container-narrow">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-sm font-medium text-neutral-900">
            Relay
          </span>

          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <a href="#" className="hover:text-neutral-900 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-neutral-900 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-neutral-900 transition-colors">
              Security
            </a>
            <a href="#" className="hover:text-neutral-900 transition-colors">
              Contact
            </a>
          </div>

          <span className="text-sm text-neutral-400">
            © 2026
          </span>
        </div>
      </div>
    </footer>
  );
}
