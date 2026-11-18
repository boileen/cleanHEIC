import { Container } from '@/components/layout/Container'
import { Icon } from '@/components/ui/Icon'

export function CtaBanner() {
  return (
    <section className="pb-16">
      <Container>
        <div className="flex flex-col items-center rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
          <h2 className="text-headline-md text-ink">Ready to convert your iPhone photos?</h2>
          <p className="mt-1 max-w-md text-body-md text-ink-secondary">
            No software to install, no sign-ups. Everything runs in this browser tab.
          </p>
          <button
            type="button"
            onClick={() =>
              document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-control text-white shadow-md transition-colors hover:bg-primary-hover"
          >
            <Icon name="arrow-right" className="h-4 w-4 rotate-[-90deg]" />
            Back to converter
          </button>
        </div>
      </Container>
    </section>
  )
}
