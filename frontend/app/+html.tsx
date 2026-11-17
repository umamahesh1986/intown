import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every web page during static rendering.
// The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#FF8A00" />
        <meta name="description" content="InTown - Shop Local, Save Instantly" />
        <title>InTown - Shop Local, Save Instantly</title>
        <link rel="icon" type="image/png" href="/brand/favicon.png" />
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
        <meta property="og:title" content="INtown - Shop Local, Save Instantly" />
        <meta property="og:description" content="Your trusted local shopping and rewards platform." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://intownlocal.com/brand/share-preview-in-20261118.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://intownlocal.com/brand/share-preview-in-20261118.png" />
        {/* Disable body scrolling on web */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          body {
            overflow: hidden;
          }
          #root {
            display: flex;
            flex-direction: column;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
