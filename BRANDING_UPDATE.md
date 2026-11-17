# INtown logo replacement

The supplied `INtown-logo.jpeg` is stored unchanged at
`frontend/assets/branding/intown-logo.jpeg` (1600 x 781).
`frontend/scripts/generate-brand-assets.cjs` packages it into app, adaptive,
splash, favicon, checkout and social-preview images without redrawing the logo.
Square variants crop surrounding orange space and preserve the central mark.

Updated locations:

- Login, initial loading screen, dashboard header, member and dual support screens.
- Footer sharing badge, merchant share preview, native offer-card export and
  browser canvas export.
- Customer checkout, merchant registration checkout and merchant plan checkout.
  Embedded PNG data replaces the old remote checkout logo.
- Expo Android/iOS app icon configuration, Android adaptive icon configuration,
  splash configuration and web favicon.
- Existing Android launcher and splash resources in every density. Launcher
  resources now use PNG; resource names remain unchanged.
- Legacy assets/images icon, favicon and splash images, to avoid stale fallback art.
- App HTML Open Graph/Twitter image metadata, Apple touch icon and public web assets.

## Release steps

1. Build and install new Android/iOS binaries. Installed launcher icons and native
   splash resources do not change through a JavaScript-only update.
2. Deploy the web app with `frontend/public/brand/` included. The social preview is
   `/brand/share-preview-in-20261118.png`, with size 1200 x 630 and an opaque orange background.
3. Merchant shares use `https://intownlocal.com/download?brand=in-logo-20261118`
   to avoid the old link's cached thumbnail. Its deployed HTML must
   include `og:image` and `twitter:image` pointing to
   `https://intownlocal.com/brand/share-preview-in-20261118.png`. If the download page is served
   by a separate website, its matching source updates have also been applied in
   `D:/INtownWebsite/IntownWebsite/frontend`: header, logo assets, favicon,
   manifest, checkout logo and social metadata. Deploy that website separately.
   `frontend/scripts/sync-website-brand.cjs` reviews these scoped updates by
   default; pass `--apply` to synchronize them again.
4. Refresh the Facebook/WhatsApp link-preview cache after deployment. Already sent
   messages can continue showing cached thumbnails. App Store/Play listing images
   and any externally hosted promotional videos are managed separately.

Validation: `node scripts/test-branding.cjs`,
`node scripts/test-shop-share-text.cjs` and
`node scripts/test-merchant-auto-registration.cjs`.
