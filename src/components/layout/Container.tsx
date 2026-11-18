import type { PropsWithChildren } from 'react'

type ContainerWidth = 'workspace' | 'sections' | 'shell'

const widths: Record<ContainerWidth, string> = {
  workspace: 'max-w-workspace',
  sections: 'max-w-sections',
  shell: 'max-w-shell',
}

export function Container({
  children,
  className = '',
  width = 'sections',
}: PropsWithChildren<{ className?: string; width?: ContainerWidth }>) {
  return (
    <div className={`mx-auto w-full ${widths[width]} px-4 sm:px-6 ${className}`}>{children}</div>
  )
}
