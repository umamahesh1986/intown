Web photo sharing
=================

Merchant photos can be displayed without CORS permission, but canvas export requires it.
The exporter loads INtown S3 uploads through `/api/share-image` on the app origin.
Other image sources are loaded directly and must permit CORS export.
Metro and `node serve-web.js` both provide this route. Restart Metro after changing
its configuration.

When deploying the web export to static-only hosting, route `/api/share-image` to
the Node middleware in `share-image-middleware.cjs`, or configure the image bucket
to allow anonymous GET requests from the web app origin. An alternative first-party
gateway URL can be set at build time with `EXPO_PUBLIC_SHARE_IMAGE_PROXY_URL`; a
cross-origin gateway must itself allow the web app origin through CORS.

The gateway accepts only HTTPS raster images from the INtown development bucket,
rejects redirects, limits downloads to 15 MiB and times out after 15 seconds.
Additional trusted bucket hostnames can be configured on the server with
`SHARE_IMAGE_HOSTS` (comma separated exact hostnames).

Mobile browsers with file sharing use the system share sheet. Desktop browsers
without file sharing download the post and copy its caption for manual attachment
to Facebook, Instagram or WhatsApp. Native apps capture the preview using view-shot.
