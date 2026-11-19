import type { ConverterRoute } from '@/app/routes'
import { Container } from '@/components/layout/Container'
import { Icon, type IconName } from '@/components/ui/Icon'

const trustItems: Array<{ icon: IconName; label: string; tone: string }> = [
  { icon: 'shield', label: '100% Private & Local', tone: 'text-success' },
  { icon: 'sparkles', label: 'EXIF & GPS removed', tone: 'text-primary' },
  { icon: 'layers', label: 'Batch Convert up to 30 Photos', tone: 'text-ink-secondary' },
  { icon: 'globe', label: 'Works 100% Offline', tone: 'text-ink-secondary' },
]

function Headline({ route }: { route: ConverterRoute }) {
  const index = route.h1.indexOf(route.h1Accent)
  if (index === -1) return <>{route.h1}</>

  const before = route.h1.slice(0, index)
  const after = route.h1.slice(index + route.h1Accent.length)

  return (
    <>
      {before}
      <span className="underline decoration-primary/35 decoration-wavy decoration-2 underline-offset-[10px]">
        {route.h1Accent}
      </span>
      {after}
    </>
  )
}

export function Hero({ route }: { route: ConverterRoute }) {
  return (
    <section className="w-full pb-6 pt-6 text-center sm:pt-8">
      <Container width="workspace">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <h1 className="text-balance text-headline-xl-mobile leading-tight text-ink sm:text-headline-xl">
            <Headline route={route} />
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-ink-secondary">{route.intro}</p>

          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-ink-secondary">
            {trustItems.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5 whitespace-nowrap">
                <Icon name={item.icon} className={`h-4 w-4 shrink-0 ${item.tone}`} />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
