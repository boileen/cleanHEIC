import { Link } from 'react-router-dom'

import { converterRoutes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { Container } from './Container'

const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="mt-0 border-t border-line bg-surface">
      <Container width="shell" className="py-10">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="flex flex-col gap-3 md:col-span-6">
            <div className="flex items-center gap-3">
              <img
                src="/brand/clearheic-mark.svg"
                alt=""
                width={32}
                height={32}
                aria-hidden="true"
                className="h-8 w-8 shrink-0"
              />
              <span className="text-base font-extrabold tracking-tight">
                <span className="text-ink">Clear</span>
                <span className="text-primary">HEIC</span>
              </span>
            </div>
            <p className="max-w-md text-body-md text-ink-secondary">
              Zero server uploads. Your photos are decoded directly in browser memory using
              WebAssembly — practical for sensitive, medical, and personal iPhone captures.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="badge-success">
                <Icon name="lock" className="h-3.5 w-3.5" />
                Zero uploads
              </span>
              <span className="badge-neutral">
                <Icon name="cpu" className="h-3.5 w-3.5" />
                WebAssembly
              </span>
            </div>
            <p className="font-mono text-mono-caption text-ink-muted">
              © {CURRENT_YEAR} ClearHEIC. All conversions run locally via client-side WebAssembly.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:col-span-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink">
              Converters
            </span>
            <div className="flex flex-col gap-1.5">
              {converterRoutes.map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  className="text-body-md text-ink-secondary transition-colors hover:text-ink"
                >
                  {route.navLabel}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink">
              Trust &amp; privacy
            </span>
            <div className="flex flex-col gap-1.5">
              <a
                href="#privacy"
                className="text-body-md text-ink-secondary transition-colors hover:text-ink"
              >
                Privacy architecture
              </a>
              <a
                href="#how-it-works"
                className="text-body-md text-ink-secondary transition-colors hover:text-ink"
              >
                How conversion works
              </a>
              <a
                href="#formats"
                className="text-body-md text-ink-secondary transition-colors hover:text-ink"
              >
                Format guide
              </a>
              <a
                href="#faq"
                className="text-body-md text-ink-secondary transition-colors hover:text-ink"
              >
                FAQ
              </a>
            </div>
          </div>
        </div>

        <div
          id="privacy"
          className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between"
        >
          <p>All processing happens on your device. No accounts, no uploads, no tracking.</p>
          <p className="font-mono uppercase tracking-[0.12em]">// Local engine · zero uploads</p>
        </div>
      </Container>
    </footer>
  )
}
