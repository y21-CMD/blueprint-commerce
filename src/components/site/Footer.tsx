import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="font-display text-2xl text-primary">Lestationery</h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Quietly made paper goods, pressed and bound by hand in small
            batches. Designed for slow correspondence and considered notes.
          </p>
        </div>
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Shop
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/catalog" className="hover:text-primary">All goods</Link></li>
            <li><Link to="/about" className="hover:text-primary">Our story</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Account
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-primary">Sign in</Link></li>
            <li><Link to="/signup" className="hover:text-primary">Create account</Link></li>
            <li><Link to="/dashboard" className="hover:text-primary">My orders</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lestationery — Made slowly, with care.
      </div>
    </footer>
  );
}
