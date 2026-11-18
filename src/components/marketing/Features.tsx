import { Container } from '@/components/layout/Container'
import { Icon, type IconName } from '@/components/ui/Icon'

interface Feature {
  title: string
  body: string
  icon: IconName
  note: string
  noteIcon: IconName
  tone: 'success' | 'primary' | 'neutral'
  strongNote?: boolean
}

const features: Feature[] = [
  {
    title: 'Zero Server Uploads',
    body: 'Your photos never touch a remote server. Everything is decoded inside your browser sandbox using a compiled WebAssembly module — practical for ID documents, receipts, and personal photos.',
    icon: 'shield',
    note: 'Nothing leaves this device',
    noteIcon: 'lock',
    tone: 'success',
    strongNote: true,
  },
  {
    title: 'Batch HEIC Processing',
    body: 'Queue up to 30 files. The scheduler runs a couple of conversions at a time so the tab stays responsive and memory use stays bounded.',
    icon: 'bolt',
    note: '2 workers on desktop · 1 on mobile',
    noteIcon: 'cpu',
    tone: 'primary',
  },
  {
    title: 'Smart Quality & Size Control',
    body: 'Fine-tune JPG and WebP quality from 10% to 100%, or downscale the longest edge for web publishing, email attachments, and forms.',
    icon: 'sliders',
    note: 'Real-time size feedback',
    noteIcon: 'layers',
    tone: 'neutral',
  },
  {
    title: 'Automatic EXIF & GPS Removal',
    body: 'Location coordinates, camera details, and capture timestamps are removed from every output file before it reaches your downloads folder.',
    icon: 'lock',
    note: 'Sanitised output files',
    noteIcon: 'shield',
    tone: 'primary',
  },
  {
    title: 'Multi-Format Support',
    body: 'Export universal JPG, lossless PNG, modern WebP, or a printable PDF — without installing a desktop converter or a codec pack.',
    icon: 'layers',
    note: 'JPG · PNG · WebP · PDF',
    noteIcon: 'file',
    tone: 'neutral',
  },
  {
    title: 'Works Offline After Load',
    body: 'The decoder runs locally, so image data never needs a connection. Once the page and engine are cached, conversion does not depend on the network.',
    icon: 'globe',
    note: 'No upload endpoints',
    noteIcon: 'globe',
    tone: 'success',
    strongNote: true,
  },
]

const tones: Record<Feature['tone'], string> = {
  success: 'bg-success-bg text-success',
  primary: 'bg-primary-soft text-primary',
  neutral: 'bg-canvas text-ink-secondary',
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 bg-surface py-12 sm:py-14">
      <Container>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-headline-lg text-ink">Engineered for Absolute Speed and Privacy</h2>
        </div>

        <ul className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-6 shadow-card"
            >
              <div>
                <div
                  className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${tones[feature.tone]}`}
                >
                  <Icon name={feature.icon} className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-headline-md text-ink">{feature.title}</h3>
                <p className="text-body-md leading-relaxed text-ink-secondary">{feature.body}</p>
              </div>
              <div
                className={`mt-4 flex items-center gap-1.5 pt-3 font-mono text-xs ${
                  feature.strongNote ? 'font-semibold text-success' : 'text-ink-muted'
                }`}
              >
                <Icon name={feature.noteIcon} className="h-4 w-4" />
                <span>{feature.note}</span>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
