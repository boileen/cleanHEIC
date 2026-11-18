import { Link } from 'react-router-dom'

import { Container } from '@/components/layout/Container'
import { Icon } from '@/components/ui/Icon'

export function NotFoundPage() {
  return (
    <Container className="py-24 text-center">
      <span className="eyebrow">
        <Icon name="file" className="h-3.5 w-3.5" />
        404
      </span>
      <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.03em] text-ink">
        That page does not exist
      </h1>
      <p className="mx-auto mt-3 max-w-md text-base leading-7 text-ink-secondary">
        The converter link may be out of date. Start from the main HEIC to JPG workspace instead.
      </p>
      <Link to="/heic-to-jpg" className="btn-primary mt-6">
        Go to the converter
        <Icon name="arrow-right" className="h-4 w-4" />
      </Link>
    </Container>
  )
}
