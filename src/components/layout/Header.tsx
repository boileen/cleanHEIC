import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { converterRoutes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
      isActive
        ? 'bg-primary-soft text-primary'
        : 'text-ink-secondary hover:text-ink',
    ].join(' ')

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-shell items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center lg:flex-1">
          <NavLink to="/heic-to-jpg" className="flex min-w-0 items-center gap-3" aria-label="ClearHEIC home">
            <img
              src="/brand/clearheic-mark.svg"
              alt=""
              width={38}
              height={38}
              aria-hidden="true"
              className="h-[38px] w-[38px] shrink-0"
            />
            <span className="min-w-0 text-[20px] font-extrabold leading-none tracking-tight sm:text-[22px]">
              <span className="text-ink">Clear</span>
              <span className="text-primary">HEIC</span>
            </span>
          </NavLink>
        </div>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Converter formats">
          {converterRoutes.map((route) => (
            <NavLink key={route.path} to={route.path} className={linkClass}>
              {route.navLabel}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:flex-1 lg:justify-end">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface text-ink-secondary lg:hidden"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-nav"
          className="border-t border-line bg-surface px-4 py-3 lg:hidden"
          aria-label="Converter formats"
        >
          <div className="mx-auto grid max-w-shell gap-1">
            {converterRoutes.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    isActive ? 'bg-primary-soft text-primary' : 'text-ink-secondary hover:text-ink'
                  }`
                }
              >
                {route.navLabel}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
