import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'

import App from '@/app/App'

/**
 * Renders the whole app for one path into HTML. Used by
 * `scripts/prerender.mjs` at build time so each converter route ships real
 * markup instead of an empty `<div id="root">`. Effects (like the canonical
 * link written by `useDocumentMeta`) do not run on the server; the prerender
 * script injects that metadata into <head> itself.
 */
export { converterRoutes } from '@/app/routes'

export function render(pathname: string): string {
  return renderToString(
    <StaticRouter location={pathname}>
      <App />
    </StaticRouter>,
  )
}
