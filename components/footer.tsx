import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-foreground">PlusOne</span>
            <nav className="flex items-center gap-3" aria-label="Footer navigation">
              <Link href="/leagues" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                Leagues
              </Link>
              <Link href="/matches" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                Matches
              </Link>
              <Link href="/players" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                Players
              </Link>
              <Link href="/predictions" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                Predictions
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} +1 Goals Match Classifier. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <p>
              For analytical purposes only.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
