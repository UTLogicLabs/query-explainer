import { Link } from "react-router";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
      <nav className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="font-semibold text-sm tracking-tight text-foreground hover:text-primary transition-colors"
        >
          Query Explainer
        </Link>
        <a
          href="https://github.com/UTLogicLabs/query-explainer"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
