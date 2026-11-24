# Deploying ClearHEIC

ClearHEIC is a static site. The host only serves files — there is no Node.js
process, no build step on the server, and no upload endpoint.

## Build locally

Requires Node.js 22+ (Vite 8).

```bash
npm ci
npm run build
```

The build runs typechecking, the client build, the SSR build, pre-renders all 17
pages (4 converters, `/guides` and 12 articles), and validates SEO output. It
fails the build if a page is missing a title, H1 or canonical, or if two pages
share one.

`dist/` is the complete deployable site. It includes `.htaccess`, which is
copied from `public/.htaccess` by Vite. Run `npm run package` afterwards to
create `clearheic-cpanel-upload.zip` — it packages the *contents* of `dist/`
with forward-slash paths so cPanel extracts real folders.

Canonical URLs default to `https://clearheic.com`. For staging on another
domain, rebuild with the staging URL before packaging:

```powershell
$env:VITE_SITE_URL = 'https://staging.example.com'
npm run build
```

Remove the override (or start a fresh shell) and rebuild for production.

## cPanel upload

1. Log in to cPanel and open **File Manager**.
2. Enter `public_html` (the web root for `clearheic.com`).
3. Upload `clearheic-cpanel-upload.zip`.
4. Right-click the ZIP and choose **Extract**. Do not extract into a
   `clearheic` or `dist` subfolder — files must land directly in `public_html`.
5. Enable **Show Hidden Files** in File Manager settings and confirm that
   `.htaccess` is present alongside `index.html`, `sitemap.xml` and `robots.txt`.
6. If older files are present, delete them before extracting so stale assets
   do not remain.

The ZIP contains the *contents* of `dist/`, not the `dist/` directory itself,
and uses forward-slash paths so cPanel extracts real folders.

## Analytics and site verification

`index.html` loads Google Tag Manager container `GTM-WCFL58WL` on every page.
The container itself must be configured in Google Tag Manager to record anything;
the site only loads the manager script. `public/google72013dbe9aafc2b3.html` is a
Google Search Console ownership-verification file and must remain at the site
root.

## Verify after upload

| Check | Expected |
|---|---|
| `https://clearheic.com/heic-to-jpg` | Loads directly, no redirect to a trailing slash |
| `https://clearheic.com/guides` | Lists all 12 guides |
| `https://clearheic.com/guides/heic-to-jpg-on-iphone` | Article loads with sidebar/related guides |
| `https://clearheic.com/sitemap.xml` | Lists 17 URLs |
| `https://clearheic.com/robots.txt` | References the sitemap |
| View source on a converter route | Real `<h1>`, title and canonical in the HTML |

If a URL falls back to the React shell instead of the pre-rendered page, check
that `.htaccess` was uploaded and that `mod_rewrite` is enabled. The `.htaccess`
uses `RewriteBase /`, so the site must be deployed at the domain root.
