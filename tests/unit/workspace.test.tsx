import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { converterRoutes } from '@/app/routes'
import { Workspace } from '@/components/workspace/Workspace'
import { useQueueStore } from '@/store/queue'

afterEach(() => {
  useQueueStore.getState().clear()
})

describe('Workspace', () => {
  it('renders the workspace and all format tabs', () => {
    render(
      <MemoryRouter>
        <Workspace route={converterRoutes[0]} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Batch queue')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'JPG' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'PNG' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'WebP' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PDF' })).toBeInTheDocument()
    expect(screen.getByText('No photos yet — drop files above to build your batch.')).toBeInTheDocument()
  })

  it('locks the quality slider for PNG', () => {
    render(
      <MemoryRouter>
        <Workspace route={converterRoutes[1]} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Output quality')).toBeDisabled()
    expect(screen.getByText('Lossless')).toBeInTheDocument()
  })

  it('keeps conversion disabled until a photo is queued', () => {
    render(
      <MemoryRouter>
        <Workspace route={converterRoutes[0]} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /Convert photos/ })).toBeDisabled()
  })

  it('enables PDF conversion once a photo is queued', () => {
    useQueueStore.getState().addFiles([new File(['x'], 'IMG_1.HEIC')])

    render(
      <MemoryRouter>
        <Workspace route={converterRoutes[3]} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /Convert photos/ })).toBeEnabled()
    expect(screen.getByLabelText('Page size')).toBeInTheDocument()
  })
})
