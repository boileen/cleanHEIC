import { Navigate, Route, Routes } from 'react-router-dom'

import { converterRoutes } from '@/app/routes'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { ConverterPage } from '@/pages/ConverterPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Navigate to="/heic-to-jpg" replace />} />
        <Route path="heif-to-jpg" element={<Navigate to="/heic-to-jpg" replace />} />
        {converterRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path.replace(/^\//, '')}
            element={<ConverterPage />}
          />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
