import type { ConverterRoute } from '@/app/routes'
import { Container } from '@/components/layout/Container'
import { Icon } from '@/components/ui/Icon'
import { getFaqs } from '@/content/faqs'

export function Faq({ route }: { route: ConverterRoute }) {
  const faqs = getFaqs(route)

  return (
    <section id="faq" className="scroll-mt-24 bg-surface py-14 sm:py-16">
      <Container>
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-headline-lg text-ink">Frequently Asked Questions</h2>
          <p className="mt-2 text-body-md text-ink-secondary">
            Clear answers about the {route.keyword} workflow, quality, and privacy.
          </p>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col gap-3.5">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-line bg-surface shadow-card transition-shadow open:shadow-raised"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-base font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                {faq.question}
                <Icon
                  name="chevron-down"
                  className="h-5 w-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="border-t border-line px-5 pb-5 pt-3 text-body-md leading-relaxed text-ink-secondary">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}
