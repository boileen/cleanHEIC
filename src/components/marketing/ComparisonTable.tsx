import type { ConverterRoute, OutputFormat } from '@/app/routes'
import { Container } from '@/components/layout/Container'
import { Icon } from '@/components/ui/Icon'

type StatusTone = 'good' | 'warn' | 'muted'

interface FormatRow {
  format: OutputFormat | 'heic'
  label: string
  badge?: string
  size: string
  sizeTone: StatusTone
  compatibility: { label: string; tone: StatusTone }
  transparency: { label: string; tone: StatusTone }
  bestFor: string
}

const rows: FormatRow[] = [
  {
    format: 'heic',
    label: 'Apple HEIC',
    badge: 'Input',
    size: '1.5 – 3.5 MB',
    sizeTone: 'good',
    compatibility: { label: 'Apple devices only', tone: 'warn' },
    transparency: { label: 'Yes (alpha)', tone: 'muted' },
    bestFor: 'Direct Apple Camera storage to save iOS space',
  },
  {
    format: 'jpg',
    label: 'Standard JPG',
    badge: 'Recommended',
    size: '600 KB – 1.8 MB',
    sizeTone: 'muted',
    compatibility: { label: '100% universal (all OS)', tone: 'good' },
    transparency: { label: 'No', tone: 'muted' },
    bestFor: 'Windows, Android, web portals, government forms, printing',
  },
  {
    format: 'png',
    label: 'Lossless PNG',
    size: '5.0 – 12.0 MB',
    sizeTone: 'warn',
    compatibility: { label: '100% universal', tone: 'good' },
    transparency: { label: 'Yes (full alpha)', tone: 'good' },
    bestFor: 'Graphic design, diagrams, UI assets that need transparency',
  },
  {
    format: 'webp',
    label: 'Google WebP',
    size: '450 KB – 1.1 MB',
    sizeTone: 'good',
    compatibility: { label: 'Current major browsers', tone: 'good' },
    transparency: { label: 'Yes', tone: 'good' },
    bestFor: 'Modern website publishing, CMS and CDN media optimisation',
  },
  {
    format: 'pdf',
    label: 'Standard PDF',
    size: '1.0 – 3.0 MB',
    sizeTone: 'muted',
    compatibility: { label: 'Document readers', tone: 'good' },
    transparency: { label: 'No', tone: 'muted' },
    bestFor: 'Document filings, leases, records, and printing',
  },
]

const toneClasses: Record<StatusTone, string> = {
  good: 'text-success',
  warn: 'text-danger',
  muted: 'text-ink-muted',
}

const sizeToneClasses: Record<StatusTone, string> = {
  good: 'text-success',
  warn: 'text-danger',
  muted: 'text-ink-secondary',
}

function StatusIcon({ tone }: { tone: StatusTone }) {
  if (tone === 'good') return <Icon name="check" className="h-4 w-4" />
  if (tone === 'warn') return <Icon name="warning" className="h-4 w-4" />
  return <Icon name="x" className="h-4 w-4" />
}

export function ComparisonTable({ route }: { route: ConverterRoute }) {
  return (
    <section id="formats" className="scroll-mt-24 bg-canvas py-12 sm:py-14">
      <Container>
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-headline-lg text-ink">HEIC vs. JPG vs. PNG vs. WebP vs. PDF</h2>
          <p className="mt-2 text-body-md text-ink-secondary">
            Which format should you convert your iPhone photos to?
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <caption className="sr-only">
                Comparison of HEIC, JPG, PNG, WebP, and PDF formats
              </caption>
              <thead>
                <tr className="bg-canvas font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                  {['Format', 'Typical file size', 'Compatibility', 'Transparency', 'Best use case'].map(
                    (heading) => (
                      <th key={heading} scope="col" className="px-5 py-3.5 font-medium">
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-body-md">
                {rows.map((row) => {
                  const isActive = row.format === route.defaultFormat
                  return (
                    <tr key={row.label} className={isActive ? 'bg-primary-soft/50' : undefined}>
                      <th scope="row" className="whitespace-nowrap px-5 py-4 text-left">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-sm font-bold ${
                              isActive ? 'text-primary' : 'text-ink'
                            }`}
                          >
                            {row.label}
                          </span>
                          {row.badge ? (
                            <span
                              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${
                                row.badge === 'Recommended'
                                  ? 'bg-primary text-white'
                                  : 'bg-canvas text-ink-muted'
                              }`}
                            >
                              {row.badge}
                            </span>
                          ) : null}
                          {isActive && !row.badge ? (
                            <span className="rounded-full bg-success-bg px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-success">
                              Selected
                            </span>
                          ) : null}
                        </div>
                      </th>
                      <td
                        className={`whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold ${sizeToneClasses[row.sizeTone]}`}
                      >
                        {row.size}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${toneClasses[row.compatibility.tone]}`}
                        >
                          <StatusIcon tone={row.compatibility.tone} />
                          {row.compatibility.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${toneClasses[row.transparency.tone]}`}
                        >
                          <StatusIcon tone={row.transparency.tone} />
                          {row.transparency.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-ink-secondary">{row.bestFor}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </section>
  )
}
