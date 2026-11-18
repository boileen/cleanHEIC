import { useLocation } from 'react-router-dom'

import { getConverterRoute } from '@/app/routes'
import { ComparisonTable } from '@/components/marketing/ComparisonTable'
import { CtaBanner } from '@/components/marketing/CtaBanner'
import { Faq } from '@/components/marketing/Faq'
import { Features } from '@/components/marketing/Features'
import { Hero } from '@/components/marketing/Hero'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { Workspace } from '@/components/workspace/Workspace'
import { useDocumentMeta } from '@/lib/useDocumentMeta'

export function ConverterPage() {
  const { pathname } = useLocation()
  const route = getConverterRoute(pathname)

  useDocumentMeta(route)

  return (
    <>
      <Hero route={route} />
      <Workspace route={route} />
      <HowItWorks route={route} />
      <Features />
      <ComparisonTable route={route} />
      <Faq route={route} />
      <CtaBanner />
    </>
  )
}
