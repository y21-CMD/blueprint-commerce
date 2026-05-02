import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.jpg";

export function Footer() {
  return (
    <footer className="mt-24 bg-[var(--royal-deep)] text-white/80">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="My-Sea International"
              width={56}
              height={56}
              className="h-14 w-14 rounded-md bg-white object-contain p-1 shadow-soft"
            />
            <div>
              <p className="font-display text-2xl text-[var(--gold)]">My-Sea International</p>
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                Stationery · Import & Export
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60">
            A global stationery trading house — sourcing premium paper goods worldwide
            and exporting from East Africa. Sea freight, customs clearance, and B2B
            distribution, handled end to end.
          </p>
        </div>
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--gold)]/80">
            Trade
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/catalog" className="hover:text-[var(--gold)]">All products</Link></li>
            <li><Link to="/about" className="hover:text-[var(--gold)]">Our company</Link></li>
            <li><Link to="/contact" className="hover:text-[var(--gold)]">B2B inquiries</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--gold)]/80">
            Account
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-[var(--gold)]">Sign in</Link></li>
            <li><Link to="/signup" className="hover:text-[var(--gold)]">Create account</Link></li>
            <li><Link to="/dashboard" className="hover:text-[var(--gold)]">My orders</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} My-Sea International — Connecting makers, buyers, and ports worldwide.
      </div>
    </footer>
  );
}
