import type { ConverterRoute } from '@/app/routes'
import { Container } from '@/components/layout/Container'

const steps = [
  {
    title: 'Select HEIC Photos',
    body: 'Drop or browse iPhone photos directly from your Mac, Windows PC, or Chromebook file explorer.',
  },
  {
    title: 'Choose Format & Quality',
    body: 'Pick JPG, PNG, WebP, or PDF, then fine-tune compression or resize the longest edge.',
  },
  {
    title: 'Instant Local Decode',
    body: 'Your browser decodes the image with a WebAssembly build of libheif, directly in memory.',
  },
  {
    title: 'Download Individual or ZIP',
    body: 'Save files as they finish, or grab the whole batch in one archive. Your originals stay untouched.',
  },
]

export function HowItWorks({ route }: { route: ConverterRoute }) {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-canvas py-12 sm:py-14">
      <Container>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-headline-lg text-ink">Convert Apple HEIC in 4 Instant Steps</h2>
          <p className="mt-2 text-body-md text-ink-secondary">
            Zero cloud bottlenecks. The entire {route.keyword} pipeline executes inside your browser
            runtime.
          </p>
        </div>

        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-line bg-surface p-5 shadow-card">
              <div className="mb-3 grid h-8 w-8 place-items-center rounded-lg bg-primary-soft font-mono text-sm font-bold text-primary">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="mb-1 text-control text-ink">{step.title}</h3>
              <p className="text-xs leading-relaxed text-ink-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
